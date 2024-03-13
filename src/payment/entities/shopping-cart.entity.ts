import {
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    Relation,
  } from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { User } from '../../auth/entities';
import { ShoppingCartItem } from './shopping-cart-item.entity';

  
//signup할 때 해당 user에 맞는 shoppingcart 생성 필요 
@Entity()
export class ShoppingCart extends BaseEntity {
  @OneToOne(() => User, (user) => user.shoppingCart)
  @JoinColumn()
  user: Relation<User>;

  @OneToMany(() => ShoppingCartItem, (item) => item.shoppingCart)
  items: Relation<ShoppingCartItem[]>;



}
  