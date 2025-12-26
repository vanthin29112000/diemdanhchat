import { useEffect } from 'react'
import * as XLSX from 'xlsx'
import './ExcelUploader.css'

function ExcelUploader({ onUpload }) {
  useEffect(() => {
    // Tự động đọc file Excel từ thư mục public khi component mount
    const loadExcelFile = async () => {
      try {
        // Đọc file Excel từ thư mục public
        const response = await fetch('/Danh sach.xlsx')
        if (!response.ok) {
          console.error('Không tìm thấy file Excel')
          alert('Không tìm thấy file "Danh sach.xlsx" trong thư mục public')
          return
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const data = new Uint8Array(arrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        // Normalize data (handle both Vietnamese and English column names)
        const normalizedData = jsonData.map((row, index) => ({
          id: row['ID'] || row['id'] || index + 1,
          hoTen: row['Họ và tên'] || row['Họ tên'] || row['hoTen'] || row['Họ và Tên'] || '',
          maThe: row['Mã thẻ'] || row['maThe'] || row['Mã Thẻ'] || '',
          phong: row['Phòng'] || row['phong'] || row['Phòng ban'] || '',
          idCho: row['ID chỗ'] || row['ID Chỗ'] || row['idCho'] || row['id chỗ'] || '',
          image: row['Image'] || row['image'] || row['Ảnh'] || row['ảnh'] || row['ẢNH'] || ''
        }))
        
        onUpload(normalizedData)
        console.log(`Đã tải thành công ${normalizedData.length} người từ file Excel`)
      } catch (error) {
        console.error('Error reading file:', error)
        alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại file "Danh sach.xlsx" trong thư mục public.')
      }
    }

    loadExcelFile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="excel-uploader">
      <span className="excel-status">📄 Đang tải dữ liệu từ "Danh sach.xlsx"</span>
    </div>
  )
}

export default ExcelUploader
