# Hướng dẫn cấu hình Firestore Security Rules

## Lỗi hiện tại:
```
FirebaseError: Missing or insufficient permissions
```

## Giải pháp: Cấu hình Firestore Security Rules

### Bước 1: Truy cập Firestore Console
1. Vào Firebase Console: https://console.firebase.google.com/
2. Chọn project: **chatbot-ktx**
3. Trong menu bên trái, click vào **Firestore Database**
4. Chọn tab **Rules** (ở trên cùng)

### Bước 2: Cập nhật Rules

Thay thế nội dung hiện tại bằng rules sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc và ghi vào collection face_scans
    match /face_scans/{document=**} {
      allow read, write: if true;
    }
    
    // Hoặc nếu muốn bảo mật hơn, chỉ cho phép trong giờ làm việc (ví dụ):
    // match /face_scans/{document=**} {
    //   allow read: if true;
    //   allow write: if request.time < timestamp.date(2025, 12, 31);
    // }
  }
}
```

### Bước 3: Publish Rules
1. Click nút **Publish** (màu xanh) ở trên cùng
2. Đợi vài giây để rules được áp dụng

### Giải thích:
- `rules_version = '2'`: Sử dụng version 2 của rules syntax
- `match /face_scans/{document=**}`: Áp dụng cho tất cả documents trong collection `face_scans`
- `allow read, write: if true;`: Cho phép đọc và ghi không giới hạn (chỉ dùng cho development/testing)

### ⚠️ Lưu ý bảo mật:
- Rule `if true` cho phép bất kỳ ai cũng đọc/ghi được
- Chỉ dùng cho **development/testing** hoặc môi trường nội bộ
- Cho production, nên thêm authentication hoặc điều kiện bảo mật khác

### Ví dụ Rules bảo mật hơn (cho production):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /face_scans/{document=**} {
      // Cho phép đọc cho tất cả
      allow read: if true;
      
      // Chỉ cho phép ghi nếu đã đăng nhập (nếu có authentication)
      // allow write: if request.auth != null;
      
      // Hoặc chỉ cho phép ghi trong một khoảng thời gian nhất định
      allow write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

### Kiểm tra:
Sau khi publish rules, thử quét thẻ lại. Nếu vẫn lỗi:
1. Đợi 1-2 phút để rules được áp dụng hoàn toàn
2. Kiểm tra lại rules có đúng syntax không (có thể test bằng nút "Rules playground")
3. Kiểm tra console để xem có lỗi gì khác không

