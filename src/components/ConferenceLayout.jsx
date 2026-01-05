import { useMemo, useState } from 'react'
import './ConferenceLayout.css'

function ConferenceLayout({ attendanceList, scannedCards }) {
  const [showLegend, setShowLegend] = useState(false)
  
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

  // Render VIP grid (Khách mời or Ban Giám đốc) - flexible rows and cols
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

  // Render Khách mời với 5 hàng (KM11-KM14, KM21-KM24, KM31-KM34, KM41-KM44, KM51-KM54)
  const renderKhachMoi = () => {
    const rowElements = []
    
    // Hàng 1-2: KM11-KM14, KM21-KM24
    for (let row = 1; row <= 2; row++) {
      const seats = []
      for (let col = 1; col <= 4; col++) {
        const seatId = `KM${row}${col}`
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
        <div key={`KM${row}`} className="grid-row">
          <div className="row-label">{row}</div>
          <div className="grid-seats grid-seats-4">{seats}</div>
        </div>
      )
    }
    
    // Hàng 3-5: TDV11-TDV14 -> KM31-KM34, TDV21-TDV24 -> KM41-KM44, TDV31-TDV34 -> KM51-KM54
    const tdvToKmMapping = {
      1: { tdvRow: 1, kmRow: 3 }, // TDV11-TDV14 -> KM31-KM34
      2: { tdvRow: 2, kmRow: 4 }, // TDV21-TDV24 -> KM41-KM44
      3: { tdvRow: 3, kmRow: 5 }  // TDV31-TDV34 -> KM51-KM54
    }
    
    for (let mapIndex = 1; mapIndex <= 3; mapIndex++) {
      const mapping = tdvToKmMapping[mapIndex]
      const seats = []
      
      for (let col = 1; col <= 4; col++) {
        // Lấy dữ liệu từ TDV (ID gốc trong seatMap)
        const originalSeatId = `TDV${mapping.tdvRow}${col}`
        // Hiển thị với ID mới là KM
        const displaySeatId = `KM${mapping.kmRow}${col}`
        
        const seatData = seatMap.get(originalSeatId)
        const isScanned = seatData?.isScanned || false
        const person = seatData?.person || seatData?.personData || null
        // Check cả ID gốc và ID mới cho latest scanned
        const isLatestScanned = (getLastScannedSeatId === originalSeatId || getLastScannedSeatId === displaySeatId)
        
        seats.push(
          <div key={displaySeatId} className="grid-seat-cell">
            {renderSeat(displaySeatId, person, isScanned, isLatestScanned)}
          </div>
        )
      }
      
      rowElements.push(
        <div key={`KM${mapping.kmRow}`} className="grid-row">
          <div className="row-label">{mapping.kmRow}</div>
          <div className="grid-seats grid-seats-4">{seats}</div>
        </div>
      )
    }
    
    return (
      <div className="vip-grid">
        {rowElements}
      </div>
    )
  }

  // Render Ban Giám đốc và Lãnh đạo đơn vị
  const renderBanGiamDoc = () => {
    const rowElements = []
    
    // Hàng 1: BGD11, BGD12, BGD13, BGD14 (4 ghế)
    const row1Seats = []
    for (let col = 1; col <= 4; col++) {
      const seatId = `BGD1${col}`
      const seatData = seatMap.get(seatId)
      const isScanned = seatData?.isScanned || false
      const person = seatData?.person || seatData?.personData || null
      const isLatestScanned = getLastScannedSeatId === seatId
      
      row1Seats.push(
        <div key={seatId} className="grid-seat-cell">
          {renderSeat(seatId, person, isScanned, isLatestScanned)}
        </div>
      )
    }
    
    rowElements.push(
      <div key="row1" className="grid-row">
        <div className="row-label">1</div>
        <div className="grid-seats grid-seats-4">{row1Seats}</div>
      </div>
    )
    
    // Hàng 2: BGD21, BGD22, LDDV23, LDDV24 (4 ghế)
    const row2Seats = []
    // BGD21
    const bgd21Data = seatMap.get('BGD21')
    row2Seats.push(
      <div key="BGD21" className="grid-seat-cell">
        {renderSeat('BGD21', bgd21Data?.person || bgd21Data?.personData || null, bgd21Data?.isScanned || false, getLastScannedSeatId === 'BGD21')}
      </div>
    )
    // BGD22
    const bgd22Data = seatMap.get('BGD22')
    row2Seats.push(
      <div key="BGD22" className="grid-seat-cell">
        {renderSeat('BGD22', bgd22Data?.person || bgd22Data?.personData || null, bgd22Data?.isScanned || false, getLastScannedSeatId === 'BGD22')}
      </div>
    )
    // LDDV23, LDDV24
    for (let col = 3; col <= 4; col++) {
      const seatId = `LDDV2${col}`
      const seatData = seatMap.get(seatId)
      const isScanned = seatData?.isScanned || false
      const person = seatData?.person || seatData?.personData || null
      const isLatestScanned = getLastScannedSeatId === seatId
      
      row2Seats.push(
        <div key={seatId} className="grid-seat-cell">
          {renderSeat(seatId, person, isScanned, isLatestScanned)}
        </div>
      )
    }
    
    rowElements.push(
      <div key="row2" className="grid-row">
        <div className="row-label">2</div>
        <div className="grid-seats grid-seats-4">{row2Seats}</div>
      </div>
    )
    
    // Hàng 3-5: LDDV31-LDDV34, LDDV41-LDDV44, LDDV51-LDDV54 (mỗi hàng 4 ghế)
    for (let row = 3; row <= 5; row++) {
      const seats = []
      for (let col = 1; col <= 4; col++) {
        const seatId = `LDDV${row}${col}`
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
        <div key={`row${row}`} className="grid-row">
          <div className="row-label">{row}</div>
          <div className="grid-seats grid-seats-4">{seats}</div>
        </div>
      )
    }
    
    return (
      <div className="vip-grid">
        {rowElements}
      </div>
    )
  }


  // Render Area A (A1-A7, each row has 8 seats: 4 left, walkway, 4 right)
  const renderAreaA = () => {
    const leftRows = []
    const rightRows = []
    
    for (let row = 1; row <= 7; row++) {
      const rowLabel = `A${row}`
      
      // Left 4 seats
      const leftSeats = []
      for (let col = 1; col <= 4; col++) {
        const seatId = `A${row}.${col}`
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
        const seatId = `A${row}.${col}`
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

  // Render Area B hoặc C - Chuyển từ hàng ngang sang cột dọc
  // Cột B1: B1.1, B1.2, B1.3, B1.4, B1.5, B1.6 (theo chiều dọc)
  // Cột B2: B2.1, B2.2, B2.3, B2.4, B2.5, B2.6 (theo chiều dọc)
  const renderAreaBSection = (rowPrefix = 'B', startRow = 1, numRows = 6) => {
    const rows = []
    // Tạo 6 hàng (mỗi hàng có 8 ghế từ 8 cột khác nhau)
    for (let rowNum = 1; rowNum <= numRows; rowNum++) {
      const seats = []
      // Mỗi hàng có 8 ghế từ 8 cột
      for (let col = 1; col <= 8; col++) {
        // ID gốc: B1.1, B1.2, B2.1, B2.2, ...
        // Nhưng hiển thị theo cột: cột B1 có B1.1, B1.2, B1.3, ... (theo chiều dọc)
        // Vậy cần map: hàng rowNum, cột col -> ghế B{col}.{rowNum}
        const seatId = `${rowPrefix}${col}.${rowNum}`
        
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
      // Xóa row-label (B1, B2, ..., B6)
      rows.push(
        <div key={`${rowPrefix}${rowNum}`} className="grid-row">
          <div className="grid-seats grid-seats-8">{seats}</div>
        </div>
      )
    }
    
    // Thêm column labels B1-B8 hoặc C1-C8 ở trên
    const columnLabels = []
    for (let col = 1; col <= 8; col++) {
      columnLabels.push(
        <div key={`label-${col}`} className="column-label">
          {rowPrefix}{col}
        </div>
      )
    }
    
    return { rows, columnLabels }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = attendanceList.length
    const scanned = Array.from(scannedCards.values()).length
    return { total, scanned, remaining: total - scanned }
  }, [attendanceList, scannedCards])

  const areaBTop = renderAreaBSection('B', 1, 6) // B1-B6 chuyển thành B1-B8 (hàng ngang)
  const areaBBottom = renderAreaBSection('C', 1, 6) // C1-C6 chuyển thành C1-C8 (hàng ngang)

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
              {/* Left: Khách mời - 5 hàng (2 hàng KM + 3 hàng TDV) */}
              <div className="vip-zone vip-zone-left">
                <div className="vip-zone-label">KHÁCH MỜI</div>
                {renderKhachMoi()}
              </div>
              
              {/* Walkway between VIP zones */}
              <div className="vip-walkway"></div>
              
              {/* Right: Ban Giám đốc và Lãnh đạo đơn vị */}
              <div className="vip-zone vip-zone-right">
                <div className="vip-zone-label">BAN GIÁM ĐỐC VÀ LÃNH ĐẠO ĐƠN VỊ</div>
                {renderBanGiamDoc()}
              </div>
            </div>

            {/* Area A */}
            <div className="area-a-container">
              <div className="area-a-header-with-entrance">
                <div className="area-label ">KHU ĐẠI BIỂU</div>
               
              </div>
              {renderAreaA()}
            </div>
          </div>

          {/* Right half - Area B và C */}
          <div className="right-half">
            {/* Area B - Giữ nguyên layout, chỉ đổi tên ghế */}
            <div className="area-b-section area-b-top">
              <div className="area-label">KHU ĐẠI BIỂU</div>
              {/* Column labels B1-B8 ngay dưới chữ KHU ĐẠI BIỂU */}
              <div className="area-b-column-labels">
                {areaBTop.columnLabels}
              </div>
              <div className="area-b-grid">
                {areaBTop.rows}
              </div>
            </div>

            {/* Lối vào */}
            <div className="entrance-walkway">
              <div className="entrance-arrow">←</div>
              <span className="entrance-label-text">CỬA RA VÀO</span>
            </div>

            {/* Area C - Giữ nguyên layout, chỉ đổi tên ghế */}
            <div className="area-b-section area-b-bottom">
              {/* Column labels C1-C8 */}
              <div className="area-b-column-labels">
                {areaBBottom.columnLabels}
              </div>
              <div className="area-b-grid">
                {areaBBottom.rows}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Icon info button ở góc trái dưới */}
      <button 
        className="legend-info-button"
        onClick={() => setShowLegend(!showLegend)}
        title="Xem ghi chú trạng thái"
      >
        ℹ️
      </button>

      {/* Modal hiển thị legend */}
      {showLegend && (
        <div className="legend-modal-overlay" onClick={() => setShowLegend(false)}>
          <div className="legend-modal" onClick={(e) => e.stopPropagation()}>
            <div className="legend-modal-header">
              <h3>Ghi chú trạng thái ghế</h3>
              <button 
                className="legend-modal-close"
                onClick={() => setShowLegend(false)}
              >
                ×
              </button>
            </div>
            <div className="legend-modal-content">
              <div className="legend-item">
                <div className="legend-seat seat-empty-sample">
                  <div className="legend-seat-id">A1</div>
                </div>
                <span className="legend-text">Chưa được sắp xếp</span>
              </div>
              <div className="legend-item">
                <div className="legend-seat conference-seat">
                  <div className="legend-seat-id">A2</div>
                </div>
                <span className="legend-text">Chưa điểm danh</span>
              </div>
              <div className="legend-item">
                <div className="legend-seat seat-scanned-sample">
                  <div className="legend-seat-id">A3</div>
                </div>
                <span className="legend-text">Đã điểm danh</span>
              </div>
              <div className="legend-item">
                <div className="legend-seat latest-scanned-sample">
                  <div className="legend-seat-id">A4</div>
                </div>
                <span className="legend-text">Vừa điểm danh (mới nhất)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConferenceLayout

