import { EntityManager, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Order, OrderItem, ShippingInfo } from '../entities';
import { UserRepository } from '../../auth/repositories';
import { IssuedCouponRepository } from './issued-coupon.repository';
import { PointRepository } from './point.repository';
import { ShoppingCart } from '../entities/shopping-cart.entity';

@Injectable()
export class ShoppingCartRepository extends Repository<ShoppingCart> {
  constructor(
    @InjectRepository(ShoppingCart)
    private readonly repo: Repository<ShoppingCart>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly userRepository: UserRepository,
    private readonly pointRepository: PointRepository,
    private readonly issuedCouponRepository: IssuedCouponRepository,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async fillShoppingCart(
    userId: string,
    productId: string,
    quantity: number)
  {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const user = await this.findOne({ where: { id: userId } });
  }

  async addToShoppingCart(
    userId: string,
    orderItems: OrderItem[],
    finalAmount: number,
    shippingInfo?: ShippingInfo,
  ): Promise<Order> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const order = new Order();
    order.user = user;
    order.amount = finalAmount;
    order.status = 'started';
    order.items = orderItems;
    order.shippingInfo = shippingInfo;
    return this.save(order);
  }

}
