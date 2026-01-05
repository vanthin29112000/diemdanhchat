# Hướng dẫn cấu hình Firebase

Để ứng dụng có thể truy cập Firestore và kiểm tra collection `face_scans`, bạn cần cấu hình Firebase Client SDK.

## Các bước cấu hình:

1. **Truy cập Firebase Console**: https://console.firebase.google.com/
2. **Chọn project**: chatbot-ktx (hoặc project của bạn)
3. **Lấy thông tin cấu hình**:
   - Vào **Project Settings** (biểu tượng bánh răng)
   - Chọn tab **General**
   - Cuộn xuống phần **Your apps** hoặc **SDK setup and configuration**
   - Chọn **Web app** (biểu tượng `</>`)
   - Nếu chưa có app, click **Add app** và chọn **Web**
   - Copy các thông tin từ Firebase config object

4. **Cập nhật file `src/firebase/config.js`**:
   
   Thay thế các giá trị placeholder bằng thông tin thực tế từ Firebase Console:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",  // Thay YOUR_API_KEY
     authDomain: "chatbot-ktx.firebaseapp.com",  // Đã điền sẵn
     projectId: "chatbot-ktx",  // Đã điền sẵn
     storageBucket: "chatbot-ktx.appspot.com",  // Đã điền sẵn
     messagingSenderId: "123456789",  // Thay YOUR_MESSAGING_SENDER_ID
     appId: "1:123456789:web:abc123"  // Thay YOUR_APP_ID
   }
   ```

5. **Cấu hình Firestore Security Rules**:
   
   Đảm bảo Firestore cho phép đọc và ghi collection `face_scans`. Vào Firestore Database > Rules và thêm:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /face_scans/{document=**} {
         allow read, write: if true;  // Cho phép đọc và ghi (có thể thêm điều kiện bảo mật)
         // Hoặc chỉ cho phép đọc/ghi trong môi trường development:
         // allow read, write: if request.time < timestamp.date(2025, 12, 31);
       }
     }
   }
   ```

   **Lưu ý**: Rule trên cho phép ai cũng đọc/ghi được (chỉ dùng cho development). Trong production, bạn nên thêm điều kiện bảo mật phù hợp (ví dụ: yêu cầu authentication).

## Cách hoạt động:

- Khi quét thẻ, ứng dụng sẽ:
  1. Tìm người trong danh sách Excel (qua mã thẻ)
  2. Lấy ID của người đó (từ cột ID trong Excel)
  3. **Kiểm tra Firestore trước**: Tìm trong Firestore collection `face_scans` xem có document với ID đó không
  4. **Nếu có document** (đã điểm danh từ face ID scan trước đó):
     - Lấy thông tin `firstScan` (hoặc `firstscan`) để hiển thị thời gian điểm danh đầu tiên
     - Cập nhật `lastScan` = thời gian hiện tại (để biết lần quét gần nhất)
     - Giữ nguyên `firstScan` (không thay đổi)
  5. **Nếu chưa có document** (lần đầu quét thẻ):
     - Tạo document mới trong Firestore với:
       - Document ID = ID từ cột ID trong Excel
       - `firstScan` = thời gian hiện tại
       - `lastScan` = thời gian hiện tại
       - Lưu thông tin: hoTen, maThe, idCho, phong, scanMethod = 'card'
  6. Hiển thị thông tin người đã quét với thời gian từ `firstScan`

**Lưu ý quan trọng**:
- Document ID trong Firestore là **ID từ cột ID trong Excel**, không phải mã thẻ
- `firstScan` chỉ được tạo 1 lần (lần đầu điểm danh, dù là face ID hay thẻ)
- `lastScan` được cập nhật mỗi lần quét (face ID hoặc thẻ)
- Nếu đã điểm danh bằng face ID trước đó, khi quét thẻ sẽ hiển thị thời gian từ `firstScan` (thời gian face ID scan), không phải thời gian quét thẻ

## Lưu ý:

- File `chatbot-ktx-firebase-adminsdk-fbsvc-d8650bfdfc.json` là Admin SDK (dùng cho backend), không dùng cho Client SDK
- Client SDK cần các thông tin từ Firebase Console (apiKey, appId, etc.)
- Đảm bảo Firestore đã được bật trong Firebase Console

