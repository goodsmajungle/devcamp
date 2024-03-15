import { Column, Entity, OneToMany, Relation, ManyToOne, BeforeInsert, BeforeUpdate} from 'typeorm';
import { BaseEntity } from '../../common/entity';
import { IssuedCoupon } from './issued-coupon.entity';
import { Product } from './Product.entity';

type CouponTarget = 'product' | 'shoppingcart';
type CouponType = 'percent' | 'fixed';

@Entity()
export class Coupon extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  target: CouponTarget;

  @Column({ type: 'varchar', length: 50 })
  type: CouponType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  value: number; // 할인율 또는 정액 금액

  @OneToMany(() => IssuedCoupon, (issuedCoupon) => issuedCoupon.coupon)
  issuedCoupons: Relation<IssuedCoupon[]>;

  @ManyToOne(() => Product, (product) => product.coupon)
  product: Relation<Product>;

  @BeforeInsert()
  @BeforeUpdate()
  validateProduct(): void {
    if (this.target === 'product' && !this.product) {
      throw new Error('Coupon must have a product when target is product');
    }
  }
}
