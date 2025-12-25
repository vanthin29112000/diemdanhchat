import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const sourceFile = join(process.cwd(), 'Danh sach.xlsx');
const destFile = join(process.cwd(), 'public', 'Danh sach.xlsx');

if (existsSync(sourceFile)) {
  const data = readFileSync(sourceFile);
  writeFileSync(destFile, data);
  console.log('✅ Đã copy file Excel vào thư mục public thành công!');
} else {
  console.log('❌ Không tìm thấy file "Danh sach.xlsx" trong thư mục gốc');
  console.log('Vui lòng đảm bảo file Excel có tên "Danh sach.xlsx" và nằm trong thư mục dự án');
}

