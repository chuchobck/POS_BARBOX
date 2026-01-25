import type { ApiResponse, Cliente, Producto, MetodoPago, Factura, Usuario } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('pos_token');
  return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
};

const handleRes = async <T>(res: Response): Promise<T> => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error');
  return data;
};

export const api = {
  // Auth
  login: async (usuario: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });
    return handleRes<ApiResponse<{ token: string; usuario: Usuario }>>(res);
  },

  // Clientes
  buscarClientePorCedula: async (cedula: string) => {
    const res = await fetch(`${API_BASE}/clientes/buscar?cedula=${encodeURIComponent(cedula)}`, { headers: getHeaders() });
    return handleRes<ApiResponse<Cliente | Cliente[]>>(res);
  },

  crearCliente: async (data: Partial<Cliente>) => {
    const res = await fetch(`${API_BASE}/clientes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...data, origen: 'POS' })
    });
    return handleRes<ApiResponse<Cliente>>(res);
  },

  // Productos
  buscarProducto: async (termino: string) => {
    // Intenta código de barras
    let res = await fetch(`${API_BASE}/productos/buscar?codigo_barras=${encodeURIComponent(termino)}`, { headers: getHeaders() });
    let data = await res.json();
    if (data.status === 'success' && data.data && !Array.isArray(data.data)) return data as ApiResponse<Producto>;

    // Intenta ID
    res = await fetch(`${API_BASE}/productos/buscar?id=${encodeURIComponent(termino)}`, { headers: getHeaders() });
    data = await res.json();
    if (data.status === 'success' && data.data && !Array.isArray(data.data)) return data as ApiResponse<Producto>;

    // Busca por descripción
    res = await fetch(`${API_BASE}/productos/buscar?descripcion=${encodeURIComponent(termino)}&soloDisponibles=true`, { headers: getHeaders() });
    return handleRes<ApiResponse<Producto[]>>(res);
  },

  // Métodos de pago
  getMetodosPago: async () => {
    const res = await fetch(`${API_BASE}/metodos-pago`, { headers: getHeaders() });
    return handleRes<ApiResponse<MetodoPago[]>>(res);
  },

  // Facturas - USA EL MISMO ENDPOINT EXISTENTE
  crearFactura: async (id_cliente: number, id_metodo_pago: number, detalle_productos: { id_producto: string; cantidad: number }[]) => {
    const res = await fetch(`${API_BASE}/facturas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        id_cliente,
        id_metodo_pago,
        id_carrito: null, // NULL para POS - el backend detecta canal por id_empleado
        detalle_productos
      })
    });
    return handleRes<ApiResponse<{ id_factura: string; mensaje?: string }>>(res);
  },

  getFacturasAPR: async () => {
    const res = await fetch(`${API_BASE}/facturas?estado=APR`, { headers: getHeaders() });
    return handleRes<ApiResponse<Factura[]>>(res);
  },

  getFactura: async (id: string) => {
    const res = await fetch(`${API_BASE}/facturas/${encodeURIComponent(id)}`, { headers: getHeaders() });
    return handleRes<ApiResponse<Factura>>(res);
  },

  marcarRetirada: async (id: string) => {
    const res = await fetch(`${API_BASE}/facturas/${encodeURIComponent(id)}/retirar`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleRes<ApiResponse<Factura>>(res);
  }
};
