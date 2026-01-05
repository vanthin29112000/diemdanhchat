# Hướng dẫn lấy Firebase Client SDK Config

File `chatbot-ktx-firebase-adminsdk-fbsvc-d8650bfdfc.json` là **Admin SDK** (dùng cho server/backend), 
còn ứng dụng web cần **Client SDK config** (khác nhau).

## Các bước lấy Client SDK Config:

### Bước 1: Truy cập Firebase Console
1. Vào: https://console.firebase.google.com/
2. Đăng nhập và chọn project **chatbot-ktx**

### Bước 2: Lấy Web App Config
1. Click vào biểu tượng **⚙️ Settings** (góc trên bên trái) > **Project settings**
2. Cuộn xuống phần **Your apps** hoặc tìm tab **General**
3. Tìm phần **SDK setup and configuration** hoặc **Your apps**

### Bước 3: Tạo Web App (nếu chưa có)
- Nếu chưa có Web app, click vào biểu tượng **`</>`** (Web)
- Đặt tên app (ví dụ: "App Điểm Danh")
- **KHÔNG** chọn Firebase Hosting (nếu được hỏi)
- Click **Register app**

### Bước 4: Copy Config
Sau khi tạo Web app, bạn sẽ thấy đoạn code như sau:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "chatbot-ktx.firebaseapp.com",
  projectId: "chatbot-ktx",
  storageBucket: "chatbot-ktx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### Bước 5: Cập nhật vào file config.js
Copy các giá trị này vào file `src/firebase/config.js`:
- `apiKey` → thay `YOUR_API_KEY`
- `messagingSenderId` → thay `YOUR_MESSAGING_SENDER_ID`  
- `appId` → thay `YOUR_APP_ID`

## Lưu ý:
- **KHÔNG** dùng Admin SDK config cho Client SDK
- File Admin SDK chứa **private key** - chỉ dùng cho server/backend, KHÔNG được expose ra client
- Client SDK config là **public** và an toàn để dùng trong web app

