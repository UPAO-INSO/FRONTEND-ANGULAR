export interface Customer {
  id: number;
  name: string;
  lastname: string | null;
  phone: string | null;
  email: string | null;
  documentNumber: string | null;
  documentType: 'DNI' | 'RUC' | null;
}

export interface CreateCustomerRequest {
  name: string;
  lastname?: string;
  phone?: string;
}
