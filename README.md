# WNC-2026-N01.LT2
# Bài làm Nguyễn Đình Anh Dũng - 24100331

## Chạy

1. cài deps: `npm install`
2. cài `.env` từ `.env.example`
3. chạy `npm run start:dev`

port mặc định :3000

## CRUD Order

Dự án này đã được thêm một đối tượng `Order` với đầy đủ CRUD bằng NestJS + TypeORM.

### Cấu trúc dữ liệu Order

- `id`: mã đơn hàng tự tăng
- `customerName`: tên khách hàng
- `itemName`: tên món hàng hoặc sản phẩm
- `quantity`: số lượng
- `totalPrice`: tổng tiền
- `status`: trạng thái đơn hàng, gồm `pending`, `confirmed`, `completed`, `cancelled`
- `createdAt`: thời gian tạo
- `updatedAt`: thời gian cập nhật

### API CRUD

- `POST /orders`: tạo đơn hàng mới
- `GET /orders`: lấy danh sách đơn hàng
- `GET /orders/:id`: lấy chi tiết một đơn hàng
- `PATCH /orders/:id`: cập nhật một phần hoặc toàn bộ đơn hàng
- `DELETE /orders/:id`: xóa đơn hàng

### Ví dụ tạo order

```json
{
	"customerName": "Nguyen Van A",
	"itemName": "Ca phe sua da",
	"quantity": 2,
	"totalPrice": "50000",
	"status": "pending"
}
```

### Cách chạy thử

1. Khởi động MySQL và kiểm tra file `.env`
2. Chạy ứng dụng bằng `npm run start:dev`
3. Dùng Postman, Insomnia hoặc cURL để gọi các endpoint bên trên

### Activity Diagram phần orders
<img width="681" height="753" alt="Biểu đồ không có tiêu đề drawio" src="https://github.com/user-attachments/assets/0ff21045-5632-4f57-b35b-a699343371c4" />


### Lưu ý

- Dự án đang bật `synchronize: true` để tự tạo bảng `orders` trong môi trường dev.
- Khi chạy lần đầu, TypeORM sẽ tự tạo bảng nếu database đã tồn tại và cấu hình kết nối đúng.
