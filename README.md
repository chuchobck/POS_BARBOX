# 🍷 BARBOX - Punto de Venta (POS)

Sistema de Punto de Venta para licorería.

## 🚀 Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

## 📦 Producción

```bash
npm run build
```

## 🔐 Variables de Entorno

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 📁 Estructura

```
src/
├── App.tsx        # Componente principal
├── services/      # API services
├── types/         # TypeScript types
└── utils/         # Utilidades
```

## 📱 Funcionalidades

- Login de cajero
- Búsqueda de productos (código de barras, ID, descripción)
- Búsqueda/creación de clientes
- Carrito de venta
- Facturación
- Retiro de pedidos
