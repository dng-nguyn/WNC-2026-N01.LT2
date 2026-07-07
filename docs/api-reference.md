# API Reference

## Base URL

| Environment | URL |
|---|---|
| Development | `http://localhost:3000` |
| Swagger | `/api/docs` |

---

## Authentication

The API uses **JWT authentication** delivered via **HTTP-only cookies**. To authenticate requests from a browser client, set `credentials: 'include'` on all `fetch` calls (or `withCredentials: true` in Axios).

On successful login or registration the server sets access and refresh tokens as cookies. Subsequent requests carrying those cookies are authenticated automatically.

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one number

---

## Endpoints

### Auth (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | No | Register a new user. Body: `username`, `password`, optional `fullName`, `phone`. |
| `POST` | `/auth/login` | No | Login. Returns tokens in HTTP-only cookies. Body: `username`, `password`. |
| `POST` | `/auth/refresh` | No | Refresh access token. Body: optional `refreshToken`. |
| `POST` | `/auth/logout` | No | Logout. Clears authentication cookies. |
| `GET` | `/auth/profile` | Yes | Get the current authenticated user's profile. |
| `POST` | `/auth/change-password` | Yes | Change the authenticated user's password. Body: `currentPassword`, `newPassword`. |

---

### Users (`/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/users` | Yes (MANAGER) | Create a new user. Body: `username`, `password`, optional `fullName`, `phone`, `role`. Requires MANAGER role. |
| `GET` | `/users` | Yes | List all users. |
| `GET` | `/users/:id` | Yes | Get a user by ID. |
| `PATCH` | `/users/:id` | Yes (MANAGER) | Update a user. Requires MANAGER role. |
| `POST` | `/users/:id/reset-password` | Yes (MANAGER) | Reset a user's password. Body: optional `password` (if omitted, a random password is generated). Requires MANAGER role. |

---

### Menus (`/menus`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/menus` | Create a menu. Body: `name`, optional `description`. |
| `GET` | `/menus` | List all menus. |
| `GET` | `/menus/:id` | Get a menu by ID. |
| `PATCH` | `/menus/:id` | Update a menu. |
| `DELETE` | `/menus/:id` | Delete a menu. |

---

### Menu Items (`/menu-items`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/menu-items` | Create a menu item. Body: `name`, `price`, `menuId`, optional `isAvailable`. |
| `GET` | `/menu-items` | List all menu items. Supports `?menuId=` query parameter to filter by menu. |
| `GET` | `/menu-items/:id` | Get a menu item by ID. |
| `PATCH` | `/menu-items/:id` | Update a menu item. |
| `DELETE` | `/menu-items/:id` | Delete a menu item. |

---

### Tables (`/tables`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tables` | Create a table. Body: `tableNumber`, optional `status`. |
| `GET` | `/tables` | List all tables. |
| `GET` | `/tables/:id` | Get a table by ID. |
| `PATCH` | `/tables/:id` | Update a table. |
| `DELETE` | `/tables/:id` | Delete a table. |

**Status enum:** `EMPTY` · `OCCUPIED` · `RESERVED`

---

### Employees (`/employees`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/employees` | Yes (MANAGER) | Create an employee. Body: `fullName`, `email`, optional `username`, `password`, `role`, `phone`, `position`, `department`, `salary`, `isActive`. Requires MANAGER role. |
| `GET` | `/employees` | No | List all employees (includes linked user). |
| `GET` | `/employees/:id` | No | Get an employee by ID (includes linked user). |
| `PATCH` | `/employees/:id` | Yes (MANAGER) | Update an employee. All fields optional; set `userId: null` to unlink user. Requires MANAGER role. |
| `DELETE` | `/employees/:id` | Yes (MANAGER) | Delete an employee. Requires MANAGER role. |
| `POST` | `/employees/:id/reset-password` | Yes (MANAGER) | Reset an employee's password. Body: optional `newPassword` (if omitted, a random password is generated). Requires MANAGER role. |
---

### Orders (`/orders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Create an order. Body: optional `tableId`, `userId`, `items[]`. |
| `GET` | `/orders` | List all orders. |
| `GET` | `/orders/active` | List active orders only (status: `PENDING`, `CONFIRMED`, or `PREPARING`). Uses an inner join on `table` to exclude orders without an assigned table. Returns each order with its `table`, `user`, and `items` (including `menuItem`) relations. |
| `GET` | `/orders/:id` | Get an order by ID. |
| `PATCH` | `/orders/:id` | Update an order. |
| `DELETE` | `/orders/:id` | Delete an order. |
| `POST` | `/orders/:id/items` | Add an item to an existing order. Body: `menuItemId`, `quantity`, optional `note`. |
| `PATCH` | `/orders/:id/items/:itemId` | Update an item in an order. Body: optional `quantity`, `note`. |
| `DELETE` | `/orders/:id/items/:itemId` | Remove an item from an order. |

**Status enum:** `PENDING` · `CONFIRMED` · `PREPARING` · `COMPLETED` · `CANCELLED`

---

### Payments (`/payments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payments/qr` | Create a QR payment for an order. Body: `orderId`. |
| `GET` | `/payments/:id` | Get a payment by ID. |
| `GET` | `/payments/order/:orderId` | Get all payments for a given order. |
| `POST` | `/payments/:id/verify` | Verify a payment via Sepay. |
| `POST` | `/payments/:id/mark-manual` | Mark a payment as manually verified. Sets payment status to `COMPLETED`, updates the associated order status to `COMPLETED`, and logs a transaction with `verificationType: MANUAL`. |

---

### Transactions (`/transactions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/transactions` | List transactions. Query params: `limit` (default 50), `dateFrom` (`YYYY-MM-DD`), `dateTo` (`YYYY-MM-DD`). Primary source: immudb; falls back to MySQL if immudb is unavailable. |
| `GET` | `/transactions/:id` | Get a transaction by ID. Direct key lookup in immudb; falls back to MySQL. |
| `POST` | `/transactions/:id/reverify` | Re-verify a transaction against SePay by payment code. Returns 404 if no matching SePay transaction is found or if the transaction has no payment code. |

**VerificationType enum:** `AUTO` · `MANUAL`

---
### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Returns `Hello World!`. Useful for uptime monitoring and load-balancer health probes. |
