# ADR 001: Entity-to-Table Name Mapping

## Status
Accepted

## Context
The SQL schema uses 'categories' and 'products' as table names, but the NestJS API uses 'menus' and 'menu-items' as route names. The entities are named Menu and MenuItem.

## Decision
Map Menu entity to 'categories' table and MenuItem entity to 'products' table using the `@Entity('table_name')` decorator. This allows the API to use domain-appropriate names while maintaining compatibility with the existing SQL schema.

## Consequences
- API routes use /menus and /menu-items
- Database tables are categories and products
- Developers must remember the mapping when writing raw SQL
- TypeORM handles the mapping transparently

---

# ADR 002: JWT with HTTP-only Cookies

## Status
Accepted

## Context
Need secure authentication that works with CORS and prevents XSS token theft.

## Decision
Use JWT tokens stored as HTTP-only cookies. Access token: 15min, refresh token: 7 days. Both set by backend, sent automatically by browser.

## Consequences
- More secure than localStorage (not accessible via JavaScript)
- Requires credentials: 'include' on frontend fetch calls
- Requires CORS configuration with credentials: true
- Cookie domain must match frontend domain
