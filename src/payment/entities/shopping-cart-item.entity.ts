import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { ShoppingCart } from './shopping-cart.entity';

@Entity()
export class ShoppingCartItem extends BaseEntity {
  @ManyToOne(() => ShoppingCart, (shoppingCart) => shoppingCart.items)
  shoppingCart: Relation<ShoppingCart>;
  
  @Column()
  productId: string;

  @Column()
  quantity: number;
}
