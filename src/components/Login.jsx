import { useState, useRef, useEffect } from 'react'
import './Login.css'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const usernameRef = useRef(null)

  useEffect(() => {
    usernameRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu')
      return
    }

    setIsLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      if (username.trim() === ADMIN_USERNAME && password.trim() === ADMIN_PASSWORD) {
        setIsLoading(false)
        onLogin()
      } else {
        setIsLoading(false)
        setError('Tên đăng nhập hoặc mật khẩu không đúng!')
        setPassword('')
        usernameRef.current?.focus()
      }
    }, 300)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🏛️</div>
          <h1>Đăng Nhập</h1>
          <p className="login-subtitle">Hệ thống Điểm Danh Hội Nghị Công Đoàn</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <span className="label-icon">👤</span>
              Tên đăng nhập
            </label>
            <input
              ref={usernameRef}
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tên đăng nhập"
              className="login-input"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span className="label-icon">🔒</span>
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập mật khẩu"
              className="login-input"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Đang đăng nhập...
              </>
            ) : (
              <>
                <span>🔑</span>
                Đăng Nhập
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

