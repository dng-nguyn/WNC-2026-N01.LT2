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
| user_id | UUID | FK → users, nullable, ON DELETE SET NULL |
| full_name | varchar(100) | |
| email | varchar(100) | unique |
| phone | varchar(15) | nullable |
| position | varchar(50) | nullable |
| department | varchar(50) | nullable |
| salary | decimal(12,2) | nullable |
| is_active | boolean | default true |
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
| sepay_transaction_id | varchar | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### transactions

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID | PK |
| order_id | UUID | FK → orders |
| payment_id | UUID | FK → payment_requests, nullable |
| amount | decimal(12,0) | |
| verification_type | enum | AUTO, MANUAL |
| verified_at | timestamp | |
| reverified_at | timestamp | nullable |
| sepay_transaction_id | varchar(36) | nullable |
| immudb_tx_id | bigint | nullable — immudb ledger index |
| created_at | timestamp | |
| updated_at | timestamp | |


## Relationships

- **Menu (1) → MenuItem (many):** Each menu category contains multiple menu items.
- **User (1) → Employee (many):** Each user account can be linked to employee records (nullable FK).
- **Order (1) → OrderItem (many):** Each order contains multiple line items.
- **MenuItem (1) → OrderItem (many):** Each menu item can appear across many order items.
- **Table (1) → Order (many):** Each table can be associated with multiple orders over time.
- **User (1) → Order (many):** Each user can place multiple orders.
- **Order (1) → Payment (many):** Each order can have multiple payment requests.
- **Order (1) → Transaction (many):** Each order generates a transaction record on payment verification.
- **Payment (1) → Transaction (0..1):** Each payment can be linked to a transaction.
- **immudb (external):** Transaction history is primarily stored in immudb (immutable). MySQL stores `reverifiedAt` updates as a secondary cache.

## immudb Data Structure

Transaction records in immudb use key format `txn:{transactionId}` (MySQL PK) with a secondary index `order:{orderId}:{transactionId}` for order-based lookups. The immudb record stores the following fields:

| Field | Type | Description |
| --- | --- | --- |
| transactionId | string | MySQL transaction PK (`immudb_tx_id` in MySQL) |
| orderId | string | Linked order UUID |
| paymentCode | string | Payment code used for SePay matching (nullable for legacy records) |
| amount | number | Transaction amount in VND |
| verificationType | string | `AUTO` or `MANUAL` |
| sepayTransactionId | string | SePay transaction ID (set on auto-verify or reverify) |
| verifiedAt | ISO 8601 | When the transaction was first verified |
| reverifiedAt | ISO 8601 | When the transaction was last reverified (nullable) |
| sepayReverifiedAt | ISO 8601 | When the SePay transaction itself was verified (nullable) |

When `reverifiedAt` is updated, the existing record is rewritten immutably — the previous version remains in the audit log.

## Entity-to-Table Mapping Note

The ORM entity names differ from the SQL table names by design:

| ORM Entity | SQL Table | Reason |
| --- | --- | --- |
| Menu | categories | SQL schema uses category/product terminology |
| MenuItem | products | SQL schema uses category/product terminology |

This is intentional — the SQL schema uses `categories` and `products` as table names, while the API exposes `/menu` and `/menu-items` routes. The ORM layer bridges the two naming conventions.
