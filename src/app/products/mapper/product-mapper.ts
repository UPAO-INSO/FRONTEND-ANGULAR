import type {
  Product,
  ProductType,
  RestProductContent,
  RestProductTypeContent,
} from '../interfaces/product.type';

export class ProductMapper {
  static mapRestProductToProduct(content: RestProductContent): Product {
    return {
      id: content.id,
      name: content.name,
      price: content.price,
      description: content.description,
      active: content.active,
      productTypeId: content.productTypeId,
    };
  }

  static mapRestProductsToProductArray(
    content: RestProductContent[]
  ): Product[] {
    return content.map(ProductMapper.mapRestProductToProduct);
  }
}

export class ProductTypeMapper {
  static mapRestProductTypeToProductType(
    content: RestProductTypeContent
  ): ProductType {
    return {
      id: content.id,
      name: content.name,
    };
  }

  static mapRestProductsTypeToProductTypeArray(
    content: RestProductTypeContent[]
  ): ProductType[] {
    return content.map(ProductTypeMapper.mapRestProductTypeToProductType);
  }
}
