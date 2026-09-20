# Nagar Bazaar — Backend API Reference

Base URL: `http://localhost:5000/api` (configurable via `NEXT_PUBLIC_API_URL` on the frontend / `PORT` on the backend)

## Conventions

- All request/response bodies are JSON.
- Every response has a top-level `success: boolean`. Successful responses usually include `data` (and `message` for actions); failures include `message` and, for validation errors, an `errors` array from `express-validator`.
- **Auth header**: protected routes require `Authorization: Bearer <token>`, where `<token>` is the JWT returned by `/auth/login` or `/auth/register`.
- **Pagination**: list endpoints that paginate accept `page` (default `1`) and `limit` (varies by endpoint, usually `10`–`12`) and return:
  ```json
  { "page": 1, "limit": 10, "total": 42, "pages": 5 }
  ```
- **Roles**: `customer`, `seller`, `officer`, `admin`. "Protected" means any authenticated user; a specific role list means only those roles.
- **Common status codes**: `200` OK, `201` Created, `400` validation/bad input, `401` missing/invalid token, `403` wrong role, `404` not found, `409` conflict (duplicate), `413` payload too large, `429` rate-limited, `500` server error.
- Rate limits: 300 req/15min across all `/api/*` routes, 20 req/15min specifically on `/api/auth/*` (production only; disabled when `NODE_ENV=test`).

---

## Auth — `/api/auth`

### `POST /api/auth/register`
Public.
```json
// Request
{ "name": "Sita Sharma", "email": "sita@example.com", "password": "password123", "phone": "9812345678", "role": "customer" }
```
`role` is optional and restricted to `customer` | `seller` (any other value fails validation with `400`).
```json
// 201 Response
{ "success": true, "message": "User registered successfully", "token": "...", "user": { "userId": "...", "name": "Sita Sharma", "email": "sita@example.com", "role": "customer" } }
```
Errors: `400` (name < 2 chars, invalid email, password < 8 chars, invalid role), `409` (email already registered).

### `POST /api/auth/login`
Public.
```json
// Request
{ "email": "sita@example.com", "password": "password123" }
```
```json
// 200 Response
{ "success": true, "message": "Login successful", "token": "...", "user": { "userId": "...", "name": "...", "email": "...", "role": "..." } }
```
Errors: `400` (invalid email format / missing password), `401` (wrong password, or account deactivated), `404` (no user with that email).

### `GET /api/auth/profile`
Protected (any role).
```json
// 200 Response
{ "success": true, "user": { "_id": "...", "name": "...", "email": "...", "role": "...", "phone": "...", "isActive": true, "createdAt": "..." } }
```
Password field is always excluded. `401` if no/invalid token.

---

## Products — `/api/products`
All public, no auth required.

### `GET /api/products`
Query: `page`, `limit` (default 12), `category` (ObjectId), `sortBy` (`name`|`price`|`rating`|`latest`, default `name`), `sortOrder` (`asc`|`desc`).
```json
// 200 Response
{ "success": true, "data": [ { "_id": "...", "name": "Basmati Rice", "price": 450, "image": null, "ratings": 4.5, "stock": 50, "isLocal": false, "seller": { "_id": "...", "name": "...", "shopName": "..." } } ], "pagination": { ... } }
```
`400` if `category` is not a valid ObjectId.

### `GET /api/products/:id`
```json
// 200 Response
{ "success": true, "data": { "_id": "...", "name": "...", "description": "...", "price": 450, "stock": 50, "image": null, "category": { "_id": "...", "name": "...", "icon": "🛒" }, "seller": { ... }, "ratings": 4.5, "reviews": [ { "user": "...", "rating": 5, "comment": "...", "date": "..." } ], "isLocal": false, "localProductDetails": null } }
```
`404` if not found, inactive, or `:id` is not a valid ObjectId.

### `GET /api/products/search`
Query: `q` (name substring, case-insensitive), `minPrice`, `maxPrice`, `inStock` (`true`), plus all `GET /api/products` query params (category/sort/pagination). Same response shape as the list endpoint.

---

## Categories — `/api/categories`

### `GET /api/categories`
Public. Returns only active categories.
```json
{ "success": true, "data": [ { "_id": "...", "name": "Grocery", "icon": "🛒", "description": "...", "image": null, "isActive": true } ] }
```

### `GET /api/categories/admin` — `admin`
Same shape, includes inactive categories and adds `productCount` per category.

### `POST /api/categories` — `admin`
```json
{ "name": "Grocery", "description": "...", "icon": "🛒", "image": "..." }
```
`201` on success, `409` if name already exists, `400` on missing name.

### `PUT /api/categories/:categoryId` — `admin`
Same fields as create, all optional, plus `isActive: boolean`.

### `DELETE /api/categories/:categoryId` — `admin`
Soft-delete (`isActive: false`). `400` if active products still reference the category.

---

## Cart — `/api/cart`
All protected (any role, though the frontend only exposes cart UI to customers).

### `GET /api/cart`
```json
{ "success": true, "data": { "_id": "...", "userId": "...", "items": [ { "cartItemId": "...", "product": { "_id": "...", "name": "...", "price": 450, "image": null, "stock": 50, "sellerId": { "shopName": "..." } }, "quantity": 2, "subtotal": 900 } ], "totalItems": 2, "totalPrice": 900 } }
```

### `POST /api/cart/add`
```json
{ "productId": "...", "quantity": 2 }
```
`201` if it's a new cart item, `200` if quantity was merged into an existing one. `400` if quantity would exceed stock, product not found/inactive, or invalid product/quantity.

### `PUT /api/cart/item/:itemId`
```json
{ "quantity": 3 }
```
Setting `quantity <= 0` removes the item. `400` if it exceeds stock. `404` if the item doesn't belong to the caller's cart.

### `DELETE /api/cart/item/:itemId`
Removes one item. `404` if not found in the caller's cart.

### `DELETE /api/cart/clear`
Empties the whole cart.

---

## Orders — `/api/orders`
All protected.

### `POST /api/orders/checkout`
```json
{ "deliveryAddress": "Baneshwor, Kathmandu", "paymentMethod": "cod" }
```
`paymentMethod` is `cod` | `online`. Uses the caller's current cart — fails `400` if the cart is empty, contains an inactive product, or quantity exceeds available stock. On success: generates an order number (`NG-YYYY-NNNNN`), creates `OrderItem`s, decrements product stock, increments each seller's `totalOrders`, and clears the cart.
```json
// 201 Response
{ "success": true, "message": "Order created successfully", "data": { "orderId": "...", "orderNumber": "NG-2026-00001", "totalAmount": 900, "paymentMethod": "cod", "paymentStatus": "pending", "orderStatus": "placed", "items": [ { "product": {...}, "quantity": 2, "price": 450, "seller": {...} } ], "createdAt": "..." } }
```

### `GET /api/orders`
Query: `page`, `limit` (default 10). Only the caller's own orders.
```json
{ "success": true, "data": [ { "orderId": "...", "orderNumber": "...", "totalAmount": 900, "orderStatus": "placed", "createdAt": "...", "itemCount": 2 } ], "pagination": {...} }
```

### `GET /api/orders/:orderId`
Full order detail, scoped to the caller (`404` if it belongs to someone else). Includes items, timeline, and an `estimatedDelivery` date (createdAt + 4 days).

### `GET /api/orders/:orderId/track`
Timeline-focused view: `{ orderNumber, timeline: [{status, timestamp, label}], currentStatus, estimatedDelivery }`, with future steps shown as pending (`timestamp: null`).

---

## Sellers — `/api/sellers`

### `GET /api/sellers`
Public. Query: `page`, `limit` (default 12), `location` (regex match), `verified` (`true` → only `approved` sellers).
```json
{ "success": true, "data": [ { "_id": "...", "shopName": "...", "location": "...", "contact": "...", "ratings": 4.2, "totalOrders": 12, "productCount": 8, "verificationStatus": "approved", "createdAt": "..." } ], "pagination": {...} }
```

### `GET /api/sellers/:sellerId`
Public. Same shape as one item above.

### `POST /api/sellers/register` — `seller`
```json
{ "shopName": "Kathmandu Fresh Mart", "description": "...", "location": "Kathmandu", "contact": "9801000001", "bankDetails": { "accountName": "...", "accountNumber": "...", "bankName": "..." }, "banner": "..." }
```
Creates a `Seller` profile with `verificationStatus: 'pending'`. `409` if the caller already has a profile or the shop name is taken.

### `PUT /api/sellers/profile` — `seller`
Same fields, all optional. Updates the caller's own seller profile.

### `POST /api/sellers/products` — `seller`
```json
{ "name": "...", "description": "...", "categoryId": "...", "price": 450, "stock": 20, "image": "...", "isLocal": false, "localProductDetails": { "producer": "...", "location": "..." } }
```
`201` on success.

### `GET /api/sellers/products` — `seller`
The caller's own products, paginated (`sortBy`: `name`|`price`|`stock`|`createdAt`).

### `GET /api/sellers/products/:productId` — `seller`
### `PUT /api/sellers/products/:productId` — `seller`
Same body as create, all fields optional; `404` if the product isn't the caller's own.

### `DELETE /api/sellers/products/:productId` — `seller`
Soft-deletes (`isActive: false`).

### `GET /api/sellers/dashboard` — `seller`
Returns `shopName`, `verificationStatus` (+ `rejectionReason`/`reviewReason`/`verificationHistory`), `totalSales`, `totalOrders`, `totalProducts`, `averageRating`, `lowStockCount`, `thisMonthSales`/`lastMonthSales`/`todaySales`/`thisMonthOrders`/`salesGrowthPercent`, `recentOrders`, `ordersByStatus`, `lowStockProducts`, `topProducts`, `salesLast30Days`. `404` if the caller hasn't registered a seller profile yet.

### `GET /api/sellers/orders` — `seller`
Query: `page`, `limit`, `status` (`placed`|`confirmed`|`shipped`|`delivered`|`cancelled`), `sortBy` (`date`|`amount`), `sortOrder`. Only orders containing the caller's products.

### `GET /api/sellers/orders/:orderId` — `seller`
Full detail of one order, scoped to items belonging to the caller.

### `PUT /api/sellers/orders/:orderId/status` — `seller`
```json
{ "status": "confirmed" }
```
Status must progress sequentially (`placed → confirmed → shipped → delivered`); `400` if the requested status isn't the immediate next step.

---

## Complaints — `/api/complaints`
All protected.

### `POST /api/complaints` — `customer`
```json
{ "category": "quality_issue", "title": "Product arrived damaged", "description": "The packaging was torn and contents were spoiled.", "sellerId": "...", "productId": "...", "relatedOrderId": "...", "attachments": ["/uploads/a.jpg"] }
```
`category` ∈ `overpricing`|`expired_product`|`quality_issue`|`misleading_info`|`seller_issue`|`other`. `title` ≥ 10 chars, `description` ≥ 20 chars, up to 3 `attachments`. At least one of `sellerId`/`productId` is required (`400` otherwise); both must reference real, existing documents.
```json
// 201 Response
{ "success": true, "message": "Complaint submitted successfully", "data": { "complaintId": "...", "complaintNumber": "NC-2026-00001", "status": "submitted", "createdAt": "..." } }
```

### `GET /api/complaints/citizen` — `customer`
Query: `page`, `limit`, `status`, `category`, `q` (complaint number search), `dateFrom`, `dateTo`. Only the caller's own complaints.

### `GET /api/complaints` — `officer`, `admin`
Same filters as above plus `submittedBy` (userId), `assignedTo` (`unassigned` | `me` | an officer id). System-wide.

### `GET /api/complaints/:complaintId`
Protected (any role, but a `customer` only sees their own — `404` otherwise). Full detail including `timeline`, `submittedBy`, `seller`, `product`, `assignedOfficer`, `officerRemarks`, `resolution`, `attachments`, `relatedOrder`.

### `PUT /api/complaints/:complaintId/status` — `officer`, `admin`
```json
{ "status": "in_progress", "officerRemarks": "Contacting the seller." }
```
`status` ∈ `under_review`|`in_progress`|`resolved`. Only the officer the complaint is assigned to (or an admin) may update it — `403` otherwise. `400` if already resolved.

### `PUT /api/complaints/:complaintId/assign` — `admin`
```json
{ "officerId": "..." }
```
Assigns/reassigns the complaint; auto-advances `submitted` → `under_review`.

### `PUT /api/complaints/:complaintId/resolve` — `officer`, `admin`
```json
{ "resolution": "Seller issued a full refund.", "officerRemarks": "..." }
```
Sets status to `resolved` and stamps `resolvedAt`. Same ownership rule as the status update.

---

## Government Notices — `/api/notices`

### `GET /api/notices`
Public. Query: `page`, `limit`, `category`, `priority`, `archived` (default `false`), `q` (title search), `sortBy` (`priority`|`publishedAt`), `sortOrder`.

### `GET /api/notices/:noticeId`
Public. Increments the notice's `viewCount` on every read.

### `POST /api/notices` — `officer`, `admin`
```json
{ "title": "...", "content": "...", "category": "public_notice", "priority": "medium" }
```
`category` ∈ `market_info`|`consumer_awareness`|`public_notice`|`regulations`|`price_info`. `priority` ∈ `low`|`medium`|`high` (default `low`).

### `PUT /api/notices/:noticeId` — `officer`, `admin`
Same fields, all optional.

### `DELETE /api/notices/:noticeId` — `admin`
Hard delete.

### `PUT /api/notices/:noticeId/archive` — `admin`
Sets `isArchived: true` and stamps `archiveAt`.

---

## Seller Verification — `/api/verification`
All require `officer` or `admin`; the approve/reject/review actions are `admin`-only.

### `GET /api/verification/sellers`
Query: `page`, `limit`, `status` (`pending`|`approved`|`rejected`|`review_required`), `sortBy` (`date`|`shopName`).

### `GET /api/verification/sellers/:sellerId`
Full detail: owner contact info, bank details, `verificationHistory`, sample `products`, `complaintHistory`, `totalOrders`.

### `PUT /api/verification/sellers/:sellerId/approve` — `admin`
```json
{ "officerId": "..." }
```
`officerId` optional (defaults to the caller's own officer profile if present).

### `PUT /api/verification/sellers/:sellerId/reject` — `admin`
```json
{ "reason": "Bank details could not be verified.", "officerId": "..." }
```

### `PUT /api/verification/sellers/:sellerId/review` — `admin`
```json
{ "reviewReason": "Please re-submit a clearer copy of your registration.", "officerId": "..." }
```

Every action pushes an entry onto the seller's `verificationHistory`.

---

## Market Monitoring — `/api/market-monitoring`
All require `officer` or `admin`.

### `GET /api/market-monitoring/prices`
Query: `page`, `limit`, `category` (categoryId), `status` (`normal`|`review_required`), `seller` (sellerId), `sortBy` (`product`|`averagePrice`|`deviation`). Each record includes a computed `priceDeviation` (% vs. `averageMarketPrice`).

### `GET /api/market-monitoring/prices/:priceId`
Full detail plus `history` (price/status snapshots over time) and `otherSellers` (the same product's price at every other seller, for comparison).

### `PUT /api/market-monitoring/prices/:priceId/status`
```json
{ "status": "review_required", "remarks": "20% above category average." }
```
Appends a snapshot to the record's `history`.

### `GET /api/market-monitoring/analytics`
Returns `pricesUnderReview`, `averagePriceDeviation`, `mostOverpriced` (top 5), `pricesByCategory`, `trendData` (14-day review-flag trend).

---

## Government Officers — `/api/officers`

### `GET /api/officers/dashboard` — `officer`
Personal workload (`assignedComplaints`, `pendingComplaints`, `resolvedComplaints`, `resolvedThisMonth`, `resolutionRate`, `averageResolutionTime`, `myWorkload` list), system-wide stats, seller-verification and market-monitoring summaries, chart data (`categoryDistribution`, `statusDistribution`, `trend`, `resolutionTimeline`, `workloadTrend`), and a merged `recentActivity` feed.

### `GET /api/officers` — `officer`, `admin`
Directory of officers with `assignedCount` (open complaints) each — used to populate assignment dropdowns.

---

## Customer Dashboard — `/api/customers`

### `GET /api/customers/dashboard` — `customer`
`totalOrders`, `activeOrders`, `completedOrders`, `totalSpent`, `complaintCount`, `recentOrders`, `activeOrdersList`, `recentComplaints`, `recentNotices`, `orderTrend` (30-day), `spendingChart` (by category).

---

## Admin — `/api/admin`
Everything under this base path requires `admin`.

### `GET /api/admin/dashboard`
The largest endpoint in the API — returns `systemStats`, `userManagement`, `sellerManagement`, `marketActivity`, `complaintAnalytics`, `systemHealth`, `officerPerformance`, `unassignedComplaints`, and `recentActivity`. See `BACKEND_API.md`'s controller (`adminController.js`) for the exact shape of each section — it powers the entire `/admin/dashboard` page.

### `GET /api/admin/users`
Query: `page`, `limit`, `role`, `status` (`active`|`blocked`), `q` (name/email search).

### `GET /api/admin/users/:userId`

### `PUT /api/admin/users/:userId/status`
```json
{ "isActive": false }
```
Blocks/unblocks any account except the caller's own (`400` if you try).

### `GET /api/admin/products`
Query: `page`, `limit`, `category`, `seller`, `q`. System-wide product listing (includes inactive products, unlike the public endpoints).

### `DELETE /api/admin/products/:productId`
**Hard delete** — permanently removes the product (distinct from a seller's own soft-delete).

### `GET /api/admin/officers`
Each entry includes `assigned`/`resolved`/`resolutionRate`.

### `POST /api/admin/officers`
```json
{ "name": "...", "email": "...", "password": "...", "phone": "...", "department": "...", "designation": "...", "officeLocation": "..." }
```
Creates both the `User` (role `officer`) and the `GovernmentOfficer` profile in one call.

### `PUT /api/admin/officers/:officerId`
Updates department/designation/officeLocation/verificationLimit, and optionally the linked user's name/phone.

### `PUT /api/admin/officers/:officerId/status`
```json
{ "isActive": false }
```
Deactivates/reactivates the officer's underlying user account.

---

## File Uploads — `/api/uploads`

### `POST /api/uploads`
Protected (any role). `multipart/form-data` with up to 3 files under the field name `files`.
```json
// 201 Response
{ "success": true, "message": "Files uploaded", "data": { "urls": ["/uploads/16912345-file.jpg"] } }
```
Returned URLs are relative — resolve them against the backend origin (not `/api`), e.g. `http://localhost:5000/uploads/...`.

---

## Development-only — `/api/seed`

### `POST /api/seed/initialize`
Only responds when `NODE_ENV=development` (`403` otherwise). Seeds categories, sellers, customers, an officer, an admin, products, reviews, notices, and market prices — but only once (checks a marker record first; safe to call repeatedly).
```json
{ "success": true, "message": "Database seeded successfully", "counts": { "users": 11, "sellers": 4, "products": 32, ... } }
```
