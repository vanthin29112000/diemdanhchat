import { useState, useRef, useEffect } from 'react'
import NotificationPopup from './NotificationPopup'
import './CardScanner.css'

function CardScanner({ onScan, scannedCards, onRemove, onClearAll }) {
  const [cardCode, setCardCode] = useState('')
  const [currentPerson, setCurrentPerson] = useState(null)
  const [notification, setNotification] = useState(null)
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
      setNotification({
        message: `Không tìm thấy thông tin với mã thẻ "${cardCode.trim()}". Vui lòng kiểm tra lại mã thẻ hoặc liên hệ ban tổ chức.`,
        type: 'error'
      })
      setCardCode('')
      setTimeout(() => inputRef.current?.focus(), 100)
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
      {notification && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          duration={4000}
        />
      )}
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
            <div className="success-header">
              <div className="success-icon">✓</div>
              <h3>Điểm danh thành công</h3>
            </div>
            <div className="person-avatar">
              {currentPerson.image ? (
                <img 
                  src={currentPerson.image.startsWith('/') || currentPerson.image.startsWith('http') 
                    ? currentPerson.image 
                    : `/images/${currentPerson.image}`}
                  alt={currentPerson.hoTen || 'Avatar'}
                  onError={(e) => {
                    // Nếu ảnh lỗi, hiển thị avatar chữ cái
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div className="avatar-initials" style={{ display: currentPerson.image ? 'none' : 'flex' }}>
                {(() => {
                  if (!currentPerson.hoTen) return '?'
                  const words = currentPerson.hoTen.trim().split(' ').filter(w => w.length > 0)
                  if (words.length >= 2) {
                    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
                  }
                  return words[0][0].toUpperCase()
                })()}
              </div>
            </div>
            <div className="person-info">
              <div className="info-row">
                <span className="info-label">Họ và tên:</span>
                <span className="info-value">{currentPerson.hoTen}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Tên đơn vị:</span>
                <span className="info-value">{currentPerson.phong}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Chỗ ngồi:</span>
                <span className="info-value">{currentPerson.idCho}</span>
              </div>
              {currentPerson.timeString && (
                <div className="info-row">
                  <span className="info-label">Thời gian:</span>
                  <span className="info-value time-value">{currentPerson.timeString}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="scanned-list-section">
        <div className="scanned-list-header">
          <h2>Danh sách đã quét ({scannedCards.length})</h2>
        </div>
        <div className="scanned-list">
          {scannedCards.length === 0 ? (
            <p className="empty-message">Chưa có người nào được quét thẻ</p>
          ) : (
            scannedCards.map((person, index) => (
              <div key={person.maThe || index} className="scanned-card" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="scanned-card-info">
                  <p className="person-name">{person.hoTen}</p>
                  <p className="person-details">Tên đơn vị: {person.phong} | Chỗ: {person.idCho}</p>
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
