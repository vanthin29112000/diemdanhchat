import { useState, useRef, useEffect } from 'react'
import './CardScanner.css'

function CardScanner({ onScan, scannedCards, onRemove, onClearAll }) {
  const [cardCode, setCardCode] = useState('')
  const [currentPerson, setCurrentPerson] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Auto focus on input
    inputRef.current?.focus()
  }, [])

  const handleScan = (e) => {
    e.preventDefault()
    
    if (!cardCode.trim()) return

    const person = onScan(cardCode.trim())
    
    if (person) {
      setCurrentPerson(person)
      setCardCode('')
      // Auto focus again for next scan
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      alert('Không tìm thấy thông tin với mã thẻ này!')
      setCardCode('')
      inputRef.current?.focus()
    }
  }

  const handleInputChange = (e) => {
    setCardCode(e.target.value)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleScan(e)
    }
  }

  return (
    <div className="card-scanner">
      <div className="scanner-section">
        <h2>Quét Thẻ</h2>
        <form onSubmit={handleScan} className="scan-form">
          <input
            ref={inputRef}
            type="text"
            value={cardCode}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Nhập hoặc quét mã thẻ..."
            className="card-input"
            autoFocus
          />
          <button type="submit" className="scan-button">
            Quét
          </button>
        </form>

        {currentPerson && (
          <div className="current-person-card animate-success">
            <h3>✅ Thông tin vừa quét:</h3>
            <div className="person-info">
              <p><strong>Họ và tên:</strong> {currentPerson.hoTen}</p>
              <p><strong>Phòng:</strong> {currentPerson.phong}</p>
              <p><strong>ID chỗ:</strong> {currentPerson.idCho}</p>
              <p><strong>Mã thẻ:</strong> {currentPerson.maThe}</p>
              {currentPerson.timeString && (
                <p><strong>Thời gian:</strong> {currentPerson.timeString}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="scanned-list-section">
        <div className="scanned-list-header">
          <h2>Danh sách đã quét ({scannedCards.length})</h2>
          {scannedCards.length > 0 && onClearAll && (
            <button 
              className="clear-all-button"
              onClick={onClearAll}
              title="Xóa tất cả"
            >
              🗑️ Xóa tất cả
            </button>
          )}
        </div>
        <div className="scanned-list">
          {scannedCards.length === 0 ? (
            <p className="empty-message">Chưa có người nào được quét thẻ</p>
          ) : (
            scannedCards.map((person, index) => (
              <div key={person.maThe || index} className="scanned-card" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="scanned-card-info">
                  <p className="person-name">{person.hoTen}</p>
                  <p className="person-details">Phòng: {person.phong} | Chỗ: {person.idCho}</p>
                  <p className="person-card-code">Mã thẻ: {person.maThe}</p>
                  {person.timeString && (
                    <p className="person-time">🕒 {person.timeString}</p>
                  )}
                </div>
                <button
                  className="remove-button"
                  onClick={() => onRemove(person.maThe)}
                  title="Xóa"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default CardScanner
