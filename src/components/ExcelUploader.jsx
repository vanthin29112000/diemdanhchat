import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import './ExcelUploader.css'

function ExcelUploader({ onUpload }) {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Tự động đọc file Excel từ thư mục public khi component mount
    const loadExcelFile = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Đọc file Excel từ thư mục public
        const response = await fetch('/Danh sach.xlsx')
        
        if (!response.ok) {
          const errorMsg = `Không tìm thấy file "Danh sach.xlsx" (HTTP ${response.status}). Vui lòng đảm bảo file tồn tại trong thư mục public.`
          console.error(errorMsg)
          setError(errorMsg)
          setIsLoading(false)
          return
        }
        
        // Kiểm tra content type
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
          console.warn('Content type không đúng:', contentType)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          const errorMsg = 'File Excel rỗng hoặc không thể đọc được.'
          console.error(errorMsg)
          setError(errorMsg)
          setIsLoading(false)
          return
        }
        
        const data = new Uint8Array(arrayBuffer)
        
        // Đọc workbook với xử lý lỗi
        let workbook
        try {
          workbook = XLSX.read(data, { 
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
          })
        } catch (parseError) {
          const errorMsg = `Lỗi khi parse file Excel: ${parseError.message}. File có thể bị hỏng hoặc không đúng định dạng.`
          console.error(errorMsg, parseError)
          setError(errorMsg)
          setIsLoading(false)
          return
        }
        
        // Kiểm tra workbook có sheets không
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          const errorMsg = 'File Excel không có sheet nào.'
          console.error(errorMsg)
          setError(errorMsg)
          setIsLoading(false)
          return
        }
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        if (!worksheet) {
          const errorMsg = `Không thể đọc sheet "${firstSheetName}".`
          console.error(errorMsg)
          setError(errorMsg)
          setIsLoading(false)
          return
        }
        
        // Convert to JSON với xử lý lỗi
        let jsonData
        try {
          jsonData = XLSX.utils.sheet_to_json(worksheet, {
            defval: '', // Giá trị mặc định cho ô trống
            raw: false // Chuyển đổi tất cả thành string
          })
        } catch (convertError) {
          const errorMsg = `Lỗi khi chuyển đổi dữ liệu Excel: ${convertError.message}.`
          console.error(errorMsg, convertError)
          setError(errorMsg)
          setIsLoading(false)
          return
        }
        
        if (!jsonData || jsonData.length === 0) {
          const errorMsg = 'File Excel không có dữ liệu hoặc sheet trống.'
          console.warn(errorMsg)
          setError(errorMsg)
          setIsLoading(false)
          return
        }
        
        // Normalize data (handle both Vietnamese and English column names) với xử lý lỗi
        const normalizedData = jsonData.map((row, index) => {
          try {
            return {
              id: row['ID'] || row['id'] || String(index + 1),
              hoTen: String(row['Họ và tên'] || row['Họ tên'] || row['hoTen'] || row['Họ và Tên'] || '').trim(),
              maThe: String(row['Mã thẻ'] || row['maThe'] || row['Mã Thẻ'] || '').trim(),
              phong: String(row['Phòng'] || row['phong'] || row['Phòng ban'] || row['Tên đơn vị'] || row['Đơn vị'] || '').trim(),
              idCho: String(row['ID chỗ'] || row['ID Chỗ'] || row['idCho'] || row['id chỗ'] || '').trim(),
              image: String(row['Image'] || row['image'] || row['Ảnh'] || row['ảnh'] || row['ẢNH'] || '').trim()
            }
          } catch (rowError) {
            console.warn(`Lỗi khi xử lý dòng ${index + 1}:`, rowError)
            // Trả về object rỗng nếu có lỗi
            return {
              id: String(index + 1),
              hoTen: '',
              maThe: '',
              phong: '',
              idCho: '',
              image: ''
            }
          }
        }).filter(row => row.hoTen || row.idCho) // Lọc bỏ các dòng trống hoàn toàn
        
        if (normalizedData.length === 0) {
          const errorMsg = 'Không có dữ liệu hợp lệ trong file Excel.'
          console.warn(errorMsg)
          setError(errorMsg)
          setIsLoading(false)
          return
        }
        
        onUpload(normalizedData)
        console.log(`✅ Đã tải thành công ${normalizedData.length} người từ file Excel`)
        setError(null)
      } catch (error) {
        const errorMsg = `Lỗi khi đọc file Excel: ${error.message || error}. Vui lòng kiểm tra lại file "Danh sach.xlsx" trong thư mục public và đảm bảo file không bị hỏng hoặc đang được mở trong Excel.`
        console.error('Error reading file:', error)
        setError(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }

    loadExcelFile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="excel-uploader">
      {isLoading && (
        <span className="excel-status">📄 Đang tải dữ liệu từ "Danh sach.xlsx"...</span>
      )}
      {error && (
        <div className="excel-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button 
            className="retry-button" 
            onClick={() => window.location.reload()}
            title="Thử lại"
          >
            🔄 Thử lại
          </button>
        </div>
      )}
      {!isLoading && !error && (
        <span className="excel-status success">✅ Đã tải dữ liệu thành công</span>
      )}
    </div>
  )
}

export default ExcelUploader
