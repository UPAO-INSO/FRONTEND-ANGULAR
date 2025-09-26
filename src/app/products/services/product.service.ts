import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '@environments/environment';
import { map, Observable } from 'rxjs';
import {
  Product,
  ProductType,
  RESTProduct,
  RESTProductType,
} from '../interfaces/product.type';
import { ProductMapper, ProductTypeMapper } from '../mapper/product-mapper';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);

  envs = environment;
  token = this.envs.API_TOKEN;

  page = signal(1);
  totalPage = signal(1);
  private limit = signal(10);

  fetchProducts(): Observable<Product[]> {
    return this.http
      .get<RESTProduct>(`${this.envs.API_URL}/products`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params: {
          page: this.page(),
          limit: this.limit(),
        },
      })
      .pipe(
        map(({ content }) =>
          ProductMapper.mapRestProductsToProductArray(content)
        )
      );
  }

  fetchProductsType(): Observable<ProductType[]> {
    return this.http
      .get<RESTProductType>(`${this.envs.API_URL}/products-types`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params: {
          page: this.page(),
          limit: this.limit(),
        },
      })
      .pipe(
        map(({ content }) =>
          ProductTypeMapper.mapRestProductsTypeToProductTypeArray(content)
        )
      );
  }

  fetchProductsByTypeId(productTypeId: number): Observable<Product[]> {
    return this.http
      .get<RESTProduct>(
        `${this.envs.API_URL}/products/by-product-type/${productTypeId}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          params: {
            page: this.page(),
            limit: this.limit(),
          },
        }
      )
      .pipe(
        map(({ content }) =>
          ProductMapper.mapRestProductsToProductArray(content)
        )
      );
  }
}
