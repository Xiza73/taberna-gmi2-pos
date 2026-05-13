# POS Frontend — Punto de venta GMI2 (brand: POS Lumière)

> Este `CLAUDE.md` **extiende** las reglas compartidas en `../CLAUDE.md` (raíz del workspace)
> y `../docs/FRONTEND-CONVENTIONS.md` + `../docs/API-CONTRACT.md`. Leer primero la raíz.
> Acá sólo van overrides y cosas específicas del POS.

> **Nombre técnico del repo / paquete**: `pos-frontend`. **Brand visible al staff**:
> "POS Lumière" (genérico v0 — se cambia por el nombre real del negocio en producción).

---

## Rol del frontend

Punto de venta para **staff de tienda** (admin / super_admin). Registra ventas
presenciales (canal `pos`) y por WhatsApp (canal `whatsapp`), gestiona caja
(apertura/cierre + movimientos cash_in/cash_out) y muestra reportes diarios.

Consume `/admin/pos/*` y `/staff/auth/*` del back. NO usa endpoints customer.

**Audiencia técnica**: tablet landscape principalmente (resolución típica
1280x800), también desktop. Mobile portrait soportado pero no es el target.

**Acceso**: solo staff con rol `admin` o `super_admin` (back exige
`@RequireStaffRole(SUPER_ADMIN, ADMIN)`). El rol `user` puede loguear pero
ve un mensaje "sin permisos".

---

## Diferenciador clave: offline-first

A diferencia del backoffice (online-only), el POS **se diseña offline-first**
desde el día uno. Tablets de tienda pueden tener internet inestable y la
caja no puede parar.

**Estrategia**:
- **App shell cacheado** por service worker (vite-plugin-pwa + Workbox).
  La app abre sin conexión.
- **Catálogo de productos cacheado en IndexedDB** (Dexie, tabla `products`).
  Refresh manual o automático cuando vuelve la conexión.
- **Cola de ventas offline**: si una venta se crea sin conexión, se guarda
  en IndexedDB (`pendingOrders`) con `synced: false`. Un sync worker la
  empuja al back cuando vuelve la conexión, en orden FIFO.
- **Operaciones que SÍ requieren online** (caja open/close, anular,
  devolver, reportes): muestran "Sin conexión" si offline. No se encolan.
- **Banner visual** "Modo offline" + badge con count de ventas pendientes.

La base de IndexedDB ya está declarada en `src/db/index.ts` desde el
bootstrap. Cada feature la usa cuando aterriza.

---

## Scope MVP (por fases)

**Phase 1 — venta básica online**
- Login staff + guards
- Pantalla "Nueva venta": grid táctil de productos + cart sidebar + cobrar
- Modal de cobrar: método de pago + datos cliente + boleta/factura → POST orden
- Pantalla post-venta con comprobante

**Phase 2 — caja y listados**
- Apertura/cierre de caja con arqueo (contado vs esperado)
- Movimientos cash_in/cash_out
- Listado de ventas del día con filtros
- Detalle de venta + anular + devolver (parcial/total)

**Phase 3 — reportes**
- Daily summary
- By payment method (rango de fechas)
- By staff (super_admin only)

**Phase 4 — offline-first completo**
- SW para shell ya está desde el bootstrap; agregar:
- Cache de catálogo en IndexedDB con refresh
- Cola de ventas offline + sync worker
- Banner offline + indicador de pendientes

**Fuera de scope** v0: multi-tienda, integración con balanza/escáner físico,
impresión térmica desde el browser (eventual via Web Bluetooth o backend
relay), reportes mensuales, exportación PDF.

---

## Comandos del proyecto

```bash
pnpm dev               # Vite dev server (puerto 5175 con strictPort)
pnpm build             # tsc -b && vite build (genera SW + manifest)
pnpm preview           # Preview del build (testear PWA con SW real)
pnpm test              # Vitest watch
pnpm test:ci           # Vitest run (CI)
pnpm lint              # ESLint
pnpm lint:fix          # ESLint --fix
pnpm format            # Prettier --write
pnpm typecheck         # tsc --noEmit
```

**Puerto del dev server**: 5175 (con `strictPort: true`). Convención del
workspace: 5173 = ecommerce, 5174 = backoffice, 5175 = POS.

---

## Scopes de Conventional Commits (específicos del POS)

`auth`, `pos-sale`, `cart`, `cashbox`, `cash-movements`, `invoice`,
`reports`, `offline`, `sync`, `pwa`, `ui`, `layout`, `router`, `api`, `db`.

Ejemplos:
- `feat(pos-sale): add product grid and cart sidebar`
- `feat(cashbox): open/close cash register with arqueo`
- `feat(offline): cache product catalog with manual refresh`
- `feat(sync): pending orders queue with FIFO worker`

---

## Theming

- Theme **dark** copiado del backoffice (consistente staff-facing).
- Si en el futuro hace falta light theme (tienda con buena luz natural),
  agregar variante `.light` en `src/styles/theme.css` (la estructura ya
  está preparada).
- `body { touch-action: manipulation }` para evitar zoom accidental en
  tablets por double-tap.

---

## Diseño visual

Mockups y código generado por Figma en `.claude/ui-design/` (gitignored —
local only). Solo para referencia visual. La lógica interna se moldea con
TanStack + las libs definidas en la raíz.

---

## Backend API reference

**No hay un `backend-api.md` mantenido a mano.** La fuente de verdad son
los docs del back en:

- `../docs/backend-mirror/` (espejo refrescable)
- `../backend/docs/modules/` (siempre lo más fresco — `git pull` + skill `sync-backend-docs`)

Endpoints específicos del POS: `backend/docs/modules/pos.md`. Cubre ventas
POS/WhatsApp + caja + reportes. Todo bajo `/admin/pos/*` con
`@RequireStaffRole(SUPER_ADMIN, ADMIN)`.

Auth staff: `backend/docs/modules/auth.md` (sección "Staff Auth"). Mismos
endpoints que el backoffice (`/staff/auth/*`).

---

## Variables de entorno

| Variable | Default dev | Notas |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` | Base URL del backend (incluye prefix `/api/v1` que setea el back en `setGlobalPrefix`) |

El POS no necesita Google OAuth, MercadoPago public key ni datos de tienda
en envs (el back hace la integración con MP cuando la venta es por
mercadopago; los datos de la tienda se hardcodean en el header como
"POS Lumière" hasta que sea multi-tienda).

---

## Override del estilo de código

Hereda todo de `../CLAUDE.md` y `../docs/FRONTEND-CONVENTIONS.md`. Sin
overrides al día de hoy.
