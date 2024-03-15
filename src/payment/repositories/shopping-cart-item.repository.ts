import { EntityManager, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ShoppingCartItem } from '../entities/shopping-cart-item.entity';
import { ShoppingCart } from '../entities/shopping-cart.entity';

@Injectable()
export class ShoppingCartItemRepository extends Repository<ShoppingCartItem> {
  constructor(
    @InjectRepository(ShoppingCartItem)
    private readonly repo: Repository<ShoppingCartItem>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async updateQuantity(shoppingCartItemId:string, quantityNow:number, quantity:number){
    const resultQuantity = quantity + quantityNow;
    
    // 쇼핑카트에 추가하는 경우
    if (quantity >= 0){
      this.update(shoppingCartItemId, {quantity:resultQuantity});
    }

    // 쇼핑카트에서 빼는 경우
    else {
        // 뺏을때 0이거나 0보다 작은 경우에는 물품을 아예 삭제
        if (resultQuantity < 0){
          this.delete(shoppingCartItemId);
        }

        // 뺏을때 0보다 큰 경우 물품 수량 수정
        else{
          this.update(shoppingCartItemId, {quantity:resultQuantity});
        }
      }
    }

  async addToShoppingCart(shoppingCart:ShoppingCart, productId:string, quantity:number){
    const shoppingCartItem = new ShoppingCartItem;
    shoppingCartItem.shoppingCart = shoppingCart;
    shoppingCartItem.productId = productId;
    shoppingCartItem.quantity = quantity;
    this.save(shoppingCartItem);
  }

  async emptyShoppingCart(shoppingCart:ShoppingCart){
    this.delete({shoppingCart:shoppingCart});
  }
}


