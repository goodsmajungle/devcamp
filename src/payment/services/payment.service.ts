import { HttpStatus, Injectable } from '@nestjs/common';
import { Coupon, Order, OrderItem, Product } from '../entities';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ProductDto } from '../dto/product.dto';
import { BusinessException } from '../../exception';
import { ProductService } from './product.service';
import {
  IssuedCouponRepository,
  OrderRepository,
  PointRepository,
  ShippingInfoRepository,
} from '../repositories';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class PaymentService {
  constructor(
    private readonly issuedCouponRepository: IssuedCouponRepository,
    private readonly pointRepository: PointRepository,
    private readonly productService: ProductService,
    private readonly shippingInfoRepository: ShippingInfoRepository,
    private readonly orderRepository: OrderRepository,
  ) {}


  @Transactional()
  async initOrder(dto: CreateOrderDto): Promise<Order> {
    // 재고 확인
    const enoughStock = await this.checkStock(dto.orderItems);
    if (enoughStock) {

      // product coupon적용
      

      // 주문 금액 계산
      const totalAmount = await this.calculateTotalAmount(dto.orderItems);
      

      // 할인 적용
      const finalAmount = await this.applyDiscountsShoppingCart(
        totalAmount,
        dto.userId,
        dto.couponId,
        dto.pointAmountToUse,
      );

      // 주문 생성
      return this.createOrder(
        dto.userId,
        dto.orderItems,
        finalAmount,
        dto.shippingAddress,
      );
    }
    else {
      throw new BusinessException(
        'product',
        `some Item stock is not enough`,
        `some Item stock is not enough`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Transactional()
  async completeOrder(orderId: string): Promise<Order> {
    return this.orderRepository.completeOrder(orderId);    
  }

  async checkStock(orderItems:OrderItem[]){
    for (const orderItem of orderItems){
      const enoughStock = this.productService.checkStockAvailability(orderItem.id, orderItem.quantity);
      if (!enoughStock){
        return false;
      }
    }
    return true;
  }


  private async createOrder(
    userId: string,
    orderItems: OrderItem[],
    finalAmount: number,
    shippingAddress?: string,
  ): Promise<Order> {
    const shippingInfo = shippingAddress
      ? await this.shippingInfoRepository.createShippingInfo(shippingAddress)
      : null;
    return await this.orderRepository.createOrder(
      userId,
      orderItems,
      finalAmount,
      shippingInfo,
    );
  }

  // 쿠폰디스카운트 후, 포인트를 계산하는게 소비자에게 최고의 금액을 제공해주므로 해당 로직을 가져가는게 타당함.
  private async calculateTotalAmount(orderItems: OrderItem[]): Promise<number> {
    let totalAmount = 0;

    const productIds = orderItems.map((item) => item.productId);
    const products = await this.productService.getProductsByIds(productIds);
    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BusinessException(
          'payment',
          `Product with ID ${item.productId} not found`,
          'Invalid product',
          HttpStatus.BAD_REQUEST,
        );
      }

      totalAmount += product.price * item.quantity;
    }

    return totalAmount;
  }

  private async applyDiscountsProducts(
    userId: string,
    couponId: string,
    product: Product
  ): Promise<number> {
    
    const couponDiscount = couponId
      ? await this.applyProductCoupon(couponId, userId, product, product.price)
      : 0;

    // 최종 금액 계산
    const finalAmount = product.price - (couponDiscount);
    return finalAmount < 0 ? 0 : finalAmount;
  }

  private async applyDiscountsShoppingCart(
    totalAmount: number,
    userId: string,
    couponId: string,
    pointAmountToUse?: number,
  ): Promise<number> {
    
    const couponDiscount = couponId
      ? await this.applyShoppingCartCoupon(couponId, userId, totalAmount)
      : 0;
    const pointDiscount = pointAmountToUse
      ? await this.applyPoints(pointAmountToUse, userId)
      : 0;

    // 최종 금액 계산
    const finalAmount = totalAmount - (couponDiscount + pointDiscount);
    return finalAmount < 0 ? 0 : finalAmount;
  }


  // applyCoupon과 applyPoints에서 장바구니 쿠폰으로 할 것인지, 개별 쿠폰으로 할 것인지에 대한 수정 필요
  private async applyProductCoupon(
    couponId: string,
    userId: string,
    product: Product,
    productAmount: number,
  ): Promise<number> {
    const issuedCoupon = await this.issuedCouponRepository.findOne({
      where: {
        coupon: { id: couponId },
        user: { id: userId },
      },
    });

    if (!issuedCoupon) {
      throw new BusinessException(
        'payment',
        `user doesn't have coupon. couponId: ${couponId} userId: ${userId}`,
        'Invalid coupon',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isValid =
      issuedCoupon?.isValid &&
      issuedCoupon?.validFrom <= new Date() &&
      issuedCoupon?.validUntil > new Date();
    if (!isValid) {
      throw new BusinessException(
        'payment',
        `Invalid coupon type. couponId: ${couponId} userId: ${userId}`,
        'Invalid coupon',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { coupon } = issuedCoupon;
    if (coupon.target !== 'product'){
      throw new BusinessException(
        'payment',
        'shopping cart coupon can not be used in product',
        'shopping cart coupon can not be used in product',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (coupon.product != product){
      throw new BusinessException(
        'payment',
        `coupon for ${coupon.product} can not be used for ${coupon.product}`,
        `coupon for ${coupon.product} can not be used for ${coupon.product}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    
    
    if (coupon.type === 'percent') {
      return (productAmount * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      return coupon.value;
    }
    return 0;
  }  


  private async applyShoppingCartCoupon(
    couponId: string,
    userId: string,
    totalAmount: number,
  ): Promise<number> {
    const issuedCoupon = await this.issuedCouponRepository.findOne({
      where: {
        coupon: { id: couponId },
        user: { id: userId },
      },
    });

    if (!issuedCoupon) {
      throw new BusinessException(
        'payment',
        `user doesn't have coupon. couponId: ${couponId} userId: ${userId}`,
        'Invalid coupon',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isValid =
      issuedCoupon?.isValid &&
      issuedCoupon?.validFrom <= new Date() &&
      issuedCoupon?.validUntil > new Date();
    if (!isValid) {
      throw new BusinessException(
        'payment',
        `Invalid coupon type. couponId: ${couponId} userId: ${userId}`,
        'Invalid coupon',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { coupon } = issuedCoupon;
    if (coupon.target !== 'shoppingcart'){
      throw new BusinessException(
        'payment',
        'product coupon can not be used in shopping cart',
        'product coupon can not be used in shopping cart',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (coupon.type === 'percent') {
      return (totalAmount * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      return coupon.value;
    }
    return 0;
  }

  private async applyPoints(
    pointAmountToUse: number,
    userId: string,
  ): Promise<number> {
    const point = await this.pointRepository.findOne({
      where: { user: { id: userId } },
    });
    if (point.availableAmount < 0 || point.availableAmount < pointAmountToUse) {
      throw new BusinessException(
        'payment',
        `Invalid points amount ${point.availableAmount}`,
        'Invalid points',
        HttpStatus.BAD_REQUEST,
      );
    }

    return pointAmountToUse;
  }
}
