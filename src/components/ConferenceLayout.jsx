import { useMemo } from 'react'
import './ConferenceLayout.css'

function ConferenceLayout({ attendanceList, scannedCards }) {
  // Get the most recently scanned seat ID
  const getLastScannedSeatId = useMemo(() => {
    const scannedArray = Array.from(scannedCards.values())
    if (scannedArray.length === 0) return null
    
    const sorted = scannedArray
      .filter(p => p.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    return sorted.length > 0 ? String(sorted[0].idCho || '').trim() : null
  }, [scannedCards])

  // Create seat map from attendance list
  const seatMap = useMemo(() => {
    const map = new Map()
    
    attendanceList.forEach(person => {
      const idCho = String(person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || person['idCho'] || '').trim()
      if (idCho) {
        map.set(idCho, {
          idCho,
          person,
          isScanned: false
        })
      }
    })

    scannedCards.forEach((personData) => {
      const idCho = String(personData.idCho || '').trim()
      if (idCho && map.has(idCho)) {
        map.get(idCho).isScanned = true
        map.get(idCho).personData = personData
      }
    })

    return map
  }, [attendanceList, scannedCards])

  // Helper function to render a seat
  const renderSeat = (seatId, person = null, isScanned = false, isLatestScanned = false) => {
    // Determine seat class: empty if no person, scanned if scanned, otherwise normal
    let seatClass = 'conference-seat'
    if (!person) {
      seatClass += ' seat-empty' // Không có trong Excel - làm mờ
    } else if (isScanned) {
      seatClass += ' seat-scanned'
      if (isLatestScanned) {
        seatClass += ' latest-scanned'
      }
    }
    
    return (
      <div
        key={seatId}
        className={seatClass}
        title={
          isScanned && person
            ? `${person.hoTen || person['Họ và tên'] || ''} - Đã điểm danh`
            : person
            ? `${person.hoTen || person['Họ và tên'] || ''} - Chưa điểm danh`
            : `${seatId} - Trống`
        }
      >
        <div className="seat-id">{seatId}</div>
      </div>
    )
  }

  // Render VIP grid (Khách mời or Ban Giám đốc) - 2 hàng, mỗi hàng 4 ghế
  const renderVIPGrid = (prefix, rows = 2, cols = 4, showRowLabels = true) => {
    const rowElements = []
    for (let row = 1; row <= rows; row++) {
      const seats = []
      for (let col = 1; col <= cols; col++) {
        const seatId = `${prefix}${row}${col}`
        const seatData = seatMap.get(seatId)
        const isScanned = seatData?.isScanned || false
        const person = seatData?.person || seatData?.personData || null
        const isLatestScanned = getLastScannedSeatId === seatId
        
        seats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person, isScanned, isLatestScanned)}
          </div>
        )
      }
      rowElements.push(
        <div key={row} className="grid-row">
          {showRowLabels && <div className="row-label">{row}</div>}
          <div className={`grid-seats grid-seats-${cols}`}>{seats}</div>
        </div>
      )
    }
    return (
      <div className="vip-grid">
        {rowElements}
      </div>
    )
  }

  // Render Trưởng các đơn vị (3 hàng, mỗi hàng 8 ghế với lối đi ở giữa)
  const renderTruongDonVi = () => {
    const leftRows = []
    const rightRows = []
    
    for (let row = 1; row <= 3; row++) {
      // Left 4 seats
      const leftSeats = []
      for (let col = 1; col <= 4; col++) {
        const seatId = `TDV${row}${col}`
        const seatData = seatMap.get(seatId)
        const isScanned = seatData?.isScanned || false
        const person = seatData?.person || seatData?.personData || null
        const isLatestScanned = getLastScannedSeatId === seatId
        
        leftSeats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person, isScanned, isLatestScanned)}
          </div>
        )
      }
      
      // Right 4 seats
      const rightSeats = []
      for (let col = 5; col <= 8; col++) {
        const seatId = `TDV${row}${col}`
        const seatData = seatMap.get(seatId)
        const isScanned = seatData?.isScanned || false
        const person = seatData?.person || seatData?.personData || null
        const isLatestScanned = getLastScannedSeatId === seatId
        
        rightSeats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person, isScanned, isLatestScanned)}
          </div>
        )
      }
      
      leftRows.push(
        <div key={row} className="grid-row">
          <div className="row-label">{row}</div>
          <div className="grid-seats grid-seats-4">{leftSeats}</div>
        </div>
      )
      
      rightRows.push(
        <div key={row} className="grid-row">
          <div className="grid-seats grid-seats-4">{rightSeats}</div>
        </div>
      )
    }
    
    return (
      <div className="truong-don-vi-with-walkway">
        <div className="truong-don-vi-left">{leftRows}</div>
        <div className="truong-don-vi-walkway-full">
          <div className="walkway-label">LỐI ĐI</div>
        </div>
        <div className="truong-don-vi-right">{rightRows}</div>
      </div>
    )
  }

  // Render Area A (A1-A6, each row has 8 seats: 4 left, walkway, 4 right)
  const renderAreaA = () => {
    const leftRows = []
    const rightRows = []
    
    for (let row = 1; row <= 6; row++) {
      const rowLabel = `A${row}`
      
      // Left 4 seats
      const leftSeats = []
      for (let col = 1; col <= 4; col++) {
        const seatId = `${rowLabel}${col}`
        const seatData = seatMap.get(seatId)
        const isScanned = seatData?.isScanned || false
        const person = seatData?.person || seatData?.personData || null
        const isLatestScanned = getLastScannedSeatId === seatId
        
        leftSeats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person, isScanned, isLatestScanned)}
          </div>
        )
      }
      
      // Right 4 seats
      const rightSeats = []
      for (let col = 5; col <= 8; col++) {
        const seatId = `${rowLabel}${col}`
        const seatData = seatMap.get(seatId)
        const isScanned = seatData?.isScanned || false
        const person = seatData?.person || seatData?.personData || null
        const isLatestScanned = getLastScannedSeatId === seatId
        
        rightSeats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person, isScanned, isLatestScanned)}
          </div>
        )
      }
      
      leftRows.push(
        <div key={rowLabel} className="grid-row">
          <div className="row-label">{rowLabel}</div>
          <div className="grid-seats grid-seats-4">{leftSeats}</div>
        </div>
      )
      
      rightRows.push(
        <div key={rowLabel} className="grid-row">
          <div className="grid-seats grid-seats-4">{rightSeats}</div>
        </div>
      )
    }
    
    return (
      <div className="area-a-with-walkway">
        <div className="area-a-left">{leftRows}</div>
        <div className="area-a-walkway-full">
          <div className="walkway-label">LỐI ĐI</div>
        </div>
        <div className="area-a-right">{rightRows}</div>
      </div>
    )
  }

  // Render Area B or C (B1-B6 or C1-C6 rows, each row has 8 seats)
  const renderAreaBSection = (rowPrefix = 'B', startRow = 1, numRows = 6) => {
    // Rows
    const rows = []
    for (let rowNum = 1; rowNum <= numRows; rowNum++) {
      const seats = []
      for (let col = 1; col <= 8; col++) {
        // Mã ghế: {rowPrefix}{rowNum}{col}, ví dụ B11, B12, ..., B18, B21, ..., C11, C12, ...
        const seatId = `${rowPrefix}${rowNum}${col}`
        const seatData = seatMap.get(seatId)
        const isScanned = seatData?.isScanned || false
        const person = seatData?.person || seatData?.personData || null
        const isLatestScanned = getLastScannedSeatId === seatId
        
        seats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person, isScanned, isLatestScanned)}
          </div>
        )
      }
      rows.push(
        <div key={`${rowPrefix}${rowNum}`} className="grid-row">
          <div className="row-label">{rowPrefix}{rowNum}</div>
          <div className="grid-seats grid-seats-8">{seats}</div>
        </div>
      )
    }
    
    return { rows }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = attendanceList.length
    const scanned = Array.from(scannedCards.values()).length
    return { total, scanned, remaining: total - scanned }
  }, [attendanceList, scannedCards])

  const areaBTop = renderAreaBSection('B', 1, 6) // B1-B6
  const areaBBottom = renderAreaBSection('C', 1, 6) // C1-C6

  return (
    <div className="conference-layout">
      <div className="conference-layout-header">
        <h2>SƠ ĐỒ CHỖ NGỒI</h2>
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

      <div className="conference-map">
        {/* Two halves layout */}
        <div className="hall-layout">
          {/* Left half - Stage, VIP, Trưởng đơn vị, Area A */}
          <div className="left-half">
            {/* Stage */}
            <div className="stage-area-left">
              <div className="stage-box">SÂN KHẤU</div>
            </div>

            {/* VIP Section - Below stage, side by side with walkway */}
            <div className="vip-section-main">
              {/* Left: Khách mời - 2 hàng, mỗi hàng 4 ghế */}
              <div className="vip-zone vip-zone-left">
                <div className="vip-zone-label">KHÁCH MỜI</div>
                {renderVIPGrid('KM', 2, 4)}
              </div>
              
              {/* Walkway between VIP zones */}
              <div className="vip-walkway"></div>
              
              {/* Right: Ban Giám đốc - 2 hàng, mỗi hàng 4 ghế */}
              <div className="vip-zone vip-zone-right">
                <div className="vip-zone-label">BAN GIÁM ĐỐC</div>
                {renderVIPGrid('BGD', 2, 4, false)}
              </div>
            </div>

            {/* Trưởng các đơn vị - Below VIP, 3 hàng 8 ghế với lối đi ở giữa */}
            <div className="truong-don-vi-section">
              <div className="truong-don-vi-label">LÃNH ĐẠO CÁC ĐƠN VỊ</div>
              {renderTruongDonVi()}
            </div>

            {/* Area A */}
            <div className="area-a-container">
              <div className="area-a-header-with-entrance">
                <div className="area-label ">KHU ĐẠI BIỂU</div>
               
              </div>
              {renderAreaA()}
            </div>
          </div>

          {/* Right half - Area B */}
          <div className="right-half">
            {/* Area B - Top half */}
            <div className="area-b-section area-b-top">
              <div className="area-label">KHU ĐẠI BIỂU</div>
              <div className="area-b-grid">
                {areaBTop.rows}
              </div>
            </div>

            {/* Area C - Bottom half */}
            <div className="area-b-section area-b-bottom">
            <div className="entrance-walkway">
                      <div className="entrance-arrow">←</div>
                      <span className="entrance-label-text">CỬA RA VÀO</span>
                    </div>
              <div className="area-b-grid">
                {areaBBottom.rows}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConferenceLayout
