import { useMemo, useState } from 'react'
import './StatisticsPanel.css'

function StatisticsPanel({ attendanceList = [], scannedCards = new Map() }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPhong, setSelectedPhong] = useState(null)

  // Tính toán thống kê theo phòng
  const statisticsByPhong = useMemo(() => {
    const stats = new Map()
    
    if (!attendanceList || !Array.isArray(attendanceList) || attendanceList.length === 0) {
      return []
    }
    
    // Tạo map scanned IDs để tra cứu nhanh
    const scannedIds = new Set()
    try {
      if (scannedCards && scannedCards instanceof Map) {
        scannedCards.forEach((cardData) => {
          try {
            const personId = cardData?.id || ''
            if (personId) {
              scannedIds.add(String(personId).trim())
            }
          } catch (error) {
            // Bỏ qua lỗi
          }
        })
      }
    } catch (error) {
      // Bỏ qua lỗi
    }
    
    // Nhóm theo phòng và tính toán
    attendanceList.forEach((person, index) => {
      try {
        const phong = person?.phong || 
                     person?.['Phòng'] || 
                     person?.['Phòng ban'] || 
                     person?.['Tên đơn vị'] ||
                     person?.['Đơn vị'] ||
                     'Không xác định'
        
        const personId = String(
          person?.id || 
          person?.['ID'] || 
          person?.['id'] ||
          ''
        ).trim()
        
        const isScanned = personId && scannedIds.has(personId)
        
        if (!stats.has(phong)) {
          stats.set(phong, {
            phong,
            total: 0,
            scanned: 0,
            notScanned: [],
            scannedList: []
          })
        }
        
        const stat = stats.get(phong)
        stat.total++
        
        const hoTen = person?.hoTen || 
                     person?.['Họ và tên'] || 
                     person?.['Họ tên'] || 
                     person?.['Họ và Tên'] ||
                     'Không có tên'
        
        const idCho = person?.idCho || 
                     person?.['ID chỗ'] || 
                     person?.['ID Chỗ'] || 
                     person?.['id chỗ'] || 
                     person?.['idCho'] ||
                     ''
        
        if (isScanned) {
          stat.scanned++
          stat.scannedList.push({ hoTen, idCho, id: personId })
        } else {
          stat.notScanned.push({ hoTen, idCho, id: personId })
        }
      } catch (error) {
        // Bỏ qua lỗi
      }
    })
    
    // Thứ tự ưu tiên các phòng ban (theo danh sách)
    const phongOrder = [
      'Giám đốc',
      'Phòng Tổng hợp',
      'Kế hoạch',
      'Phòng CTSV',
      'Dịch vụ',
      'Quản trị',
      'Phòng Hạ tầng',
      'An ninh',
      'Chăm sóc sức khỏe',
      'Chăm sóc sinh viên',
      'Quản lý cụm'
    ]
    
    return Array.from(stats.values()).sort((a, b) => {
      // Tìm index trong danh sách ưu tiên
      const getOrderIndex = (phongName) => {
        const normalized = phongName.toLowerCase().trim()
        for (let i = 0; i < phongOrder.length; i++) {
          if (normalized.includes(phongOrder[i].toLowerCase())) {
            return i
          }
        }
        // Nếu không tìm thấy, đặt ở cuối và sắp xếp alphabetically
        return 999
      }
      
      const orderA = getOrderIndex(a.phong)
      const orderB = getOrderIndex(b.phong)
      
      // Nếu cùng thứ tự ưu tiên, sắp xếp alphabetically
      if (orderA === orderB && orderA !== 999) {
        return a.phong.localeCompare(b.phong, 'vi')
      }
      
      // Sắp xếp theo thứ tự ưu tiên
      if (orderA === 999 && orderB === 999) {
        return a.phong.localeCompare(b.phong, 'vi')
      }
      
      return orderA - orderB
    })
  }, [attendanceList, scannedCards])

  const handlePhongClick = (phong) => {
    if (selectedPhong === phong) {
      setSelectedPhong(null)
    } else {
      setSelectedPhong(phong)
    }
  }

  const selectedPhongData = statisticsByPhong.find(s => s.phong === selectedPhong)

  if (statisticsByPhong.length === 0) {
    return null
  }

  return (
    <>
      {/* Nút mở thống kê */}
      <button 
        className="statistics-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Xem thống kê"
      >
        📊 Thống Kê
      </button>

      {/* Panel thống kê */}
      {isOpen && (
        <div className="statistics-panel-overlay" onClick={() => setIsOpen(false)}>
          <div className="statistics-panel" onClick={(e) => e.stopPropagation()}>
            <div className="statistics-panel-header">
              <h3>Thống Kê Theo Phòng Ban</h3>
              <button 
                className="statistics-close-btn"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="statistics-panel-content">
              <div className="phong-stats-list">
                {statisticsByPhong.map((stat) => {
                  const percentage = stat.total > 0 ? (stat.scanned / stat.total) * 100 : 0
                  const isSelected = selectedPhong === stat.phong
                  
                  return (
                    <div
                      key={stat.phong}
                      className={`phong-stat-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handlePhongClick(stat.phong)}
                    >
                      <div className="phong-stat-header">
                        <span className="phong-name">{stat.phong}</span>
                        <span className="phong-count">
                          {stat.scanned}/{stat.total}
                        </span>
                        <span className="phong-toggle">{isSelected ? '▼' : '▶'}</span>
                      </div>
                      
                      {isSelected && (
                        <div className="phong-detail">
                          {/* Danh sách đã điểm danh */}
                          {stat.scannedList.length > 0 && (
                            <div className="detail-section">
                              <div className="detail-title scanned-title">
                                ✅ Đã điểm danh ({stat.scannedList.length})
                              </div>
                              <div className="detail-list">
                                {stat.scannedList.map((person, idx) => (
                                  <div key={person.id || idx} className="detail-item scanned-item">
                                    <span className="person-name">{person.hoTen}</span>
                                    {person.idCho && <span className="person-seat">{person.idCho}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Danh sách chưa điểm danh */}
                          {stat.notScanned.length > 0 && (
                            <div className="detail-section">
                              <div className="detail-title not-scanned-title">
                                ⏳ Chưa điểm danh ({stat.notScanned.length})
                              </div>
                              <div className="detail-list">
                                {stat.notScanned.map((person, idx) => (
                                  <div key={person.id || idx} className="detail-item not-scanned-item">
                                    <span className="person-name">{person.hoTen}</span>
                                    {person.idCho && <span className="person-seat">{person.idCho}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {stat.scannedList.length === 0 && stat.notScanned.length === 0 && (
                            <div className="detail-section">
                              <div className="detail-title">Không có dữ liệu</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default StatisticsPanel

