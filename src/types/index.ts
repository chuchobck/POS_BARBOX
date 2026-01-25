export interface Usuario {
  id_usuario: number;
  usuario: string;
  rol: 'ADMIN' | 'CAJERO' | 'CLIENTE';
  tipo_usuario: 'EMPLEADO' | 'CLIENTE';
  empleado?: {
    id_empleado: number;
    nombre: string;
  };
}

export interface Cliente {
  id_cliente: number;
  nombre1: string;
  nombre2?: string | null;
  apellido1: string;
  apellido2?: string | null;
  ruc_cedula: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  estado: 'ACT' | 'INA';
}

export interface Producto {
  id_producto: string;
  codigo_barras?: string | null;
  descripcion: string;
  precio_venta: number;
  saldo_actual: number;
  estado: 'ACT' | 'INA';
  categoria_producto?: { id_prod_categoria: number; nombre: string } | null;
  marca?: { id_marca: number; nombre: string } | null;
}

export interface ItemCarrito {
  id_producto: string;
  producto: Producto;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface MetodoPago {
  id_metodo_pago: number;
  nombre: string;
  estado: 'ACT' | 'INA';
}

export interface Factura {
  id_factura: string;
  id_canal: 'POS' | 'WEB';
  id_cliente: number;
  id_empleado?: number | null;
  id_metodo_pago: number;
  subtotal: number;
  total: number;
  estado: 'PEN' | 'APR' | 'RET' | 'ANU';
  fecha_emision: string;
  fecha_retiro?: string | null;
  cliente?: Cliente;
  metodo_pago?: MetodoPago;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

export type POSView = 'ventas' | 'retiros';
