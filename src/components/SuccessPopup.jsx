import { useEffect } from 'react'
import './SuccessPopup.css'

function SuccessPopup({ person, onClose, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!person) return null

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?'
    const words = name.trim().split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  return (
    <div className="success-popup-overlay" onClick={onClose}>
      <div 
        className="success-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="success-popup-avatar">
          {getInitials(person.hoTen)}
        </div>
        <div className="success-popup-content">
          <h3 className="success-popup-title">Điểm danh thành công!</h3>
          <p className="success-popup-name">{person.hoTen}</p>
          <div className="success-popup-details">
            <div className="success-detail-item">
              <span className="detail-label">Tên đơn vị:</span>
              <span className="detail-value">{person.phong}</span>
            </div>
            <div className="success-detail-item">
              <span className="detail-label">Chỗ ngồi:</span>
              <span className="detail-value">{person.idCho}</span>
            </div>
            {person.timeString && (
              <div className="success-detail-item">
                <span className="detail-label">Thời gian:</span>
                <span className="detail-value">{person.timeString}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuccessPopup

