import { Body, Controller, Post, Req, Get } from '@nestjs/common';
import { PaymentService, ProductService } from '../services';
import {
    CreateOrderDto
} from '../dto';
import { ApiBody } from '@nestjs/swagger';
import { ProductDto } from '../dto/product.dto';
import { ShoppingCartService } from '../services/shoppingcart.service';


// 2. 장바구니에 담는다. 장바구니에서 각 아이템의 수량, 가격 적용된 쿠폰을 보여준다. 각 상품별 쿠폰, 장바구니 쿠폰
// 장바구니에 담을 시 품절
// 3. 결제를 한다. 

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly productService: ProductService,
    private readonly shoppingCartService: ShoppingCartService
  ) {}

  @ApiBody({})
  @Post('order')
  async order(@Body() orderInfo:CreateOrderDto)
  {
    this.paymentService.initOrder(orderInfo);
  }

  @ApiBody({})
  @Post('fillshoppingcart')
  async fillshoppingcart(@Body() userId: string, productId: string, quantity: number) 
  {
    this.shoppingCartService.fillShoppingCart(userId, productId, quantity);
  }
}
