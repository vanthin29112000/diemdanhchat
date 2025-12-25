# App Điểm Danh Sự Kiện

Ứng dụng web React để quản lý điểm danh sự kiện với chức năng quét thẻ và hiển thị sơ đồ chỗ ngồi.

## Tính năng

- 📤 **Upload Excel**: Tải lên file Excel chứa danh sách người tham gia với các thông tin: Họ và tên, Mã thẻ, ID, Phòng, ID chỗ
- 🎫 **Quét thẻ**: Nhập mã thẻ để điểm danh và hiển thị thông tin người tham gia
- 🪑 **Sơ đồ chỗ ngồi**: Hiển thị trực quan các chỗ ngồi với trạng thái đã/chưa điểm danh
- 📊 **Thống kê**: Hiển thị số lượng người đã điểm danh và chưa điểm danh

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## Định dạng file Excel

File Excel cần có các cột sau (tên cột có thể là tiếng Việt hoặc không dấu):

- **Họ và tên** (hoặc "Họ tên", "hoTen")
- **Mã thẻ** (hoặc "Mã Thẻ", "maThe")
- **ID** (hoặc "id")
- **Phòng** (hoặc "Phòng ban", "phong")
- **ID chỗ** (hoặc "ID Chỗ", "idCho", "id chỗ")

## Cách sử dụng

1. Click nút "📄 Tải lên Excel" và chọn file Excel chứa danh sách người tham gia
2. Nhập mã thẻ vào ô input và nhấn Enter hoặc click nút "Quét"
3. Xem thông tin người vừa quét ở phần bên trái
4. Xem sơ đồ chỗ ngồi được cập nhật ở phần bên phải
5. Xem thống kê số lượng đã/chưa điểm danh ở đầu sơ đồ

## Công nghệ sử dụng

- React 18
- Vite
- xlsx (để đọc file Excel)
- CSS3 (Flexbox & Grid)

## Build cho production

```bash
npm run build
```

File build sẽ được tạo trong thư mục `dist`.
