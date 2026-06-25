# WNC-2026-N01.LT2
# Bài làm Nguyễn Đình Anh Dũng - 24100331

This project is a NestJS backend for a coffee shop management system. The implemented CRUD examples are for `categories`, `employees`, and `orders`.

## Run

1. Install dependencies: `npm install`
2. Set up your `.env` file with the database connection details
3. Start development server: `npm run start:dev`

The app listens on port `3000` by default.

## Category CRUD API

- `POST /categories` - create a new category
- `GET /categories` - get all categories
- `GET /categories/:id` - get category by id
- `PATCH /categories/:id` - update category
- `DELETE /categories/:id` - delete category

## Employee CRUD API

- `POST /employees` - create a new employee
- `GET /employees` - get all employees
- `GET /employees/:id` - get employee by id
- `PATCH /employees/:id` - update employee
- `DELETE /employees/:id` - delete employee

## Order CRUD API

- `POST /orders` - create a new order
- `GET /orders` - get all orders
- `GET /orders/:id` - get order by id
- `PATCH /orders/:id` - update order
- `DELETE /orders/:id` - delete order

## Activity Diagram

- Category CRUD flow: [docs/category-crud-activity-diagram.md](docs/category-crud-activity-diagram.md)
- Employee CRUD flow: [docs/employee-crud-activity-diagram.md](docs/employee-crud-activity-diagram.md)
