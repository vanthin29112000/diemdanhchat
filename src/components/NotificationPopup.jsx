import { useEffect } from 'react'
import './NotificationPopup.css'

function NotificationPopup({ message, type = 'error', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!message) return null

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div 
        className={`notification-popup notification-${type}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-icon">
          {type === 'error' && '❌'}
          {type === 'success' && '✅'}
          {type === 'warning' && '⚠️'}
          {type === 'info' && 'ℹ️'}
        </div>
        <div className="notification-content">
          <h3 className="notification-title">
            {type === 'error' && 'Lỗi'}
            {type === 'success' && 'Thành công'}
            {type === 'warning' && 'Cảnh báo'}
            {type === 'info' && 'Thông tin'}
          </h3>
          <p className="notification-message">{message}</p>
        </div>
        <button className="notification-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  )
}

export default NotificationPopup

