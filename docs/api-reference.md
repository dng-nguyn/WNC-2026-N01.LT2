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
| `GET` | `/auth/profile` | Yes | Get the current authenticated user's profile. |

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
| `POST` | `/menu-items` | Create a menu item. Body: `name`, `price`, `menuId`, optional `description`, `imageUrl`. |
| `GET` | `/menu-items` | List all menu items. Supports `?menuId=` query parameter to filter by menu. |
| `GET` | `/menu-items/:id` | Get a menu item by ID. |
| `PATCH` | `/menu-items/:id` | Update a menu item. |
| `DELETE` | `/menu-items/:id` | Delete a menu item. |

---

### Tables (`/tables`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tables` | Create a table. Body: `name`, `capacity`, optional `status`. |
| `GET` | `/tables` | List all tables. |
| `GET` | `/tables/:id` | Get a table by ID. |
| `PATCH` | `/tables/:id` | Update a table. |
| `DELETE` | `/tables/:id` | Delete a table. |

**Status enum:** `AVAILABLE` · `OCCUPIED` · `RESERVED` · `MAINTENANCE`

---

### Employees (`/employees`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/employees` | Create an employee. |
| `GET` | `/employees` | List all employees. |
| `GET` | `/employees/:id` | Get an employee by ID. |
| `PATCH` | `/employees/:id` | Update an employee. |
| `DELETE` | `/employees/:id` | Delete an employee. |

---

### Orders (`/orders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Create an order. Body: `tableId`, `userId`, `items[]`. |
| `GET` | `/orders` | List all orders. |
| `GET` | `/orders/:id` | Get an order by ID. |
| `PATCH` | `/orders/:id` | Update an order. |
| `DELETE` | `/orders/:id` | Delete an order. |
| `POST` | `/orders/:id/items` | Add an item to an existing order. |

**Status enum:** `PENDING` · `PREPARING` · `SERVED` · `COMPLETED` · `CANCELLED`

---

### Payments (`/payments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payments/qr` | Create a QR payment for an order. |
| `GET` | `/payments/:id` | Get a payment by ID. |
| `GET` | `/payments/order/:orderId` | Get all payments for a given order. |
| `POST` | `/payments/:id/verify` | Verify a payment via Sepay. |

---

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Returns `Hello World!`. Useful for uptime monitoring and load-balancer health probes. |
