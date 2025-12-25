import { useMemo } from 'react'
import './SeatLayout.css'

function SeatLayout({ attendanceList, scannedCards }) {
  // Group seats by ID chỗ and create seat map
  const seatMap = useMemo(() => {
    const map = new Map()
    
    attendanceList.forEach(person => {
      const idCho = String(person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || person['idCho'] || '').trim()
      if (idCho) {
        map.set(idCho, {
          id: idCho,
          person: person,
          isScanned: false
        })
      }
    })

    // Mark scanned seats - match by ID chỗ
    scannedCards.forEach((personData) => {
      const idCho = String(personData.idCho || '').trim()
      if (idCho && map.has(idCho)) {
        map.get(idCho).isScanned = true
        map.get(idCho).personData = personData
      }
    })

    return map
  }, [attendanceList, scannedCards])

  // Convert map to sorted array for display
  const seats = useMemo(() => {
    return Array.from(seatMap.values()).sort((a, b) => {
      // Try to sort by numeric ID if possible
      const numA = parseInt(a.id) || 0
      const numB = parseInt(b.id) || 0
      if (numA !== 0 || numB !== 0) {
        return numA - numB
      }
      return String(a.id).localeCompare(String(b.id))
    })
  }, [seatMap])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = seats.length
    const scanned = seats.filter(s => s.isScanned).length
    return { total, scanned, remaining: total - scanned }
  }, [seats])

  return (
    <div className="seat-layout">
      <div className="seat-layout-header">
        <h2>Sơ đồ chỗ ngồi</h2>
        <div className="seat-stats">
          <div className="stat-item">
            <span className="stat-label">Tổng:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-item stat-scanned">
            <span className="stat-label">Đã điểm danh:</span>
            <span className="stat-value">{stats.scanned}</span>
          </div>
          <div className="stat-item stat-remaining">
            <span className="stat-label">Chưa điểm danh:</span>
            <span className="stat-value">{stats.remaining}</span>
          </div>
        </div>
      </div>

      <div className="seats-grid">
        {seats.length === 0 ? (
          <div className="empty-seats">
            <p>Chưa có dữ liệu chỗ ngồi. Vui lòng tải lên file Excel.</p>
          </div>
        ) : (
          seats.map((seat, index) => (
            <div
              key={seat.id}
              className={`seat ${seat.isScanned ? 'seat-scanned newly-scanned' : 'seat-empty'}`}
              style={{ animationDelay: `${index * 0.02}s` }}
              title={
                seat.isScanned
                  ? `${seat.personData?.hoTen || seat.person?.hoTen || seat.person?.['Họ và tên'] || ''} - Đã điểm danh`
                  : `Chỗ ${seat.id} - Chưa điểm danh`
              }
            >
              <div className="seat-id">{seat.id}</div>
              {seat.isScanned && (
                <>
                  <div className="scan-indicator-seat">✓</div>
                  <div className="flash-overlay-seat"></div>
                  <div className="seat-info">
                  <div className="seat-name">
                    {seat.personData?.hoTen || seat.person?.hoTen || seat.person?.['Họ và tên'] || ''}
                  </div>
                  <div className="seat-room">
                    {seat.personData?.phong || seat.person?.phong || seat.person?.['Phòng'] || ''}
                  </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SeatLayout
