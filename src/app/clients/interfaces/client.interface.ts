export enum DocumentType {
  DNI = 'DNI',
  RUC = 'RUC',
}

export interface CreateClientRequest {
  name: string;
  lastname: string;
  phone: string;
  documentNumber: string;
  email: string;
  department: string;
  province: string;
  district: string;
  completeAddress: string;
}

export interface Client {
  id: number;
  name: string;
  lastname: string;
  phone: string;
  documentNumber: string;
  documentType: DocumentType;
  email: string;
  deparment: string;
  province: string;
  district: string;
  completeAddress: string;
}

export interface RESTClient {
  content: Client[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}
