# Tài Liệu Backend — Quản Lý Quán Cafe

## Tổng Quan Kiến Trúc

Backend được xây dựng bằng **NestJS 11** + **TypeORM** + **MySQL**, mã nguồn đặt tại `backend/src/`.
Các module chính: Auth, Users, Menu, MenuItem, Table, Order, Employee, Payment.

```
request → Controller → Service → Repository → MySQL
                          │
                    DTO (Validate input)
                          │
                    Entity (ORM map bảng)
```

Mỗi module có cấu trúc:
- `*.entity.ts` — định nghĩa bảng CSDL
- `*.service.ts` — xử lý nghiệp vụ
- `*.controller.ts` — endpoint API
- `dto/*.dto.ts` — kiểm tra dữ liệu đầu vào
- `*.module.ts` — khai báo module cho NestJS

---

## 1. Module Users (`users/`)

### Entity: `User` → Bảng `users`

Lưu tài khoản nhân viên quán (người dùng hệ thống, **không** phải khách hàng).

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID (PK) | Tự sinh |
| `username` | VARCHAR(50) | Duy nhất, dùng đăng nhập |
| `password` | VARCHAR(255) | Hash argon2id, **không** lưu plain-text |
| `fullName` | VARCHAR(100) | Map cột `full_name` |
| `phone` | VARCHAR(15) | Không bắt buộc |
| `role` | ENUM('MANAGER','STAFF') | Mặc định `STAFF` |
| `isActive` | BOOLEAN | Mặc định `true`, map cột `is_active` |
| `createdAt` | TIMESTAMP | Tự động |
| `updatedAt` | TIMESTAMP | Tự động cập nhật |

### Service: `UsersService`

- `create(dto)` — Tạo user mới, kiểm tra username trùng → ném `ConflictException`
- `findByUsername(username)` — Tra user theo username → ném `NotFoundException` nếu không tồn tại
- `findById(id)` — Tra user theo UUID → ném `NotFoundException`

### DTO: `CreateUserDto`

```ts
{ username, password, fullName?, phone? }
```

---

## 2. Module Auth (`auth/`)

Module xác thực — dùng **JWT** (Bearer Token) + **argon2id** (hash mật khẩu).
Token hết hạn sau 1 ngày.

### Flow đăng ký

```
POST /auth/register
  → RegisterDto (username, password, fullName?, phone?)
  → argon2.hash(password) → tạo user → JWT.sign({ sub, username })
  → Set cookie httpOnly + session
  → Trả về { accessToken, user }
```

### Flow đăng nhập

```
POST /auth/login
  → LoginDto (username, password)
  → argon2.verify(password, hash)
  → JWT.sign({ sub, username })
  → Set cookie httpOnly + session
  → Trả về { accessToken, user }
```

### Flow xem profile (cần JWT)

```
GET /auth/profile
  → Header: Authorization: Bearer <token>
  → JwtAuthGuard xác thực
  → Trả về { message, user, session }
```

### Service: `AuthService`

- `register(dto)` — Hash password + tạo user + sinh JWT
- `login(dto)` — Kiểm tra user + xác thực password + sinh JWT
- `validateUser(userId)` — Gọi `UsersService.findById` để verify token payload

### Strategy: `JwtStrategy`

Khai báo với Passport: trích JWT từ `Authorization: Bearer`, giải mã, gắn `{ id, username }` vào `req.user`.

### Middleware

- Cookie parser: đọc cookie `access_token`
- Session: lưu thông tin user trong session (express-session)

---

## 3. Module Menu (Danh Mục) — `menus/`

### Entity: `Menu` → Bảng `categories` (tên bảng cố tình khác tên entity)

Entity cha, nhóm các món ăn theo danh mục.

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID (PK) | |
| `name` | VARCHAR(100) | Duy nhất, tên danh mục (VD: "Khai vị", "Đồ uống") |
| `description` | TEXT | Không bắt buộc |
| `createdAt` | TIMESTAMP | |

### Service: `MenuService`

- `create(dto)` — Tạo danh mục mới
- `findAll()` — Lấy tất cả danh mục, sắp xếp mới nhất trước
- `findOne(id)` — Tìm theo UUID → ném `NotFoundException`
- `update(id, dto)` — Cập nhật tên/mô tả
- `remove(id)` — Xóa (CASCADE sẽ xóa luôn `MenuItem` liên quan)

### DTOs

- **CreateMenuDto**: `{ name (bắt buộc), description? }`
- **UpdateMenuDto**: `{ name?, description? }`

### Endpoints

| Method | Route | Mô tả |
|---|---|---|
| POST | `/menus` | Tạo danh mục |
| GET | `/menus` | Lấy tất cả danh mục |
| GET | `/menus/:id` | Chi tiết danh mục |
| PATCH | `/menus/:id` | Cập nhật danh mục |
| DELETE | `/menus/:id` | Xóa danh mục |

---

## 4. Module MenuItem (Món Ăn) — `menu-items/`

### Entity: `MenuItem` → Bảng `products` (tên bảng cố tình khác entity)

Các món cụ thể trong một danh mục. Quan hệ **N-1** với Menu.

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID (PK) | |
| `menu` | → Menu (FK: `category_id`) | Danh mục chứa món này |
| `name` | VARCHAR(100) | Tên món |
| `price` | DECIMAL(10,2) | Giá tiền |
| `isAvailable` | BOOLEAN | Còn phục vụ không? Map cột `is_available` |
| `createdAt` | TIMESTAMP | |

### Service: `MenuItemService`

- `create(dto)` — Tạo món mới: kiểm tra Menu tồn tại → ném `NotFoundException`
- `findAll()` — Lấy tất cả món kèm `{ menu: true }` (eager load danh mục)
- `findOne(id)` — Tìm món + danh mục cha
- `update(id, dto)` — Cập nhật; nếu đổi `menuId` thì kiểm tra menu mới tồn tại
- `remove(id)` — Xóa món

### DTOs

- **CreateMenuItemDto**: `{ menuId (UUID), name, price, isAvailable? }`
- **UpdateMenuItemDto**: `{ menuId?, name?, price?, isAvailable? }`

### Endpoints

| Method | Route | Mô tả |
|---|---|---|
| POST | `/menu-items` | Thêm món mới |
| GET | `/menu-items` | Lấy tất cả món (kèm danh mục) |
| GET | `/menu-items/:id` | Chi tiết món |
| PATCH | `/menu-items/:id` | Cập nhật món |
| DELETE | `/menu-items/:id` | Xóa món |

---

## 5. Module Table (Bàn) — `tables/`

### Entity: `Table` → Bảng `tables`

Quản lý bàn trong quán.

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID (PK) | |
| `tableNumber` | VARCHAR(20) | Duy nhất, VD: "B01", "B02" |
| `status` | ENUM('EMPTY','OCCUPIED','RESERVED') | Mặc định `EMPTY` |
| `createdAt` | TIMESTAMP | |

### Service: `TableService`

- `create(dto)` — Tạo bàn mới
- `findAll()` — Tất cả bàn, mới nhất trước
- `findOne(id)` — Tìm bàn
- `update(id, dto)` — Cập nhật số bàn/trạng thái
- `remove(id)` — Xóa

### DTOs

- **CreateTableDto**: `{ tableNumber, status? }`
- **UpdateTableDto**: `{ tableNumber?, status? }`

### Endpoints

| Method | Route | Mô tả |
|---|---|---|
| POST | `/tables` | Thêm bàn |
| GET | `/tables` | Danh sách bàn |
| GET | `/tables/:id` | Chi tiết bàn |
| PATCH | `/tables/:id` | Cập nhật bàn |
| DELETE | `/tables/:id` | Xóa bàn |

---

## 6. Module Order (Đơn hàng) — `orders/`

Module phức tạp nhất — quản lý đơn gọi món tại quán.

### Entity: `Order` → Bảng `orders`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID (PK) | |
| `table` | → Table (FK: `table_id`, nullable) | `null` = mang về |
| `user` | → User (FK: `user_id`) | Nhân viên tạo đơn |
| `status` | ENUM('PENDING','CONFIRMED','PREPARING','COMPLETED','CANCELLED') | |
| `totalAmount` | DECIMAL(10,2) | Tổng tiền, tự tính |
| `items` | → OrderItem[] | 1-N cascade |
| `createdAt` | TIMESTAMP | |
| `updatedAt` | TIMESTAMP | |

### Entity: `OrderItem` → Bảng `order_items`

Chi tiết từng món trong đơn.

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID (PK) | |
| `order` | → Order (FK: `order_id`, CASCADE) | Đơn cha |
| `menuItem` | → MenuItem (FK: `product_id`) | Món được gọi |
| `quantity` | INT | Số lượng (≥ 1) |
| `price` | DECIMAL(10,2) | Giá **tại thời điểm gọi món** (chụp lại) |
| `note` | VARCHAR(255) | Ghi chú: "ít đá", "không đường"... |

### Enum: `OrderStatus`

| Giá trị | Ý nghĩa |
|---|---|
| PENDING | Chờ xác nhận |
| CONFIRMED | Đã xác nhận |
| PREPARING | Đang chế biến |
| COMPLETED | Hoàn thành |
| CANCELLED | Hủy |

### Service: `OrdersService`

Phụ thuộc 5 repository (Order, User, Table, MenuItem, OrderItem).

- `create(dto)` — Tạo đơn mới:
  1. Kiểm tra User tồn tại
  2. Kiểm tra Table (nếu có)
  3. Với mỗi item: kiểm tra MenuItem tồn tại → chụp `price` hiện tại
  4. Tính `totalAmount = Σ (price × quantity)`
  5. Lưu Order + OrderItem (cascade)

- `findAll()` — Tất cả đơn kèm table, user, items, item.menuItem
- `findOne(id)` — Chi tiết đơn
- `update(id, dto)` — Cập nhật trạng thái / đổi bàn. Không tự động tính lại total.
- `addItem(orderId, dto)` — Thêm món vào đơn đã tồn tại (POST `/:id/items`):
  1. Tìm Order
  2. Kiểm tra MenuItem → chụp giá
  3. Tạo OrderItem mới, cập nhật `totalAmount`
- `remove(id)` — Xóa đơn

### DTOs

- **CreateOrderDto**: `{ tableId?, userId, items: [{ menuItemId, quantity, note? }] }`
- **CreateOrderItemDto**: `{ menuItemId, quantity, note? }`
- **UpdateOrderDto**: `{ status?, tableId? }`

### Endpoints

| Method | Route | Mô tả |
|---|---|---|
| POST | `/orders` | Tạo đơn mới (kèm items) |
| GET | `/orders` | Danh sách đơn (kèm chi tiết) |
| GET | `/orders/:id` | Chi tiết đơn |
| PATCH | `/orders/:id` | Cập nhật trạng thái/bàn |
| DELETE | `/orders/:id` | Xóa đơn |
| POST | `/orders/:id/items` | Thêm món vào đơn có sẵn |

---

## 7. Module Employee (Nhân viên) — `employees/`

### Entity: `Employee` → Bảng `employees`

Quản lý hồ sơ nhân viên quán (thông tin hành chính — **khác với User** dùng để đăng nhập).

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID (PK) | |
| `fullName` | VARCHAR(100) | Họ tên |
| `email` | VARCHAR(100) | Duy nhất |
| `phone` | VARCHAR(15) | |
| `position` | VARCHAR(50) | Chức vụ: "Pha chế", "Phục vụ"... |
| `department` | VARCHAR(50) | Bộ phận: "Bếp", "Phục vụ" |
| `salary` | DECIMAL(12,2) | Lương |
| `isActive` | BOOLEAN | Đang làm việc? |
| `createdAt` | TIMESTAMP | |
| `updatedAt` | TIMESTAMP | |

### Service: `EmployeeService`

- `create(dto)` — Thêm nhân viên
- `findAll()` — Danh sách nhân viên
- `findOne(id)` — Chi tiết nhân viên
- `update(id, dto)` — Cập nhật thông tin
- `remove(id)` — Xóa nhân viên

### DTOs

- **CreateEmployeeDto**: `{ fullName, email, phone?, position?, department?, salary?, isActive? }`
- **UpdateEmployeeDto**: `{ fullName?, email?, phone?, position?, department?, salary?, isActive? }`

### Endpoints

| Method | Route | Mô tả |
|---|---|---|
| POST | `/employees` | Thêm nhân viên |
| GET | `/employees` | Danh sách nhân viên |
| GET | `/employees/:id` | Chi tiết nhân viên |
| PATCH | `/employees/:id` | Cập nhật |
| DELETE | `/employees/:id` | Xóa |


---

## 8. Module Payment (Thanh Toán QR) — `payments/`

Tích hợp thanh toán qua mã QR VietQR và xác minh giao dịch qua SePay API.

### Entity: `Payment` → Bảng `payment_requests`

Lưu yêu cầu thanh toán QR cho đơn hàng.

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID (PK) | |
| `order` | → Order (FK: `order_id`, CASCADE) | Đơn hàng cần thanh toán |
| `code` | VARCHAR(12) | Mã xác minh 12 ký tự, duy nhất |
| `amount` | DECIMAL(12,0) | Số tiền (VND), làm tròn từ totalAmount |
| `status` | ENUM('PENDING','COMPLETED','FAILED','EXPIRED') | Trạng thái thanh toán |
| `qrUrl` | TEXT | URL ảnh VietQR đã tạo |
| `sepayTransactionId` | VARCHAR(36) | UUID giao dịch SePay (sau khi xác minh) |
| `createdAt` | TIMESTAMP | |
| `updatedAt` | TIMESTAMP | |

### Enum: `PaymentStatus`

| Giá trị | Ý nghĩa |
|---|---|
| PENDING | Chờ thanh toán |
| COMPLETED | Đã thanh toán (đã xác minh qua SePay) |
| FAILED | Thanh toán thất bại |
| EXPIRED | Hết hạn |

### Service: `PaymentService`

- `create(orderId)` — Tạo QR thanh toán:
  1. Tìm Order → kiểm tra không bị hủy
  2. Sinh mã xác minh 12 ký tự (chữ hoa + số, dùng `crypto.randomBytes`)
  3. Tính `amount = Math.round(order.totalAmount)` (VND)
  4. Tạo URL VietQR công khai:
     ```
     https://vietqr.app/img?acc={account}&bank={bank}
     &amount={amount}&des={code}&template=compact&showinfo=true
     ```
  → Trả về Payment kèm `qrUrl` và `code`

- `findById(id)` — Tra cứu payment (kèm Order)
- `findByOrder(orderId)` — Tất cả payment của một đơn (mới nhất trước)
- `verify(paymentId)` — Xác minh qua SePay:
  1. Gọi `GET /v2/transactions?transaction_content={code}&transfer_type=in&per_page=10`
  2. Auth: `Authorization: Bearer {SEPAY_API_KEY}`
  3. Tìm giao dịch có `amount_in === payment.amount`
  4. Nếu khớp → `status = COMPLETED`, lưu `sepayTransactionId`

### DTOs

- **CreatePaymentDto**: `{ orderId (UUID) }`

### Endpoints

| Method | Route | Auth | Mô tả |
|---|---|---|---|
| POST | `/payments/qr` | public | Tạo QR thanh toán cho đơn hàng |
| GET | `/payments/:id` | public | Chi tiết payment |
| GET | `/payments/order/:orderId` | public | Danh sách payment của đơn |
| POST | `/payments/:id/verify` | public | Xác minh thanh toán (gọi Sepay) |

### Flow thanh toán QR

```
Client                     Server                             Sepay
  │                          │                                  │
  ├─ POST /payments/qr ────→ │ Tìm Order                        │
  │   { orderId }            │ Sinh mã 12 ký tự                  │
  │                          │ Tạo URL VietQR (công khai)        │
  │ ←─ { qrUrl, code,        │ Lưu Payment (PENDING)             │
  │      amount }            │                                  │
  │                          │                                  │
  │ Khách quét QR,           │                                  │
  │ chuyển khoản với nội     │                                  │
  │ dung = mã code           │                                  │
  │                          │                                  │
  ├─ POST /payments/:id/     │                                  │
  │   verify ───────────────→│ GET /v2/transactions ────────────→│
  │                          │   ?transaction_content={code}     │
  │                          │   &transfer_type=in               │
  │                          │ ←─ { transactions: [...] }       │
  │                          │ Khớp code + amount                │
  │ ←─ { status: COMPLETED } │                                  │
```

### Biến môi trường cần thêm

| Biến | Mô tả |
|---|---|
| `SEPAY_ACCOUNT_NUMBER` | Số tài khoản ngân hàng (hiển thị trên QR) |
| `SEPAY_BANK_NAME` | Tên ngân hàng viết tắt (VD: MBBank, ACB, VPB) |
| `SEPAY_API_KEY` | API key SePay để xác minh giao dịch |

## 9. Module Gốc: App (`app.module.ts`)

Module gốc load toàn bộ ứng dụng:

1. **ConfigModule** — Đọc `.env`, global
2. **TypeOrmModule.forRoot** — Kết nối MySQL:
   - `host`, `port`, `username`, `password`, `database` từ biến môi trường
   - `synchronize: true` (dev) — tự đồng bộ entity → bảng
   - `autoLoadEntities: true`
   - SSL với `rejectUnauthorized: false` (Aiven)

### Main Entry (`main.ts`)

Khởi tạo:
- Cookie parser
- Session (express-session, secret từ `SESSION_SECRET`)
- ValidationPipe global (whitelist + transform)
- Lắng nghe cổng `PORT` (mặc định 3000)

---

## Sơ Đồ Quan Hệ Entity

```
Menu (categories)
  │
  │ 1
  │
  ├── N → MenuItem (products)
  │
  └── (không liên quan trực tiếp đến Order)

MenuItem (products) ──N──┐
                         │
OrderItem (order_items)  │ N
  │                      │
  │ N                    │
  │                      │
  └── Order (orders) ────┘
         │
         │ N        1
         ├──→ Table (tables) ─── nullable (mang về)
         │
         │ N        1
         └──→ User (users) ─── nhân viên tạo đơn
Order (orders) ──1──→ Payment (payment_requests) — thanh toán QR

Employee (employees) — độc lập, không FK với bảng nào
```

### Ghi chú ánh xạ entity → bảng

| Entity | `@Entity()` | Bảng SQL | Ghi chú |
|---|---|---|---|
| User | `users` | users | |
| Menu | `categories` | categories | Tên NestJS: menus |
| MenuItem | `products` | products | Tên NestJS: menu-items |
| Table | `tables` | tables | |
| Order | `orders` | orders | |
| OrderItem | `order_items` | order_items | |
| Payment | `payment_requests` | payment_requests | |
| Employee | `employees` | employees | |

---

## Luồng Xử Lý Chính

### Đăng ký + Đăng nhập

```
Client                     Server
  │                          │
  ├─ POST /auth/register ──→ │ Hash password (argon2id)
  │                          │ Tạo User
  │                          │ JWT.sign → access_token
  │                          │ Set cookie + session
  │ ←─ { accessToken, user } │
```

### Tạo đơn gọi món

```
Client                     Server
  │                          │
  ├─ POST /orders ─────────→ │ Kiểm tra user tồn tại
  │   { userId,              │ Kiểm tra bàn (nếu có)
  │     tableId?,            │ Với mỗi item:
  │     items: [             │   • Kiểm tra MenuItem
  │       { menuItemId,      │   • Chụp giá hiện tại
  │         quantity }       │ Tính totalAmount
  │     ]                    │ Lưu Order + OrderItem
  │ ←─ { order với items }   │
```

### Thêm món vào đơn có sẵn

```
Client                     Server
  │                          │
  ├─ POST /orders/:id/items  │ Tìm Order
  │   { menuItemId,          │ Kiểm tra MenuItem
  │     quantity,            │ Chụp giá
  │     note? }              │ Tạo OrderItem
  │                          │ Cập nhật totalAmount
  │ ←─ { order mới }         │
```

---

## Biến Môi Trường

| Biến | Mặc định | Mô tả |
|---|---|---|
| `DB_HOST` | — | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USERNAME` | — | MySQL user |
| `DB_PASSWORD` | — | MySQL password |
| `DB_DATABASE` | — | Tên database |
| `JWT_SECRET` | `default-secret-change-me` | Khóa ký JWT |
| `SESSION_SECRET` | `session-secret-change-me` | Khóa session |
| `SEPAY_ACCOUNT_NUMBER` | — | Số tài khoản ngân hàng (hiển thị trên QR) |
| `SEPAY_BANK_NAME` | — | Tên ngân hàng (VD: MBBank, ACB, VPB) |
| `SEPAY_API_KEY` | — | API key SePay để xác minh giao dịch |
| `PORT` | `3000` | Cổng server |
| `NODE_ENV` | — | `production` = bật secure cookie |

---

## Kỹ Thuật

- **UUID** làm khóa chính cho tất cả entity
- **class-validator** + **ValidationPipe** (whitelist) kiểm tra đầu vào
- **Password** luôn hash với argon2id, không bao giờ lưu plain-text
- **Price** dùng `DECIMAL(10,2)` — kiểu số thập phân chính xác cho tiền tệ
- **OrderItem.price** chụp giá tại thời điểm tạo (không thay đổi khi MenuItem thay đổi sau này)
- **CASCADE** khi xóa Menu → xóa MenuItem; xóa Order → xóa OrderItem
- Không có auth guard trên CRUD endpoints (chỉ `/auth/profile` cần JWT)
