# WNC-2026-N01.LT2

This project is a NestJS backend for a coffee shop management system. Implemented CRUD modules: `menus`, `menu-items`, `tables`, `employees`, and `orders`.

## Run

1. Install dependencies: `npm install`
2. Set up your `.env` file with the database connection details
3. Start development server: `npm run start:dev`

The app listens on port `3000` by default.

## Menu CRUD API

- `POST /menus` - create a new menu
- `GET /menus` - get all menus
- `GET /menus/:id` - get menu by id
- `PATCH /menus/:id` - update menu
- `DELETE /menus/:id` - delete menu

## Menu Item CRUD API

- `POST /menu-items` - create a new menu item
- `GET /menu-items` - get all menu items
- `GET /menu-items/:id` - get menu item by id
- `PATCH /menu-items/:id` - update menu item
- `DELETE /menu-items/:id` - delete menu item

## Table CRUD API

- `POST /tables` - create a new table
- `GET /tables` - get all tables
- `GET /tables/:id` - get table by id
- `PATCH /tables/:id` - update table
- `DELETE /tables/:id` - delete table

## Employee CRUD API

- `POST /employees` - create a new employee
- `GET /employees` - get all employees
- `GET /employees/:id` - get employee by id
- `PATCH /employees/:id` - update employee
- `DELETE /employees/:id` - delete employee

## Order CRUD API

- `POST /orders` - create a new order (with items)
- `GET /orders` - get all orders
- `GET /orders/:id` - get order by id
- `PATCH /orders/:id` - update order status or table
- `DELETE /orders/:id` - delete order
- `POST /orders/:id/items` - add item to an existing order

## Authentication & Authorization

The project uses **JWT** (JSON Web Token) for authentication, with **HTTP-only cookies** for secure token storage and **express-session** for session management. Passwords are hashed with **argon2id**.

### Auth endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| POST | `/auth/register` | No | Register a new user with `username` and `password` (min 6 chars) |
| POST | `/auth/login` | No | Login with `username` and `password`, receive JWT token |
| GET | `/auth/profile` | Yes | Get the profile info of the currently authenticated user |

### Register example

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "yourname", "password": "yourpassword"}'
```

**Response:**
```json
{
  "message": "Registration successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "yourname",
    "createdAt": "2026-06-25T00:00:00.000Z"
  }
}
```

### Login example

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "yourname", "password": "yourpassword"}'
```

### Profile example (authenticated)

```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <your-access-token>"
```

**Response:**
```json
{
  "message": "Authenticated user profile",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "yourname"
  },
  "session": null
}
```

### .env configuration

Add the following to your `.env` file:

```env
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret-key
```

## Activity Diagram

- Menu CRUD flow: [docs/menu-crud-activity-diagram.md](docs/menu-crud-activity-diagram.md)
- Menu Item CRUD flow: [docs/menu-item-crud-activity-diagram.md](docs/menu-item-crud-activity-diagram.md)
- Table CRUD flow: [docs/table-crud-activity-diagram.md](docs/table-crud-activity-diagram.md)
- Employee CRUD flow: [docs/employee-crud-activity-diagram.md](docs/employee-crud-activity-diagram.md)
