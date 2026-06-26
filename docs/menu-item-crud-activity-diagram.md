# Activity Diagram cho CRUD Menu Item

```mermaid
flowchart TD
    A[Start] --> B[Nhập thông tin món]
    B --> C{Dữ liệu hợp lệ?}
    C -- No --> D[Hiển thị lỗi và yêu cầu nhập lại]
    D --> B
    C -- Yes --> E[POST /menu-items để tạo]
    E --> F[Service lưu vào DB]
    F --> G[Trả về menu item vừa tạo]

    G --> H[GET /menu-items để đọc danh sách]
    H --> I[GET /menu-items/:id để đọc chi tiết]
    I --> J[PATCH /menu-items/:id để cập nhật]
    J --> K[DELETE /menu-items/:id để xóa]
    K --> L[End]
```

- Tạo: `POST /menu-items`
- Đọc danh sách: `GET /menu-items`
- Đọc chi tiết: `GET /menu-items/:id`
- Cập nhật: `PATCH /menu-items/:id`
- Xóa: `DELETE /menu-items/:id`
