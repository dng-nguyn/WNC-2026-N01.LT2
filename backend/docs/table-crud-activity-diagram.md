# Activity Diagram cho CRUD Table

```mermaid
flowchart TD
    A[Start] --> B[Nhập thông tin bàn]
    B --> C{Dữ liệu hợp lệ?}
    C -- No --> D[Hiển thị lỗi và yêu cầu nhập lại]
    D --> B
    C -- Yes --> E[POST /tables để tạo]
    E --> F[Service lưu vào DB]
    F --> G[Trả về bàn vừa tạo]

    G --> H[GET /tables để đọc danh sách]
    H --> I[GET /tables/:id để đọc chi tiết]
    I --> J[PATCH /tables/:id để cập nhật]
    J --> K[DELETE /tables/:id để xóa]
    K --> L[End]
```

- Tạo: `POST /tables`
- Đọc danh sách: `GET /tables`
- Đọc chi tiết: `GET /tables/:id`
- Cập nhật: `PATCH /tables/:id`
- Xóa: `DELETE /tables/:id`
