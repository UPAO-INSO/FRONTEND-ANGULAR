export interface RESTDniResponse {
  data: Data;
  message: string;
  status: number;
  success: boolean;
}

export interface Data {
  apellido_materno: string;
  apellido_paterno: string;
  departamento: string;
  direccion: string;
  direccion_completa: string;
  distrito: string;
  fecha_nacimiento: string;
  nombre_completo: string;
  nombres: string;
  numero: string;
  provincia: string;
  sexo: string;
  ubigeo: string[];
  ubigeo_reniec: string;
  ubigeo_sunat: string;
}

export interface RESTRucResponse {
  status: number;
  success: boolean;
  message: string;
  data: Data;
}

export interface Data {
  numero: string;
  nombre_o_razon_social: string;
  tipo_contribuyente: string;
  estado: string;
  condicion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  direccion_completa: string;
  ubigeo_sunat: string;
  ubigeo: string[];
}
