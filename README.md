# Snail Racing Dashboard

Aplicación full-stack desarrollada con TypeScript que incluye autenticación local, un panel de carreras y recargas de saldo ficticias mediante el servicio simulado SnailPay.

## Requisitos

- Node.js 22.12 o posterior
- npm 10 o posterior

## Instalación

Desde la raíz del repositorio, instala las dependencias del frontend y del backend:

```bash
npm install
```

## Ejecución

Inicia el frontend y el backend al mismo tiempo:

```bash
npm run dev
```

Los servicios estarán disponibles en:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Comprobación del backend: `http://localhost:3000/api/health`

También puedes iniciar el frontend y el backend por separado:

```bash
npm run dev -w frontend
npm run dev -w backend
```

Registra un usuario desde el frontend e inicia sesión para acceder al panel. El registro, la sesión, el saldo y las transacciones aprobadas se conservan en el `localStorage` del navegador.

## Verificación

Ejecuta las pruebas automatizadas:

```bash
npm test
```

Ejecuta la comprobación estática de tipos:

```bash
npm run typecheck
```

Genera las compilaciones de producción:

```bash
npm run build
```

## Datos de prueba de SnailPay

Abre **Add funds** desde el panel y utiliza uno de estos números de tarjeta ficticios. Todos los campos deben contener valores válidos para ejecutar el escenario seleccionado.

| Escenario | Número de tarjeta | Vencimiento | CVV | Resultado |
| --- | --- | --- | --- | --- |
| Aprobado | `1234123412341234` | `12/26` | `543` | El saldo aumenta y se guarda la transacción |
| Rechazado | `4000000000000002` | Cualquier fecha `MM/AA` válida | Tres dígitos cualesquiera | El saldo no cambia |
| Error del servidor | `5000000000000000` | Cualquier fecha `MM/AA` válida | Tres dígitos cualesquiera | El saldo no cambia |
| Tiempo de espera agotado | `9999999999999999` | Cualquier fecha `MM/AA` válida | Tres dígitos cualesquiera | La solicitud agota el tiempo de espera y el saldo no cambia |

Utiliza únicamente información de pago ficticia. Nunca ingreses datos reales de una tarjeta o CVV en esta aplicación.
