export enum ProductsType {
  ENTRADAS = 'ENTRADAS',
  BEBIDAS = 'BEBIDAS',
  DESCARTABLES = 'DESCARTABLES',
  SEGUNDOS = 'SEGUNDOS',
  CARTA = 'CARTA',
}

export interface ProductType {
  id: number;
  name: string;
}

export interface PartialProductUpdate {
  id: number;
  available: boolean;
}

export interface RESTProductType {
  content: RestProductTypeContent[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}

export interface RestProductTypeContent {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  active: boolean;
  available: boolean;
  productTypeId: number;
  productTypeName: string;
}

export interface RESTProduct {
  content: RestProductContent[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}

export interface RestProductContent {
  id: number;
  name: string;
  price: number;
  description: string;
  productTypeId: number;
  productTypeName: string;
  active: boolean;
  available: boolean;
}
