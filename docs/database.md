# Database Documentation

## Overview

- **Engine:** MySQL 8
- **ORM:** TypeORM 0.3 (`synchronize: true` in development)
- **Primary Keys:** UUID (auto-generated)
- **Timestamps:** All tables include `created_at` and `updated_at` columns

## Tables

### users

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| username | varchar | unique |
| password | varchar | argon2id hash |
| full_name | varchar | nullable |
| phone | varchar | nullable |
| role | enum | MANAGER, STAFF |
| created_at | timestamp | |
| updated_at | timestamp | |

### categories

*Maps to the `Menu` entity in the ORM.*

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| name | varchar | |
| description | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### products

*Maps to the `MenuItem` entity in the ORM.*

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| name | varchar | |
| price | decimal(10,2) | |
| description | text | nullable |
| image_url | varchar | nullable |
| menu_id | UUID | FK → categories |
| is_available | boolean | default true |
| created_at | timestamp | |
| updated_at | timestamp | |

### tables

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| name | varchar | |
| capacity | int | |
| status | enum | AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE |
| created_at | timestamp | |
| updated_at | timestamp | |

### employees

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| name | varchar | |
| position | varchar | nullable |
| phone | varchar | nullable |
| email | varchar | nullable |
| hire_date | date | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### orders

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| table_id | UUID | FK → tables, nullable |
| user_id | UUID | FK → users, nullable |
| status | enum | PENDING, PREPARING, SERVED, COMPLETED, CANCELLED |
| total_amount | decimal(10,2) | |
| notes | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### order_items

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| order_id | UUID | FK → orders |
| menu_item_id | UUID | FK → products |
| quantity | int | |
| price | decimal(10,2) | captured at order time |
| created_at | timestamp | |
| updated_at | timestamp | |

### payment_requests

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| order_id | UUID | FK → orders |
| amount | decimal(10,2) | |
| status | enum | PENDING, COMPLETED, FAILED, EXPIRED |
| qr_code | text | nullable |
| sepay_id | varchar | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

## Relationships

- **Menu (1) → MenuItem (many):** Each menu category contains multiple menu items.
- **Order (1) → OrderItem (many):** Each order contains multiple line items.
- **MenuItem (1) → OrderItem (many):** Each menu item can appear across many order items.
- **Table (1) → Order (many):** Each table can be associated with multiple orders over time.
- **User (1) → Order (many):** Each user can place multiple orders.
- **Order (1) → Payment (many):** Each order can have multiple payment requests.

## Entity-to-Table Mapping Note

The ORM entity names differ from the SQL table names by design:

| ORM Entity | SQL Table | Reason |
| --- | --- | --- |
| Menu | categories | SQL schema uses category/product terminology |
| MenuItem | products | SQL schema uses category/product terminology |

This is intentional — the SQL schema uses `categories` and `products` as table names, while the API exposes `/menu` and `/menu-items` routes. The ORM layer bridges the two naming conventions.
