import { useRef } from 'react'
import * as XLSX from 'xlsx'
import './ExcelUploader.css'

function ExcelUploader({ onUpload }) {
  const fileInputRef = useRef(null)

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    
    if (!file) return

    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
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
          idCho: row['ID chỗ'] || row['ID Chỗ'] || row['idCho'] || row['id chỗ'] || ''
        }))
        
        onUpload(normalizedData)
        alert(`Đã tải lên thành công ${normalizedData.length} người!`)
      } catch (error) {
        console.error('Error reading file:', error)
        alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng file.')
      }
    }
    
    reader.readAsArrayBuffer(file)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="excel-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <button className="upload-button" onClick={handleClick}>
        📄 Tải lên Excel
      </button>
    </div>
  )
}

export default ExcelUploader
