import { useMemo } from 'react'
import './ConferenceLayout.css'

function ConferenceLayout({ attendanceList, scannedCards }) {
  // Define the layout structure based on the image
  const layoutStructure = useMemo(() => {
    return {
      stage: 'Sân khấu',
      leftVip: [
        'Khách mời',
        'Trưởng các đơn vị',
        'Trưởng các đơn vị'
      ],
      rightVip: [
        'Ban Giám đốc',
        'Trưởng các đơn vị',
        'Trưởng các đơn vị'
      ],
      leftDepartments: [
        'TCĐ Phòng Tổng hợp',
        'TCĐ Phòng Kế hoạch tài chính',
        'TCĐ Phòng Dịch vụ - Dự án',
        'TCĐ Phòng Quản trị thiết bị',
        'TCĐ Phòng An ninh trật tự',
        'TCĐ Phòng Hạ tầng',
        'TCĐ Phòng Chăm sóc sức khỏe'
      ],
      rightDepartments: [
        'BCH Công đoàn',
        'TCĐ Phòng CTSV-CĐS',
        'TCĐ BQLCN A.G',
        'TCĐ BQLCN A.H',
        'TCĐ BQLCN B.A',
        'TCĐ BQLCN B.B',
        'TCĐ BQLCN B.C',
        'TCĐ BQLCN B.D',
        'TCĐ BQLCN B.E'
      ],
      entrance: 'Cửa ra vào'
    }
  }, [])


  // Helper function to render a seat/box
  const renderSeat = (person, index) => {
    return (
      <div
        key={person.idCho || index}
        className={`conference-seat ${person.isScanned ? 'seat-scanned' : 'seat-empty'}`}
        title={
          person.isScanned
            ? `${person.hoTen || person['Họ và tên'] || ''} - Đã điểm danh`
            : `${person.hoTen || person['Họ và tên'] || ''} - Chưa điểm danh`
        }
      >
        <div className="seat-id">{person.idCho || ''}</div>
        <div className="seat-name-small">{person.hoTen || person['Họ và tên'] || ''}</div>
        {person.isScanned && <div className="scan-indicator">✓</div>}
      </div>
    )
  }

  // Helper function to render a department section
  const renderDepartment = (deptName, isVertical = false) => {
    // Match people by department name (flexible matching)
    const people = attendanceList.filter(p => {
      const phong = String(p.phong || p['Phòng'] || p['Phòng ban'] || '').trim()
      // Exact match or contains the department name
      return phong === deptName || phong.includes(deptName) || deptName.includes(phong)
    }).map(person => {
      const idCho = String(person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || person['idCho'] || '').trim()
      const isScanned = Array.from(scannedCards.values()).some(sp => {
        const spIdCho = String(sp.idCho || '').trim()
        return spIdCho === idCho
      })
      const personData = isScanned ? Array.from(scannedCards.values()).find(sp => {
        const spIdCho = String(sp.idCho || '').trim()
        return spIdCho === idCho
      }) : null
      
      return {
        ...person,
        idCho,
        isScanned,
        personData
      }
    })

    return (
      <div key={deptName} className={`department-section ${isVertical ? 'vertical' : 'horizontal'}`}>
        <div className="department-header">{deptName}</div>
        <div className="department-seats">
          {people.length > 0 ? (
            people.map((person, idx) => renderSeat(person, idx))
          ) : (
            <div className="empty-dept">Chưa có dữ liệu</div>
          )}
        </div>
      </div>
    )
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = attendanceList.length
    const scanned = Array.from(scannedCards.values()).length
    return { total, scanned, remaining: total - scanned }
  }, [attendanceList, scannedCards])

  return (
    <div className="conference-layout">
      <div className="conference-layout-header">
        <h2>Sơ đồ chỗ ngồi Hội nghị</h2>
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
        {/* Stage */}
        <div className="stage-area">
          <div className="stage-box">{layoutStructure.stage}</div>
        </div>

        {/* VIP Section */}
        <div className="vip-section">
          <div className="vip-left">
            {layoutStructure.leftVip.map((area, idx) => (
              <div key={idx} className="vip-box">{area}</div>
            ))}
          </div>
          <div className="vip-right">
            {layoutStructure.rightVip.map((area, idx) => (
              <div key={idx} className="vip-box">{area}</div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Left Departments */}
          <div className="left-departments">
            {layoutStructure.leftDepartments.map((dept) => renderDepartment(dept, true))}
          </div>

          {/* Right Departments */}
          <div className="right-departments">
            {layoutStructure.rightDepartments.map((dept) => renderDepartment(dept, false))}
          </div>

          {/* Entrance */}
          <div className="entrance-area">
            <div className="entrance-arrow">←</div>
            <div className="entrance-label">{layoutStructure.entrance}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConferenceLayout

