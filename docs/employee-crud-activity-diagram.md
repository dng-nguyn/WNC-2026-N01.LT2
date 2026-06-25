# Activity Diagram cho CRUD Employee

```mermaid
flowchart TD
    A[Start] --> B[Nhập thông tin nhân viên]
    B --> C{Dữ liệu hợp lệ?}
    C -- No --> D[Hiển thị lỗi và yêu cầu nhập lại]
    D --> B
    C -- Yes --> E[POST /employees để tạo]
    E --> F[Service lưu vào database]
    F --> G[Trả về nhân viên vừa tạo]

    G --> H[GET /employees để đọc danh sách]
    H --> I[GET /employees/:id để đọc chi tiết]
    I --> J[PATCH /employees/:id để cập nhật]
    J --> K[DELETE /employees/:id để xóa]
    K --> L[End]
```

- Tạo: `POST /employees`
- Đọc danh sách: `GET /employees`
- Đọc chi tiết: `GET /employees/:id`
- Cập nhật: `PATCH /employees/:id`
- Xóa: `DELETE /employees/:id`
