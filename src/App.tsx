import { useState, useEffect, useRef } from 'react';
import { api } from './services/api';
import { formatCurrency, formatDate } from './utils';
import type { Usuario, Cliente, Producto, ItemCarrito, MetodoPago, Factura, POSView } from './types';
import './index.css';

interface ClienteForm {
  nombre1: string;
  nombre2: string;
  apellido1: string;
  apellido2: string;
  ruc_cedula: string;
  telefono: string;
  email: string;
  direccion: string;
}

const initialClienteForm: ClienteForm = {
  nombre1: '', nombre2: '', apellido1: '', apellido2: '',
  ruc_cedula: '', telefono: '', email: '', direccion: ''
};

export default function App() {
  // Auth
  const [isAuth, setIsAuth] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Navigation
  const [view, setView] = useState<POSView>('ventas');

  // Cliente
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cedulaBusq, setCedulaBusq] = useState('');
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clienteForm, setClienteForm] = useState<ClienteForm>(initialClienteForm);

  // Productos
  const [prodBusq, setProdBusq] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [prodLoading, setProdLoading] = useState(false);

  // Carrito
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [metodoPagoId, setMetodoPagoId] = useState<number | ''>('');

  // Retiros
  const [facturasAPR, setFacturasAPR] = useState<Factura[]>([]);
  const [factBusq, setFactBusq] = useState('');

  // UI
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [processing, setProcessing] = useState(false);

  // Refs
  const cedulaRef = useRef<HTMLInputElement>(null);
  const prodRef = useRef<HTMLInputElement>(null);

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('pos_token');
    const u = localStorage.getItem('pos_usuario');
    if (token && u) {
      try {
        const parsed = JSON.parse(u) as Usuario;
        if (parsed.rol === 'ADMIN' || parsed.rol === 'CAJERO') {
          setUsuario(parsed);
          setIsAuth(true);
        }
      } catch { localStorage.clear(); }
    }
  }, []);

  // Load metodos pago
  useEffect(() => {
    if (isAuth) loadMetodosPago();
  }, [isAuth]);

  // Load facturas APR
  useEffect(() => {
    if (isAuth && view === 'retiros') loadFacturasAPR();
  }, [isAuth, view]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ==================== AUTH ====================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.login(loginUser, loginPass);
      if (res.status === 'success' && res.data) {
        const { token, usuario: u } = res.data;
        if (u.rol !== 'ADMIN' && u.rol !== 'CAJERO') {
          setLoginError('Sin permisos para POS');
          return;
        }
        localStorage.setItem('pos_token', token);
        localStorage.setItem('pos_usuario', JSON.stringify(u));
        setUsuario(u);
        setIsAuth(true);
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    setIsAuth(false);
    setUsuario(null);
    resetVenta();
  };

  // ==================== CLIENTES ====================
  const buscarCliente = async () => {
    if (!cedulaBusq.trim()) return;
    try {
      const res = await api.buscarClientePorCedula(cedulaBusq);
      if (res.status === 'success' && res.data) {
        const c = Array.isArray(res.data) ? res.data[0] : res.data;
        setCliente(c);
        showToast('Cliente encontrado');
        prodRef.current?.focus();
      }
    } catch {
      setClienteForm({ ...initialClienteForm, ruc_cedula: cedulaBusq });
      setShowClienteModal(true);
    }
  };

  const crearCliente = async () => {
    try {
      const res = await api.crearCliente(clienteForm);
      if (res.status === 'success' && res.data) {
        setCliente(res.data);
        setShowClienteModal(false);
        setClienteForm(initialClienteForm);
        showToast('Cliente creado');
        prodRef.current?.focus();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  // ==================== PRODUCTOS ====================
  const buscarProducto = async () => {
    if (!prodBusq.trim()) return;
    setProdLoading(true);
    try {
      const res = await api.buscarProducto(prodBusq);
      if (res.status === 'success' && res.data) {
        if (!Array.isArray(res.data)) {
          agregarCarrito(res.data);
          setProdBusq('');
        } else {
          setProductos(res.data);
        }
      }
    } catch {
      setProductos([]);
      showToast('Sin resultados', 'error');
    } finally {
      setProdLoading(false);
    }
  };

  // ==================== CARRITO ====================
  const agregarCarrito = (prod: Producto) => {
    if (prod.saldo_actual <= 0) {
      showToast('Sin stock', 'error');
      return;
    }
    setCarrito(prev => {
      const existe = prev.find(i => i.id_producto === prod.id_producto);
      if (existe) {
        if (existe.cantidad >= prod.saldo_actual) {
          showToast('Stock insuficiente', 'error');
          return prev;
        }
        return prev.map(i =>
          i.id_producto === prod.id_producto
            ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_unitario }
            : i
        );
      }
      return [...prev, {
        id_producto: prod.id_producto,
        producto: prod,
        cantidad: 1,
        precio_unitario: prod.precio_venta,
        subtotal: prod.precio_venta
      }];
    });
    showToast(`${prod.descripcion} agregado`);
  };

  const modCantidad = (id: string, delta: number) => {
    setCarrito(prev => prev.map(i => {
      if (i.id_producto !== id) return i;
      const newQty = i.cantidad + delta;
      if (newQty <= 0) return null as unknown as ItemCarrito;
      if (newQty > i.producto.saldo_actual) {
        showToast('Stock insuficiente', 'error');
        return i;
      }
      return { ...i, cantidad: newQty, subtotal: newQty * i.precio_unitario };
    }).filter(Boolean));
  };

  const quitarCarrito = (id: string) => {
    setCarrito(prev => prev.filter(i => i.id_producto !== id));
  };

  // ==================== METODOS PAGO ====================
  const loadMetodosPago = async () => {
    try {
      const res = await api.getMetodosPago();
      if (res.status === 'success' && res.data) {
        const activos = res.data.filter(m => m.estado === 'ACT');
        setMetodosPago(activos);
        if (activos.length > 0) setMetodoPagoId(activos[0].id_metodo_pago);
      }
    } catch (err) { console.error(err); }
  };

  // ==================== FACTURAR ====================
  const facturar = async () => {
    if (!cliente) {
      showToast('Seleccione cliente', 'error');
      cedulaRef.current?.focus();
      return;
    }
    if (carrito.length === 0) {
      showToast('Carrito vacío', 'error');
      return;
    }
    if (!metodoPagoId) {
      showToast('Seleccione pago', 'error');
      return;
    }

    setProcessing(true);
    try {
      const detalle = carrito.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad }));
      const res = await api.crearFactura(cliente.id_cliente, metodoPagoId as number, detalle);
      if (res.status === 'success' && res.data) {
        showToast(`Factura ${res.data.id_factura} creada`);
        resetVenta();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const resetVenta = () => {
    setCliente(null);
    setCedulaBusq('');
    setProdBusq('');
    setProductos([]);
    setCarrito([]);
    cedulaRef.current?.focus();
  };

  // ==================== RETIROS ====================
  const loadFacturasAPR = async () => {
    try {
      const res = await api.getFacturasAPR();
      if (res.status === 'success') setFacturasAPR(res.data || []);
    } catch (err) { console.error(err); }
  };

  const buscarFactura = async () => {
    if (!factBusq.trim()) {
      loadFacturasAPR();
      return;
    }
    try {
      const res = await api.getFactura(factBusq);
      if (res.status === 'success' && res.data) {
        if (res.data.estado === 'APR') {
          setFacturasAPR([res.data]);
        } else {
          showToast(`Estado: ${res.data.estado}`, 'error');
          setFacturasAPR([]);
        }
      }
    } catch {
      showToast('No encontrada', 'error');
      setFacturasAPR([]);
    }
  };

  const marcarRetirada = async (id: string) => {
    try {
      const res = await api.marcarRetirada(id);
      if (res.status === 'success') {
        showToast(`${id} retirada`);
        loadFacturasAPR();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  // Cálculos
  const subtotal = carrito.reduce((s, i) => s + i.subtotal, 0);
  const iva = subtotal * 0.12;
  const total = subtotal + iva;

  // ==================== RENDER: LOGIN ====================
  if (!isAuth) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="logo">BARBOX</div>
          <div className="subtitle">Sistema Punto de Venta</div>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                placeholder="Usuario"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                autoFocus
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Contraseña"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
              />
            </div>
            {loginError && <div className="error-msg">{loginError}</div>}
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loginLoading}>
              {loginLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== RENDER: POS ====================
  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-logo">BARBOX POS</div>
        <nav className="nav">
          <button className={`nav-btn ${view === 'ventas' ? 'active' : ''}`} onClick={() => setView('ventas')}>
            💳 Ventas
          </button>
          <button className={`nav-btn ${view === 'retiros' ? 'active' : ''}`} onClick={() => setView('retiros')}>
            📦 Retiros
          </button>
        </nav>
        <div className="header-user">
          <span>{usuario?.empleado?.nombre || usuario?.usuario} ({usuario?.rol})</span>
          <button className="btn-secondary" onClick={logout}>Salir</button>
        </div>
      </header>

      {/* VENTAS */}
      {view === 'ventas' && (
        <div className="pos-container">
          <div className="left-panel">
            {/* Cliente */}
            <div className="search-row">
              <input
                ref={cedulaRef}
                placeholder="Buscar cliente por cédula..."
                value={cedulaBusq}
                onChange={e => setCedulaBusq(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarCliente()}
              />
              <button className="btn-search" onClick={buscarCliente}>🔍 Buscar</button>
            </div>

            {cliente && (
              <div className="cliente-card">
                <div className="cliente-header">
                  <span className="cliente-label">Cliente</span>
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    onClick={() => { setCliente(null); setCedulaBusq(''); }}
                  >
                    Cambiar
                  </button>
                </div>
                <div className="cliente-info">
                  <div className="cliente-avatar">
                    {cliente.nombre1?.charAt(0)}{cliente.apellido1?.charAt(0)}
                  </div>
                  <div>
                    <div className="cliente-nombre">{cliente.nombre1} {cliente.apellido1}</div>
                    <div className="cliente-cedula">CI: {cliente.ruc_cedula}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Productos */}
            <div className="search-row">
              <input
                ref={prodRef}
                placeholder="Código de barras o nombre..."
                value={prodBusq}
                onChange={e => setProdBusq(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarProducto()}
              />
              <button className="btn-search" onClick={buscarProducto}>🔍 Buscar</button>
            </div>

            {prodLoading ? (
              <div className="empty-state"><div className="spinner"></div></div>
            ) : productos.length > 0 ? (
              <div className="productos-grid">
                {productos.map(p => (
                  <div key={p.id_producto} className="producto-card" onClick={() => agregarCarrito(p)}>
                    <div className="producto-nombre">{p.descripcion}</div>
                    <div className="producto-meta">
                      <span className="producto-precio">{formatCurrency(p.precio_venta)}</span>
                      <span className="producto-stock">Stock: {p.saldo_actual}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div>Busque productos</div>
              </div>
            )}
          </div>

          {/* Carrito */}
          <div className="right-panel">
            <div className="cart-header">
              <div className="cart-title">🛒 Carrito ({carrito.length})</div>
            </div>
            <div className="cart-items">
              {carrito.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🛒</div>
                  <div>Carrito vacío</div>
                </div>
              ) : (
                carrito.map(i => (
                  <div key={i.id_producto} className="cart-item">
                    <div className="cart-item-header">
                      <span className="cart-item-name">{i.producto.descripcion}</span>
                      <button className="cart-item-remove" onClick={() => quitarCarrito(i.id_producto)}>✕</button>
                    </div>
                    <div className="cart-item-footer">
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => modCantidad(i.id_producto, -1)}>−</button>
                        <span className="qty-value">{i.cantidad}</span>
                        <button className="qty-btn" onClick={() => modCantidad(i.id_producto, 1)}>+</button>
                      </div>
                      <span className="cart-item-price">{formatCurrency(i.subtotal)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="cart-footer">
              <div className="summary-row">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">{formatCurrency(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">IVA (12%)</span>
                <span className="summary-value">{formatCurrency(iva)}</span>
              </div>
              <div className="total-row">
                <span className="total-label">Total</span>
                <span className="total-value">{formatCurrency(total)}</span>
              </div>
              <div className="payment-section">
                <select value={metodoPagoId} onChange={e => setMetodoPagoId(Number(e.target.value))}>
                  {metodosPago.map(m => (
                    <option key={m.id_metodo_pago} value={m.id_metodo_pago}>{m.nombre}</option>
                  ))}
                </select>
                <button className="btn-success" style={{ width: '100%' }} onClick={facturar} disabled={processing}>
                  {processing ? '⏳ Procesando...' : '✓ Facturar'}
                </button>
                <button className="btn-danger" style={{ width: '100%', marginTop: 12 }} onClick={resetVenta}>
                  🗑 Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RETIROS */}
      {view === 'retiros' && (
        <div className="retiros-container">
          <h1 className="retiros-title">📦 Gestión de Retiros</h1>
          <p className="retiros-subtitle">Facturas aprobadas pendientes de retiro</p>
          <div className="search-row" style={{ maxWidth: 600, marginBottom: 24 }}>
            <input
              placeholder="Buscar por número de factura..."
              value={factBusq}
              onChange={e => setFactBusq(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarFactura()}
            />
            <button className="btn-search" onClick={buscarFactura}>🔍 Buscar</button>
            <button className="btn-secondary" onClick={() => { setFactBusq(''); loadFacturasAPR(); }}>Ver Todas</button>
          </div>
          {facturasAPR.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div>No hay facturas pendientes</div>
            </div>
          ) : (
            facturasAPR.map(f => (
              <div key={f.id_factura} className="factura-card">
                <div>
                  <div className="factura-id">{f.id_factura}</div>
                  <div className="factura-fecha">{formatDate(f.fecha_emision)}</div>
                </div>
                <div className="factura-cliente">
                  {f.cliente ? `${f.cliente.nombre1} ${f.cliente.apellido1}` : `Cliente #${f.id_cliente}`}
                </div>
                <div className="factura-total">{formatCurrency(f.total)}</div>
                <button className="btn-success" onClick={() => marcarRetirada(f.id_factura)}>
                  ✓ Marcar Retirado
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Cliente */}
      {showClienteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">➕ Nuevo Cliente</h2>
              <button className="modal-close" onClick={() => setShowClienteModal(false)}>✕</button>
            </div>
            <div className="modal-grid">
              <input placeholder="Primer Nombre *" value={clienteForm.nombre1} onChange={e => setClienteForm({ ...clienteForm, nombre1: e.target.value })} />
              <input placeholder="Segundo Nombre" value={clienteForm.nombre2} onChange={e => setClienteForm({ ...clienteForm, nombre2: e.target.value })} />
              <input placeholder="Primer Apellido *" value={clienteForm.apellido1} onChange={e => setClienteForm({ ...clienteForm, apellido1: e.target.value })} />
              <input placeholder="Segundo Apellido" value={clienteForm.apellido2} onChange={e => setClienteForm({ ...clienteForm, apellido2: e.target.value })} />
            </div>
            <div className="input-group" style={{ marginTop: 12 }}>
              <input placeholder="Cédula *" value={clienteForm.ruc_cedula} onChange={e => setClienteForm({ ...clienteForm, ruc_cedula: e.target.value })} />
            </div>
            <div className="modal-grid">
              <input placeholder="Teléfono" value={clienteForm.telefono} onChange={e => setClienteForm({ ...clienteForm, telefono: e.target.value })} />
              <input placeholder="Email" value={clienteForm.email} onChange={e => setClienteForm({ ...clienteForm, email: e.target.value })} />
            </div>
            <div className="input-group" style={{ marginTop: 12 }}>
              <input placeholder="Dirección" value={clienteForm.direccion} onChange={e => setClienteForm({ ...clienteForm, direccion: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowClienteModal(false)}>Cancelar</button>
              <button className="btn-success" onClick={crearCliente}>✓ Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
