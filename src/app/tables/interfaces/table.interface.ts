export interface Table {
  id: number;
  number: string;
  capacity: number;
  status: TableStatus | string;
}

export interface RESTTable {
  content: ContentTable[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}

export interface ContentTable {
  id: number;
  number: string;
  capacity: number;
  floor: number;
  isActive: boolean;
  status: TableStatus;
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}
