import pandas as pd
import os
from pathlib import Path

# Đường dẫn file Excel
excel_file = "Danh sach tham du hoi nghi.xlsx"
images_folder = "images"

# Đọc file Excel
print(f"Đang đọc file Excel: {excel_file}")
df = pd.read_excel(excel_file)

# Kiểm tra các cột cần thiết
print("\nCác cột có trong file Excel:")
print(df.columns.tolist())

# Tìm cột 'image'
if 'image' not in df.columns:
    image_cols = [col for col in df.columns if 'image' in str(col).lower()]
    if image_cols:
        image_column = image_cols[0]
        print(f"\nTìm thấy cột image: {image_column}")
    else:
        print("\nKhông tìm thấy cột 'image'. Vui lòng kiểm tra lại file Excel.")
        exit(1)
else:
    image_column = 'image'

# Tìm cột 'id'
if 'id' not in df.columns:
    id_cols = [col for col in df.columns if 'id' in str(col).lower()]
    if id_cols:
        id_column = id_cols[0]
        print(f"Tìm thấy cột id: {id_column}")
    else:
        print("\nKhông tìm thấy cột 'id'. Vui lòng kiểm tra lại file Excel.")
        exit(1)
else:
    id_column = 'id'

print(f"\nĐang sử dụng:")
print(f"  - Cột image: {image_column}")
print(f"  - Cột id: {id_column}")

# Đếm số hình đã đổi tên và không tìm thấy
renamed_count = 0
not_found_count = 0
skipped_count = 0
not_found_list = []
skipped_list = []

# Duyệt qua từng dòng trong Excel
for index, row in df.iterrows():
    # Lấy tên hình ảnh và id
    image_name = str(row[image_column]).strip() if pd.notna(row[image_column]) else ""
    image_id = str(row[id_column]).strip() if pd.notna(row[id_column]) else ""
    
    # Bỏ qua nếu thiếu thông tin
    if not image_name or image_name == 'nan':
        skipped_count += 1
        continue
    
    if not image_id or image_id == 'nan':
        skipped_list.append(f"Dòng {index + 2}: thiếu ID cho '{image_name}'")
        skipped_count += 1
        continue
    
    # Tìm file với các extension có thể có
    source_path = None
    possible_extensions = ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    
    # Thử tìm file với extension
    for ext in possible_extensions:
        test_path = os.path.join(images_folder, image_name + ext)
        if os.path.exists(test_path):
            source_path = test_path
            break
    
    # Nếu không tìm thấy với extension, thử tìm chính xác tên file
    if source_path is None:
        test_path = os.path.join(images_folder, image_name)
        if os.path.exists(test_path):
            source_path = test_path
    
    # Đổi tên file nếu tìm thấy
    if source_path:
        # Tên file mới: id + ".jpeg"
        new_filename = f"{image_id}.jpeg"
        new_path = os.path.join(images_folder, new_filename)
        
        # Kiểm tra nếu file đích đã tồn tại
        if os.path.exists(new_path) and source_path != new_path:
            print(f"⚠ Cảnh báo: File {new_filename} đã tồn tại. Bỏ qua: {os.path.basename(source_path)}")
            skipped_count += 1
            continue
        
        # Đổi tên file
        try:
            os.rename(source_path, new_path)
            renamed_count += 1
            print(f"✓ Đã đổi tên: {os.path.basename(source_path)} → {new_filename}")
        except Exception as e:
            print(f"✗ Lỗi khi đổi tên {os.path.basename(source_path)}: {e}")
            skipped_count += 1
    else:
        not_found_count += 1
        not_found_list.append(f"Dòng {index + 2}: {image_name}")
        print(f"✗ Không tìm thấy: {image_name}")

# In kết quả
print(f"\n{'='*50}")
print(f"Hoàn thành!")
print(f"Đã đổi tên: {renamed_count} hình ảnh")
print(f"Không tìm thấy: {not_found_count} hình ảnh")
print(f"Bỏ qua: {skipped_count} hình ảnh")

if not_found_list:
    print(f"\nDanh sách hình ảnh không tìm thấy:")
    for item in not_found_list[:10]:  # Hiển thị 10 đầu tiên
        print(f"  - {item}")
    if len(not_found_list) > 10:
        print(f"  ... và {len(not_found_list) - 10} hình khác")

if skipped_list:
    print(f"\nDanh sách hình ảnh bị bỏ qua:")
    for item in skipped_list[:10]:  # Hiển thị 10 đầu tiên
        print(f"  - {item}")
    if len(skipped_list) > 10:
        print(f"  ... và {len(skipped_list) - 10} hình khác")

print(f"\nCác hình ảnh đã được đổi tên trong thư mục: {images_folder}")

