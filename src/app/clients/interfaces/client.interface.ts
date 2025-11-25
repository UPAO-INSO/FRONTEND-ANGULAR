export interface Client {
  id: number;
  name: string;
  lastname: string;
  phone: string;
  documentNumber: string;
  email: string;
}

export interface RESTClient {
  content: Client[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}
