# 🍷 BARBOX — Punto de Venta (POS)

> **Calificación del proyecto: 100/100** — Terminal de punto de venta ultraligero, construido con TypeScript puro y cero dependencias externas de UI.

**BARBOX POS** es el sistema de punto de venta diseñado para cajeros de licorería. Optimizado para velocidad máxima en operaciones de venta: búsqueda inteligente de productos, creación de clientes al vuelo, facturación instantánea y gestión de retiros. Todo en una aplicación ultra-performante con **zero dependencias de UI**.

---

## 🏆 Highlights del Proyecto

| Métrica | Valor |
|---|---|
| **Dependencias de UI** | 0 — Solo React + React DOM |
| **TypeScript** | 100% tipado con interfaces completas |
| **Rendimiento** | Single-file architecture para carga instantánea |
| **HTTP** | Fetch API nativa (sin axios ni librerías externas) |
| **Flujos de negocio** | Login, venta completa, facturación y retiros |
| **Deploy** | Producción en Vercel |

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **React 18** | Biblioteca de UI |
| **TypeScript 5.3** | Tipado estático completo |
| **Vite 5** | Build tool con chunked vendor |
| **Fetch API** | HTTP nativo sin dependencias |
| **CSS puro** | Estilos sin frameworks |

### Filosofía Zero-Dependency

A diferencia de los otros frontends del ecosistema, el POS fue diseñado intencionalmente con **cero dependencias externas de UI** para garantizar:
- ⚡ Carga instantánea en terminales de venta
- 🔒 Mínima superficie de ataque
- 📦 Bundle size ultra-reducido
- 🛡️ Sin conflictos de dependencias

---

## 🖥️ Flujos de Negocio

### 1. 🔐 Login de Cajero
- Autenticación exclusiva para roles **ADMIN** y **CAJERO**
- Token JWT persistido en localStorage
- Identificación del empleado en cada operación

### 2. 👤 Gestión de Cliente
- Búsqueda por **cédula o RUC**
- Si no existe → **modal de creación on-the-fly** sin salir del flujo de venta
- Validación de datos ecuatorianos

### 3. 🔍 Búsqueda Inteligente de Productos
Sistema de búsqueda en cascada que maximiza la velocidad:
```
Input → ¿Es código de barras? → Búsqueda exacta
                ↓ No
        ¿Es ID de producto? → Búsqueda por ID
                ↓ No
        Búsqueda por descripción → Resultados múltiples
```

### 4. 🛒 Carrito de Venta
- Agregar productos con validación de stock en **tiempo real**
- Modificar cantidades (±) con controles rápidos
- Eliminar ítems del carrito
- Cálculo automático de subtotales y total

### 5. 🧾 Facturación
- Envío directo del detalle (sin pasar por carrito de BD)
- Detección automática de canal **POS**
- Selección de método de pago
- Generación de factura con estados (PEN/APR)

### 6. 📦 Retiros de Pedidos
- Vista dedicada de facturas **aprobadas** (APR)
- Marcar entrega → Estado cambia a **RET** (Retirado)
- Confirmación de retiro por el cajero

---

## 📐 TypeScript — Tipado Completo

Todas las entidades del sistema están tipadas con interfaces:

| Interface | Campos principales |
|---|---|
| `Usuario` | id, nombre, rol (ADMIN/CAJERO) |
| `Cliente` | id, nombre, cédula, teléfono, estado (ACT/INA) |
| `Producto` | id, descripción, saldo_actual, código_barras, categoría, marca, precio |
| `ItemCarrito` | producto, cantidad, precio, subtotal |
| `MetodoPago` | id, descripción, referencia requerida |
| `Factura` | id, cliente, total, estado (PEN/APR/RET/ANU), fecha |
| `ApiResponse<T>` | Wrapper genérico tipado para respuestas de API |
| `POSView` | Literal type: `"ventas"` \| `"retiros"` |

---

## 🏗️ Arquitectura

```
src/
├── App.tsx              # Aplicación completa (single-file optimizado)
│   ├── Login            # Autenticación de cajero
│   ├── BuscadorCliente  # Búsqueda/creación de clientes
│   ├── BuscadorProducto # Búsqueda inteligente 3-niveles
│   ├── Carrito          # Gestión de ítems y totales
│   ├── Facturación      # Proceso de venta
│   └── Retiros          # Entrega de pedidos
├── services/
│   └── api.ts           # Endpoints tipados con Fetch API
├── types/
│   └── index.ts         # Interfaces TypeScript completas
├── utils/
│   └── index.ts         # formatCurrency (USD-EC), formatDate (es-EC)
└── config/              # Configuración de la app
```

---

## 💱 Utilidades

| Utility | Descripción |
|---|---|
| `formatCurrency()` | Formato monetario USD ecuatoriano ($X.XX) |
| `formatDate()` | Formato de fecha es-EC localizado |

---

## 🌐 Parte del Ecosistema BARBOX

El POS se conecta al **Backend API** centralizado, compartiendo la misma base de datos con el Backoffice y el E-commerce:

```
┌──────────────┐    ┌───────────────────────┐    ┌──────────────┐
│ 🛒 E-commerce│    │    🍷 BARBOX API      │    │ 📊 Backoffice│
│ Clientes     │───▶│    Node.js + Express  │◀───│ Admin        │
└──────────────┘    └───────────┬───────────┘    └──────────────┘
                                ▲
                    ┌───────────┴───────────┐
                    │   🖥️ POS              │  ◄── Estás aquí
                    │   React 18 + TypeScript│
                    │   Zero-dep UI         │
                    └───────────────────────┘
```

---

## 🔗 Repositorios del Ecosistema BARBOX

| Proyecto | Repositorio | Descripción |
|---|---|---|
| **Backend API** | [backend_BARBOX](https://github.com/chuchobck/backend_BARBOX) | API REST centralizada |
| **Backoffice** | [Backoffice_BARBOX](https://github.com/chuchobck/Backoffice_BARBOX) | Panel administrativo |
| **Punto de Venta** | [POS_BARBOX](https://github.com/chuchobck/POS_BARBOX) | Terminal POS para cajeros |

---

<p align="center">
  Desarrollado como proyecto académico con calificación perfecta <strong>100/100</strong> 🏆
</p>
