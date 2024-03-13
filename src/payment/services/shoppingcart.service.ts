import { Injectable } from '@nestjs/common';
import { ProductService } from './product.service';
import { ShoppingCartRepository } from '../repositories/shopping-cart.repository';
import { UserRepository } from 'src/auth/repositories';
import { ShoppingCartItemRepository } from '../repositories/shopping-cart-item.repository';
import { ShoppingCartItem } from '../entities/shopping-cart-item.entity';

@Injectable()
export class ShoppingCartService {
  constructor(
    private readonly productService: ProductService,
    private readonly shoppingCartRepository: ShoppingCartRepository,
    private readonly shoppingCartItemRepository: ShoppingCartItemRepository,
    private readonly userRepository: UserRepository
  ) {}

  async fillShoppingCart(
    userId:string,
    productId:string,
    quantity:number
    )
    {
    //재고 확인
    const isStockAvailable = await this.productService.checkStockAvailability(productId, quantity);
    if (isStockAvailable) {
    //쇼핑카트에 추가
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const shoppingCart = await this.shoppingCartRepository.findOne({where:{user:user}});
    const shoppingCartItem = await this.shoppingCartItemRepository.findOne({where:{shoppingCart:shoppingCart, productId:productId}});
        //이미 쇼핑카트에 같은 아이템이 있는 경우
        if (shoppingCartItem){
            this.shoppingCartItemRepository.updateQuantity(shoppingCartItem.id, quantity);
        }
        //새로운 아이템일 경우
        else {
            this.shoppingCartItemRepository.fillShoppingCart(shoppingCart, productId, quantity);
        }
    
    }
    }

//쇼핑카트에서 덜어내는거 필요

  async getShoppingCartItems(
    userId:string
  ) :Promise<ShoppingCartItem[]>
  {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const shoppingCart = await this.shoppingCartRepository.findOne({where:{user:user}});
    const shoppingCartItems = await this.shoppingCartItemRepository.find({where:{shoppingCart:shoppingCart}});
    return shoppingCartItems
  }
}

