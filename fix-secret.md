# Hướng dẫn xử lý lỗi GitHub Secret Scanning

## Vấn đề
File `src/firebase/chatbot-ktx-firebase-adminsdk-fbsvc-d8650bfdfc.json` chứa Google Cloud Service Account Credentials đã được commit và GitHub chặn push.

## Giải pháp

### Bước 1: Đảm bảo file đã được thêm vào .gitignore
✅ Đã thêm vào .gitignore

### Bước 2: Xóa file khỏi git tracking (nếu file đang được track)
```bash
git rm --cached src/firebase/chatbot-ktx-firebase-adminsdk-fbsvc-d8650bfdfc.json
```

### Bước 3: Xóa file khỏi commit history

**Cách A: Sử dụng git filter-branch (nếu commit chưa push xa)**
```bash
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch src/firebase/chatbot-ktx-firebase-adminsdk-fbsvc-d8650bfdfc.json" --prune-empty --tag-name-filter cat -- --all
```

**Cách B: Tạo commit mới xóa file (nếu đã push)**
```bash
# Xóa file khỏi git
git rm --cached src/firebase/chatbot-ktx-firebase-adminsdk-fbsvc-d8650bfdfc.json

# Commit xóa file
git commit -m "Remove Firebase service account key (security)"

# Force push (cẩn thận!)
git push origin master --force
```

### Bước 4: Xóa file khỏi remote (nếu cần)
Sau khi xóa khỏi commit history, file vẫn có thể tồn tại trên remote. Cần:
1. Xóa commit chứa file
2. Hoặc sử dụng GitHub Secret Scanning để revoke secret

### Lưu ý quan trọng:
- File service account key chứa thông tin nhạy cảm
- Nên revoke key cũ và tạo key mới sau khi xóa
- Không nên commit file này lên GitHub
- Nên dùng environment variables thay vì file

