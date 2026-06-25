# Activity Diagram cho CRUD Category

```mermaid
flowchart TD
    A[Start] --> B[Nhập thông tin category]
    B --> C{Có dữ liệu hợp lệ?}
    C -- No --> D[Hiển thị lỗi và yêu cầu nhập lại]
    D --> B
    C -- Yes --> E[POST /categories để tạo]
    E --> F[Service lưu vào DB]
    F --> G[Trả về category vừa tạo]

    G --> H[GET /categories để đọc danh sách]
    H --> I[GET /categories/:id để đọc chi tiết]
    I --> J[PATCH /categories/:id để cập nhật]
    J --> K[DELETE /categories/:id để xóa]
    K --> L[End]
```

- Tạo: `POST /categories`
- Đọc danh sách: `GET /categories`
- Đọc chi tiết: `GET /categories/:id`
- Cập nhật: `PATCH /categories/:id`
- Xóa: `DELETE /categories/:id`
