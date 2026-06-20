import { productsRepository } from './products.repository';
import { AppError } from '../../common/utils/AppError';
import { MESSAGES } from '../../common/constants/messages';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './products.validator';

export class ProductsService {
  async list(query: ProductQueryDto) {
    return productsRepository.findMany(query);
  }

  async getById(id: string) {
    const product = await productsRepository.findById(id);
    if (!product) throw AppError.notFound(MESSAGES.PRODUCTS.NOT_FOUND);
    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await productsRepository.findBySku(dto.companyId, dto.sku);
    if (existing) throw AppError.conflict(MESSAGES.PRODUCTS.SKU_EXISTS);
    return productsRepository.create(dto);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.getById(id);

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await productsRepository.findBySku(product.companyId, dto.sku);
      if (existing) throw AppError.conflict(MESSAGES.PRODUCTS.SKU_EXISTS);
    }

    return productsRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.getById(id);
    await productsRepository.softDelete(id);
  }
}

export const productsService = new ProductsService();
