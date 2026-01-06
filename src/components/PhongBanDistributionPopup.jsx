import { useMemo, useState } from 'react'
import './ConferenceLayout.css'
import './PhongBanDistributionPopup.css'

function PhongBanDistributionPopup({ attendanceList = [], scannedCards = new Map() }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPhongBan, setSelectedPhongBan] = useState(null)

  // Tạo map màu cho từng phòng ban
  const phongBanColors = useMemo(() => {
    const colors = [
      '#4CAF50', // Xanh lá
      '#2196F3', // Xanh dương
      '#FF9800', // Cam
      '#9C27B0', // Tím
      '#F44336', // Đỏ
      '#00BCD4', // Cyan
      '#FFC107', // Vàng
      '#795548', // Nâu
      '#607D8B', // Xám xanh
      '#E91E63', // Hồng
      '#3F51B5', // Indigo
      '#009688', // Teal
      '#FF5722', // Deep Orange
      '#673AB7', // Deep Purple
      '#CDDC39', // Lime
    ]
    
    const phongSet = new Set()
    attendanceList.forEach(person => {
      const phong = person?.phong || 
                   person?.['Phòng'] || 
                   person?.['Phòng ban'] || 
                   person?.['Tên đơn vị'] ||
                   person?.['Đơn vị'] ||
                   'Không xác định'
      if (phong) {
        phongSet.add(phong)
      }
    })
    
    const phongArray = Array.from(phongSet)
    const colorMap = new Map()
    
    phongArray.forEach((phong, index) => {
      colorMap.set(phong, colors[index % colors.length])
    })
    
    return colorMap
  }, [attendanceList])

  // Create seat map from attendance list
  const seatMap = useMemo(() => {
    const map = new Map()
    
    attendanceList.forEach(person => {
      const idCho = String(person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || person['idCho'] || '').trim()
      if (idCho) {
        const phong = person?.phong || 
                     person?.['Phòng'] || 
                     person?.['Phòng ban'] || 
                     person?.['Tên đơn vị'] ||
                     person?.['Đơn vị'] ||
                     'Không xác định'
        
        map.set(idCho, {
          idCho,
          person,
          phong,
          color: phongBanColors.get(phong) || '#CCCCCC'
        })
      }
    })

    return map
  }, [attendanceList, phongBanColors])

  // Helper function để làm nhạt màu
  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, (num >> 16) + amt)
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
    const B = Math.min(255, (num & 0x0000FF) + amt)
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }

  // Helper function to render a seat - CHỈ ĐỔI MÀU THEO PHÒNG BAN
  const renderSeat = (seatId, person = null) => {
    const seatData = seatMap.get(seatId)
    const hasPerson = !!seatData || !!person
    const baseColor = seatData?.color || (person ? phongBanColors.get(person?.phong || person?.['Phòng'] || person?.['Phòng ban'] || 'Không xác định') : '#E0E0E0') || '#E0E0E0'
    const phong = seatData?.phong || person?.phong || person?.['Phòng'] || person?.['Phòng ban'] || ''
    
    // Kiểm tra xem ghế này có thuộc phòng ban đang được chọn không
    const isHighlighted = selectedPhongBan && phong === selectedPhongBan
    
    let seatClass = 'conference-seat distribution-seat'
    if (!hasPerson) {
      seatClass += ' seat-empty'
    }
    if (isHighlighted) {
      seatClass += ' highlight-seat'
    }
    
    return (
      <div
        key={seatId}
        className={seatClass}
        style={{
          backgroundColor: hasPerson ? baseColor : '#F5F5F5',
          borderColor: hasPerson ? baseColor : '#E0E0E0',
          opacity: hasPerson ? 1 : 0.5,
          '--base-color': baseColor,
          '--light-color': lightenColor(baseColor, 40)
        }}
        title={
          hasPerson
            ? `${seatId} - ${phong || 'Không xác định'}`
            : `${seatId} - Trống`
        }
      >
        <div className="seat-id">{seatId}</div>
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
        const person = seatData?.person || null
        
        seats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person)}
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
        const person = seatData?.person || null
        
        seats.push(
          <div key={displaySeatId} className="grid-seat-cell">
            {renderSeat(originalSeatId, person)}
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
      const person = seatData?.person || null
      
      row1Seats.push(
        <div key={seatId} className="grid-seat-cell">
          {renderSeat(seatId, person)}
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
        {renderSeat('BGD21', bgd21Data?.person || null)}
      </div>
    )
    // BGD22
    const bgd22Data = seatMap.get('BGD22')
    row2Seats.push(
      <div key="BGD22" className="grid-seat-cell">
        {renderSeat('BGD22', bgd22Data?.person || null)}
      </div>
    )
    // LDDV23, LDDV24
    for (let col = 3; col <= 4; col++) {
      const seatId = `LDDV2${col}`
      const seatData = seatMap.get(seatId)
      const person = seatData?.person || null
      
      row2Seats.push(
        <div key={seatId} className="grid-seat-cell">
          {renderSeat(seatId, person)}
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
        const person = seatData?.person || null
        
        seats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person)}
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
        const person = seatData?.person || null
        
        leftSeats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person)}
          </div>
        )
      }
      
      // Right 4 seats
      const rightSeats = []
      for (let col = 5; col <= 8; col++) {
        const seatId = `A${row}.${col}`
        const seatData = seatMap.get(seatId)
        const person = seatData?.person || null
        
        rightSeats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person)}
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

  // Render Area B hoặc C
  const renderAreaBSection = (rowPrefix = 'B', startRow = 1, numRows = 6) => {
    const rows = []
    for (let rowNum = 1; rowNum <= numRows; rowNum++) {
      const seats = []
      for (let col = 1; col <= 8; col++) {
        const seatId = `${rowPrefix}${col}.${rowNum}`
        const seatData = seatMap.get(seatId)
        const person = seatData?.person || null
        
        seats.push(
          <div key={seatId} className="grid-seat-cell">
            {renderSeat(seatId, person)}
          </div>
        )
      }
      rows.push(
        <div key={`${rowPrefix}${rowNum}`} className="grid-row">
          <div className="grid-seats grid-seats-8">{seats}</div>
        </div>
      )
    }
    
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

  // Tạo danh sách phòng ban với màu để hiển thị legend
  const phongBanList = useMemo(() => {
    const phongSet = new Set()
    attendanceList.forEach(person => {
      const phong = person?.phong || 
                   person?.['Phòng'] || 
                   person?.['Phòng ban'] || 
                   person?.['Tên đơn vị'] ||
                   person?.['Đơn vị'] ||
                   'Không xác định'
      if (phong) {
        phongSet.add(phong)
      }
    })
    
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
    
    return Array.from(phongSet).sort((a, b) => {
      const getOrderIndex = (phongName) => {
        const normalized = phongName.toLowerCase().trim()
        for (let i = 0; i < phongOrder.length; i++) {
          if (normalized.includes(phongOrder[i].toLowerCase())) {
            return i
          }
        }
        return 999
      }
      
      const orderA = getOrderIndex(a)
      const orderB = getOrderIndex(b)
      
      if (orderA === orderB && orderA !== 999) {
        return a.localeCompare(b, 'vi')
      }
      
      if (orderA === 999 && orderB === 999) {
        return a.localeCompare(b, 'vi')
      }
      
      return orderA - orderB
    }).map(phong => ({
      phong,
      color: phongBanColors.get(phong) || '#CCCCCC'
    }))
  }, [attendanceList, phongBanColors])

  const areaBTop = renderAreaBSection('B', 1, 6)

  if (attendanceList.length === 0) {
    return null
  }

  return (
    <>
      <button 
        className="distribution-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Xem phân bổ phòng ban"
      >
        🗺️ Phân Bổ Phòng Ban
      </button>

      {isOpen && (
        <div className="distribution-popup-overlay" onClick={() => setIsOpen(false)}>
          <div className="distribution-popup" onClick={(e) => e.stopPropagation()}>
            <div className="distribution-popup-header">
              <h2>🗺️ Sơ Đồ Phân Bổ Phòng Ban</h2>
              <button 
                className="distribution-close-btn"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="distribution-popup-content">
              {/* Legend */}
              <div className="distribution-legend">
                <h3>Chú thích (click để highlight):</h3>
                <div className="legend-items">
                  {phongBanList.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`legend-item ${selectedPhongBan === item.phong ? 'legend-item-active' : ''}`}
                      onClick={() => {
                        if (selectedPhongBan === item.phong) {
                          setSelectedPhongBan(null) // Click lại để tắt highlight
                        } else {
                          setSelectedPhongBan(item.phong) // Click để highlight
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div 
                        className="legend-color"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="legend-text">{item.phong}</span>
                    </div>
                  ))}
                </div>
                {selectedPhongBan && (
                  <div className="legend-hint">
                    Đang highlight: <strong>{selectedPhongBan}</strong> (click lại để tắt)
                  </div>
                )}
              </div>

              {/* Copy y chang cấu trúc từ ConferenceLayout */}
              <div className="conference-layout">
                <div className="conference-map">
                  <div className="hall-layout">
                    <div className="left-half">
                      <div className="stage-area-left">
                        <div className="stage-box">SÂN KHẤU</div>
                      </div>

                      <div className="vip-section-main">
                        <div className="vip-zone vip-zone-left">
                          <div className="vip-zone-label">KHÁCH MỜI</div>
                          {renderKhachMoi()}
                        </div>
                        
                        <div className="vip-walkway"></div>
                        
                        <div className="vip-zone vip-zone-right">
                          <div className="vip-zone-label">BAN GIÁM ĐỐC VÀ LÃNH ĐẠO ĐƠN VỊ</div>
                          {renderBanGiamDoc()}
                        </div>
                      </div>

                      <div className="area-a-container">
                        <div className="area-a-header-with-entrance">
                          <div className="area-label">KHU ĐẠI BIỂU</div>
                        </div>
                        {renderAreaA()}
                      </div>
                    </div>

                    <div className="right-half">
                      <div className="area-b-section area-b-top">
                        <div className="area-label">KHU ĐẠI BIỂU</div>
                        <div className="area-b-column-labels">
                          {areaBTop.columnLabels}
                        </div>
                        <div className="area-b-grid">
                          {areaBTop.rows}
                        </div>
                      </div>

                      <div className="entrance-walkway">
                        <div className="entrance-arrow">←</div>
                        <span className="entrance-label-text">CỬA RA VÀO</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PhongBanDistributionPopup
