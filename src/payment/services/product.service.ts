import { Injectable } from '@nestjs/common';
import { Product } from '../entities';
import { ProductRepository } from '../repositories';
import { BusinessException } from 'src/exception';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getProductsByIds(productIds: string[]): Promise<Product[]> {
    return await this.productRepository.getProductsByIds(productIds);
  }

  async checkStockAvailability(productId: string, quantity: number): Promise<boolean> {
    const stock = Number(this.productRepository.stockCheckById(productId))
    // 재고가 모자란 경우
    if (quantity > stock){
      return false;
    }
    // 재고가 충분한 경우
    else {
      return true;
    }
     
  }
}
