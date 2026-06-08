import { Client, CreateClientRequest } from '../interfaces/client.interface';

export class ClientMapper {
  static toCreateRequest(client: Client): CreateClientRequest {
    return {
      name: client.name ?? '',
      lastname: client.lastname ?? '',
      phone: client.phone ?? '',
      documentNumber: client.documentNumber ?? '',
      email: client.email ?? '',
      department: client.departament ?? '',
      province: client.province ?? '',
      district: client.district ?? '',
      completeAddress: client.completeAddress ?? '',
    };
  }

  static getFullName(client: Client): string {
    return `${client.name ?? ''} ${client.lastname ?? ''}`.trim();
  }

  static getDocumentLabel(client: Client): string {
    if (!client.documentNumber) return '—';
    return client.documentType
      ? `${client.documentType} ${client.documentNumber}`
      : client.documentNumber;
  }
}
