# Nagar Bazaar — Frontend Guide

A guide to how the frontend (`frontend/`) is put together: Next.js 16 App Router, React 19, Tailwind CSS 4.

## 1. Routing Structure

Every folder under `app/` with a `page.js` is a route (App Router convention). Dynamic segments use `[param]` folders.

```
/                              Homepage
/login  /register              Auth
/products  /products/[id]      Public product catalog
/local-products                Local-products showcase
/notices  /notices/[id]        Public government notices

/customer/dashboard            Customer dashboard
/customer/cart  /checkout       Cart & checkout
/customer/orders  /orders/[id]  Order history & tracking
/customer/complaints ...        File & track complaints

/seller/dashboard               Seller dashboard
/seller/products ...            Product management
/seller/orders                  Order fulfillment queue

/government/dashboard           Shared officer/admin "civic oversight" dashboard
/government/sellers ...         Seller verification workflow
/government/complaints ...      Complaint management
/government/notices ...         Notice publishing
/government/market-monitoring   Price monitoring

/admin                          Dedicated admin login page
/admin/dashboard                Central admin dashboard
/admin/users /sellers /products /categories /officers   Management panels
/admin/complaints /notices      Thin redirects into the shared /government/* pages
/admin/analytics                Comparative trends + CSV export
```

Route protection is done client-side: every protected page checks `useAuth()`'s `user`/`loading` in a `useEffect` and calls `router.push(...)` (to `/login`, or `/admin` for the admin area) if the role doesn't match. There's no middleware-based route guard — each page owns its own check, following the pattern already established across the app.

Two redirect-only pages exist for backwards-compatible URLs: `officer/dashboard` → `government/dashboard`, and `admin/complaints`/`admin/notices` → the shared `government/*` pages (avoids duplicating UI that's already role-shared between officer and admin).

## 2. Component Structure

`components/` holds shared, reusable presentational pieces used across multiple pages:

| Component | Used for |
|---|---|
| `Navbar.jsx` / `Footer.jsx` | Global layout (in `app/layout.js`) |
| `ProductCard.jsx` | Product grid item (products page, local-products page) — wrapped in `React.memo` since it renders in lists |
| `DashboardStatCard.jsx` | The stat tiles at the top of every dashboard |
| `OrderTimeline.jsx` / `ComplaintTimeline.jsx` | Vertical status-timeline visualizations |
| `CartSummary.jsx` | Cart totals sidebar (cart & checkout pages) |
| `SellerProductForm.jsx` | Shared create/edit form for seller products |
| `NoticeForm.jsx` | Shared create/edit form for government notices |
| `LocalProductCard.jsx` | Local-products page item |

Page-specific components that aren't reused elsewhere live next to their `page.js` in the same route folder (e.g. `government/sellers/[id]/SellerVerificationClient.jsx`, `admin/dashboard/AdminChartsSection.jsx`) rather than in the shared `components/` directory — this keeps `components/` limited to things genuinely shared across routes.

### `page.js` vs. `*Client.jsx` pattern
Dynamic routes that need `params` (an async value in the App Router) use a thin server-compatible `page.js` that awaits `params` and renders a co-located client component:
```js
// app/products/[id]/page.js
import ProductDetailClient from './ProductDetailClient';
export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
```
All actual logic (state, effects, API calls) lives in the `*Client.jsx` file, which is a `'use client'` component.

## 3. Available Hooks

### `useAuth()` — `hooks/useAuth.js`
Thin wrapper around `AuthContext` that adds local `submitting`/`error` state for forms:
```js
const { user, token, loading, submitting, error, login, register, logout, getCurrentUser } = useAuth();
```
- `user` — `{ userId, name, email, role }` or `null`
- `loading` — true while restoring a session from `localStorage` on first mount
- `login(email, password)` / `register(data)` — resolve with the new user, or set `error` and throw
- `logout()` — clears the session

### `useCart()` — `hooks/useCart.js`
Wrapper around `CartContext`:
```js
const { cart, loading, initialized, error, getCart, addToCart, updateQuantity, removeItem, clearCart, checkout } = useCart();
```
`cart` is always `{ items, totalItems, totalPrice }` (never `null`), so components can render it directly without a null check.

## 4. State Management Approach

No external state library — just React Context + `useState`/`useEffect`, wired once in `app/layout.js`:
```js
<AuthProvider>
  <CartProvider>       {/* reads AuthContext internally, refetches the cart whenever the token changes */}
    <Navbar />
    <main>{children}</main>
    <Footer />
  </CartProvider>
</AuthProvider>
```
- **`AuthContext`** persists `token`/`user` to `localStorage` and restores them on mount.
- **`CartContext`** automatically fetches the cart whenever `auth.token` changes (login/logout), and resets to an empty cart when logged out.
- Everything else (dashboard data, list filters, form state, pagination) is local `useState` inside the page/component that owns it — there's no global store for page-level data. Each dashboard/list page fetches its own data in a `useEffect` keyed on the relevant filter state.

## 5. Styling Approach

Tailwind CSS 4, configured via CSS custom properties in `app/globals.css` (no `tailwind.config.js` — Tailwind 4's CSS-first `@theme` block does the mapping):

```css
--color-primary: #0f2c4c;       /* Governance — deep navy */
--color-accent: #c1712f;        /* Commerce — terracotta/gold */
--color-local: #3e7c59;         /* Local/verified — forest green */
--color-surface / surface-alt / surface-raised   /* warm ivory paper tones */
--color-ink / ink-muted          /* text colors */
--color-border
```
Each has `-dark`/`-light` variants where used (e.g. `primary-dark`, `accent-light`). Use these as Tailwind classes directly: `bg-primary`, `text-accent-dark`, `border-border`, etc. — never hardcode hex colors in a component.

Two font families, both loaded via `next/font/google` in `app/layout.js`:
- `font-display` (Fraunces, a serif) — headings
- `font-sans` (Plus Jakarta Sans) — body text

Common UI conventions used throughout (match these when adding new pages):
- Cards: `rounded-2xl border border-border bg-surface-raised p-6`
- Pills/badges: `rounded-full px-2.5 py-1 text-xs font-semibold` with a status-keyed color map (e.g. `{ pending: 'bg-accent-light text-accent-dark', approved: 'bg-local-light text-local' }`)
- Primary buttons: `rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark`
- Loading states: `animate-pulse` skeleton blocks shaped like the real content, not spinners
- Empty states: a centered icon + heading + short instruction inside a dashed border (`border-dashed border-border`)

## 6. Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Base URL for all API calls (via `utils/api.js`). Defaults to `http://localhost:5000/api` if unset. |

`utils/api.js` also derives `SERVER_ORIGIN` from this value (stripping `/api`) to build absolute URLs for uploaded files (`getFileUrl()`), since `/uploads/*` is served outside the `/api` prefix.

The Axios instance (`utils/api.js`) does two things automatically:
1. **Request interceptor** — attaches `Authorization: Bearer <token>` from `localStorage` to every request.
2. **Response interceptor** — on any `401` from an authenticated call (excluding the login/register calls themselves), clears the stored session and redirects to `/login` (or `/admin` if already inside the admin area).

## 7. Build and Deployment

```bash
npm run build     # next build (Turbopack)
npm run start     # serve the production build
npm run lint       # eslint
npm test           # jest (component/hook/page tests)
```

Deployment notes:
- Set `NEXT_PUBLIC_API_URL` to the deployed backend's public `/api` URL before building — it's inlined at build time (it's a `NEXT_PUBLIC_*` var), so a rebuild is required if the backend URL changes.
- Any standard Next.js host works (Vercel, or `next start` behind a reverse proxy on your own infrastructure).
- Make sure the deployed backend's `CORS_ORIGIN` includes this frontend's origin — CORS enforcement is skipped only when the backend runs with `NODE_ENV` other than `production`.

## 8. Testing

Jest + `next/jest` (handles the SWC/Turbopack-compatible transform) + React Testing Library. Config: `jest.config.js` / `jest.setup.js`.

```
__tests__/
├── components/ProductCard.test.jsx   # render, props, interactions
├── hooks/useAuth.test.jsx             # session restore, login/register/logout, error surfacing
└── pages/products.test.jsx            # loading/empty/error states, search & filter re-fetch, add-to-cart flow
```
Network calls (`@/utils/api`) and `next/navigation`'s `useRouter` are mocked per-file with `jest.mock(...)` — tests never hit a real backend. Run with `npm test`.
