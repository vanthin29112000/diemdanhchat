import { useState, useEffect } from 'react'
import ExcelUploader from './components/ExcelUploader'
import CardScanner from './components/CardScanner'
import SeatLayout from './components/SeatLayout'
import ConferenceLayout from './components/ConferenceLayout'
import './App.css'

const STORAGE_KEY = 'scannedCardsData'

function App() {
  const [attendanceList, setAttendanceList] = useState([])
  
  // Load scanned cards from localStorage on mount
  const [scannedCards, setScannedCards] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedArray = JSON.parse(saved)
        return new Map(savedArray)
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
    return new Map()
  })

  // Save to localStorage whenever scannedCards changes
  useEffect(() => {
    try {
      const arrayFromMap = Array.from(scannedCards.entries())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arrayFromMap))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [scannedCards])

  const handleExcelUpload = (data) => {
    setAttendanceList(data)
    // Don't clear scanned cards when uploading - keep existing data
    // If you want to clear, uncomment the next line:
    // setScannedCards(new Map())
  }

  const handleCardScan = (cardCode) => {
    // Find person by card code - try multiple field name variations
    const person = attendanceList.find(p => {
      const maThe = p.maThe || p['Mã thẻ'] || p['Mã Thẻ'] || p['maThe'] || p['Ma The'] || ''
      return String(maThe).trim() === String(cardCode).trim()
    })
    
    if (person) {
      // Normalize person data
      const now = new Date()
      const personData = {
        hoTen: person.hoTen || person['Họ và tên'] || person['Họ tên'] || person['Họ và Tên'] || '',
        phong: person.phong || person['Phòng'] || person['Phòng ban'] || '',
        idCho: person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || person['idCho'] || '',
        maThe: person.maThe || person['Mã thẻ'] || person['Mã Thẻ'] || cardCode,
        id: person.id || person['ID'] || '',
        timestamp: now.toISOString(),
        timeString: now.toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }
      
      // Use cardCode as key to ensure consistency
      const key = String(personData.maThe).trim() || cardCode.trim()
      
      setScannedCards(prev => {
        const newMap = new Map(prev)
        newMap.set(key, personData)
        return newMap
      })
      
      return personData
    }
    
    return null
  }

  const handleRemoveScan = (cardCode) => {
    setScannedCards(prev => {
      const newMap = new Map(prev)
      newMap.delete(cardCode)
      return newMap
    })
  }

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu đã quét?')) {
      setScannedCards(new Map())
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hội Nghị Công Đoàn - Điểm Danh</h1>
        <ExcelUploader onUpload={handleExcelUpload} />
      </header>
      
      <div className="app-content">
        <div className="left-panel">
          <CardScanner 
            onScan={handleCardScan}
            scannedCards={Array.from(scannedCards.values())}
            onRemove={handleRemoveScan}
            onClearAll={handleClearAll}
          />
        </div>
        
        <div className="right-panel">
          <ConferenceLayout 
            attendanceList={attendanceList}
            scannedCards={scannedCards}
          />
        </div>
      </div>
    </div>
  )
}

export default App
