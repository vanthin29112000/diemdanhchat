import { useState } from 'react'
import ExcelUploader from './components/ExcelUploader'
import CardScanner from './components/CardScanner'
import SeatLayout from './components/SeatLayout'
import './App.css'

function App() {
  const [attendanceList, setAttendanceList] = useState([])
  const [scannedCards, setScannedCards] = useState(new Map()) // Map<cardCode, personData>

  const handleExcelUpload = (data) => {
    setAttendanceList(data)
    // Initialize scanned cards map
    setScannedCards(new Map())
  }

  const handleCardScan = (cardCode) => {
    // Find person by card code - try multiple field name variations
    const person = attendanceList.find(p => {
      const maThe = p.maThe || p['Mã thẻ'] || p['Mã Thẻ'] || p['maThe'] || p['Ma The'] || ''
      return String(maThe).trim() === String(cardCode).trim()
    })
    
    if (person) {
      // Normalize person data
      const personData = {
        hoTen: person.hoTen || person['Họ và tên'] || person['Họ tên'] || person['Họ và Tên'] || '',
        phong: person.phong || person['Phòng'] || person['Phòng ban'] || '',
        idCho: person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || person['idCho'] || '',
        maThe: person.maThe || person['Mã thẻ'] || person['Mã Thẻ'] || cardCode,
        id: person.id || person['ID'] || ''
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>App Điểm Danh Sự Kiện</h1>
        <ExcelUploader onUpload={handleExcelUpload} />
      </header>
      
      <div className="app-content">
        <div className="left-panel">
          <CardScanner 
            onScan={handleCardScan}
            scannedCards={Array.from(scannedCards.values())}
            onRemove={handleRemoveScan}
          />
        </div>
        
        <div className="right-panel">
          <SeatLayout 
            attendanceList={attendanceList}
            scannedCards={scannedCards}
          />
        </div>
      </div>
    </div>
  )
}

export default App
