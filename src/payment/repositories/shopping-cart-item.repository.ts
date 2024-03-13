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

  async updateQuantity(shoppingCartItemId:string, quantity:number){
    this.update(shoppingCartItemId, {quantity:()=> `quantity + ${quantity}`})
  }

  async fillShoppingCart(shoppingCart:ShoppingCart, productId:string, quantity:number){
    const shoppingCartItem = new ShoppingCartItem;
    shoppingCartItem.shoppingCart = shoppingCart;
    shoppingCartItem.productId = productId;
    shoppingCartItem.quantity = quantity;
    this.save(shoppingCartItem);
  }
}
