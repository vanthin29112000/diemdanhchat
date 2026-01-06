import { useState, useEffect, useRef } from 'react'
import Login from './components/Login'
import ExcelUploader from './components/ExcelUploader'
import CardScanner from './components/CardScanner'
import SeatLayout from './components/SeatLayout'
import ConferenceLayout from './components/ConferenceLayout'
import StatisticsPanel from './components/StatisticsPanel'
import PhongBanDistributionPopup from './components/PhongBanDistributionPopup'
import { checkFaceScanAttendance, saveFaceScanToFirestore, loadAllFaceScansFromFirestore, subscribeToFaceScans, deleteFaceScanFromFirestore, markNotificationAsShown } from './firebase/faceScans'
import './App.css'

const AUTH_KEY = 'isAuthenticated'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is already authenticated
    try {
      const saved = localStorage.getItem(AUTH_KEY)
      return saved === 'true'
    } catch (error) {
      return false
    }
  })
  
  const [attendanceList, setAttendanceList] = useState([])
  const [scannedCards, setScannedCards] = useState(new Map())
  const [isLoadingScans, setIsLoadingScans] = useState(false)
  const [newScanFromFirestore, setNewScanFromFirestore] = useState(null) // Lưu thông tin scan mới từ Firestore
  const prevScannedCardsRef = useRef(new Map()) // Track previous state để detect changes
  const isUserScanningRef = useRef(false) // Track xem user có đang scan không
  const isInitialLoadCompleteRef = useRef(false) // Track xem đã load dữ liệu ban đầu chưa

  // Load scanned cards from Firestore when attendanceList changes
  useEffect(() => {
    if (attendanceList.length > 0) {
      isInitialLoadCompleteRef.current = false
      const loadData = async () => {
        setIsLoadingScans(true)
        try {
          const firestoreData = await loadAllFaceScansFromFirestore(attendanceList)
          console.log('📥 Đã load', firestoreData.size, 'bản ghi từ Firestore lần đầu')
          setScannedCards(firestoreData)
          // Cập nhật prevScannedCardsRef ngay sau khi load xong để subscription có thể so sánh
          prevScannedCardsRef.current = new Map(firestoreData)
          // Đánh dấu đã load xong
          isInitialLoadCompleteRef.current = true
        } catch (error) {
          console.error('Error loading from Firestore:', error)
          isInitialLoadCompleteRef.current = true // Vẫn đánh dấu để subscription có thể chạy
        } finally {
          setIsLoadingScans(false)
        }
      }
      
      loadData()
    }
  }, [attendanceList])

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    if (attendanceList.length > 0) {
      console.log('🔄 Đang subscribe real-time updates từ Firestore...')
      const unsubscribe = subscribeToFaceScans(attendanceList, (scannedCardsMap) => {
        console.log('📡 Nhận được cập nhật từ Firestore:', scannedCardsMap.size, 'bản ghi')
        
        // So sánh với state trước để phát hiện document mới
        const prevMap = prevScannedCardsRef.current
        const isInitialLoad = !isInitialLoadCompleteRef.current
        console.log('🔍 So sánh với prevMap:', prevMap.size, 'bản ghi')
        console.log('🔍 isInitialLoad:', isInitialLoad)
        console.log('🔍 isUserScanningRef.current:', isUserScanningRef.current)
        
        // Kiểm tra các document có isShowNotify === false để hiển thị notification
        if (isInitialLoadCompleteRef.current) {
          scannedCardsMap.forEach((cardData, maThe) => {
            // Chỉ hiển thị notification nếu isShowNotify === false
            if (cardData.isShowNotify === false) {
              console.log('🔔 Phát hiện document cần hiển thị notification:', cardData.hoTen, 'Mã thẻ:', maThe)
              
              // Hiển thị notification
              setNewScanFromFirestore(cardData)
              
              // Cập nhật isShowNotify = true trong Firestore
              markNotificationAsShown(cardData.id).catch(err => {
                console.error('❌ Lỗi khi cập nhật isShowNotify:', err)
              })
              
              // Tự động ẩn sau 5 giây
              setTimeout(() => {
                setNewScanFromFirestore(null)
              }, 5000)
            }
          })
        } else {
          // Nếu chưa load xong, đây là snapshot ban đầu từ subscription
          // Không hiển thị notification vì đây là dữ liệu đã có sẵn
          console.log('📥 Đây là snapshot ban đầu, chờ load dữ liệu xong trước')
        }
        
        // Reset flag sau khi xử lý (delay một chút để subscription có thời gian xử lý)
        if (isUserScanningRef.current) {
          setTimeout(() => {
            console.log('🔄 Reset isUserScanningRef flag')
            isUserScanningRef.current = false
          }, 2000)
        }
        
        // Chỉ cập nhật prevScannedCardsRef nếu đã load dữ liệu ban đầu xong
        // (để tránh ghi đè dữ liệu từ loadAllFaceScansFromFirestore)
        if (isInitialLoadCompleteRef.current) {
          prevScannedCardsRef.current = new Map(scannedCardsMap)
        }
        
        // Luôn cập nhật state để UI hiển thị đúng
        setScannedCards(scannedCardsMap)
      })
      
      return () => {
        console.log('🔌 Hủy subscribe Firestore')
        unsubscribe()
      }
    }
  }, [attendanceList])
  

  const handleExcelUpload = (data) => {
    setAttendanceList(data)
    // Dữ liệu sẽ được load từ Firestore tự động khi attendanceList thay đổi
  }

  const handleCardScan = async (cardCode) => {
    // Đánh dấu user đang scan để tránh hiển thị notification từ real-time subscription
    isUserScanningRef.current = true
    
    // Find person by card code - try multiple field name variations
    const person = attendanceList.find(p => {
      const maThe = p.maThe || p['Mã thẻ'] || p['Mã Thẻ'] || p['maThe'] || p['Ma The'] || ''
      return String(maThe).trim() === String(cardCode).trim()
    })
    
    if (person) {
      // Use cardCode as key to ensure consistency
      const maTheValue = person.maThe || person['Mã thẻ'] || person['Mã Thẻ'] || cardCode
      const key = String(maTheValue).trim() || cardCode.trim()
      
      // Kiểm tra xem đã điểm danh chưa trong Firestore (qua cột ID)
      const personId = person.id || person['ID'] || ''
      
      if (!personId) {
        console.warn(`⚠️ Không có ID để lưu lên Firestore. Vui lòng kiểm tra cột ID trong file Excel.`)
        isUserScanningRef.current = false
        return null
      }

      // Kiểm tra Firestore để xem đã điểm danh chưa
      let hasScannedInFirestore = false
      let scanTime = new Date()
      
      try {
        const faceScanResult = await checkFaceScanAttendance(personId)
        if (faceScanResult.hasScanned && faceScanResult.firstScan) {
          // Đã điểm danh trong Firestore (có thể từ face ID scan), sử dụng firstScan timestamp
          scanTime = faceScanResult.firstScan
          hasScannedInFirestore = true
          
          // Đã có trong Firestore, chỉ cập nhật lastScan
          // User tự scan nên đánh dấu đã hiển thị notification
          console.log(`🔄 Đang cập nhật lastScan trên Firestore cho ID: ${personId}`)
          await saveFaceScanToFirestore(personId, new Date(), {
            scanMethod: 'card',
            isShowNotify: true // User tự scan nên đã thấy notification rồi
          }, true) // isUpdateOnly = true
          
          // Return data từ Firestore (sẽ được cập nhật qua real-time subscription)
          const personData = {
            hoTen: faceScanResult.data.hoTen || person.hoTen || person['Họ và tên'] || person['Họ tên'] || person['Họ và Tên'] || '',
            phong: faceScanResult.data.phong || person.phong || person['Phòng'] || person['Phòng ban'] || '',
            idCho: faceScanResult.data.idCho || person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || person['idCho'] || '',
            maThe: maTheValue,
            id: personId,
            image: person.image || person['Image'] || person['Ảnh'] || person['ảnh'] || '',
            timestamp: scanTime.toISOString(),
            timeString: scanTime.toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            fromFirestore: true
          }
          
          return personData
        }
      } catch (error) {
        console.error('Error checking Firestore:', error)
      }
      
      // Chưa có trong Firestore, đây là lần đầu quét thẻ - lưu lên Firestore
      // Khi user tự scan, set isShowNotify = true vì user đã thấy notification rồi
      console.log(`📤 Đang lưu thông tin điểm danh lên Firestore cho ID: ${personId}`)
      const saveResult = await saveFaceScanToFirestore(personId, scanTime, {
        hoTen: person.hoTen || person['Họ và tên'] || person['Họ tên'] || person['Họ và Tên'] || '',
        maThe: maTheValue,
        idCho: person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || person['idCho'] || '',
        phong: person.phong || person['Phòng'] || person['Phòng ban'] || '',
        image: person.image || person['Image'] || person['Ảnh'] || person['ảnh'] || '',
        scanMethod: 'card',
        isShowNotify: true // User tự scan nên đã thấy notification rồi
      })
      
      if (!saveResult) {
        console.warn(`⚠️ Không thể lưu lên Firestore cho ID: ${personId}`)
        isUserScanningRef.current = false
        return null
      }
      
      // Dữ liệu sẽ được cập nhật tự động qua real-time subscription
      // Tạm thời return data để hiển thị
      const personData = {
        hoTen: person.hoTen || person['Họ và tên'] || person['Họ tên'] || person['Họ và Tên'] || '',
        phong: person.phong || person['Phòng'] || person['Phòng ban'] || '',
        idCho: person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || person['idCho'] || '',
        maThe: maTheValue,
        id: personId,
        image: person.image || person['Image'] || person['Ảnh'] || person['ảnh'] || '',
        timestamp: scanTime.toISOString(),
        timeString: scanTime.toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        fromFirestore: true
      }
      
      return personData
    }
    
    isUserScanningRef.current = false
    return null
  }

  const handleRemoveScan = async (cardCode) => {
    // Tìm person từ attendanceList để lấy ID
    const person = attendanceList.find(p => {
      const maThe = p.maThe || p['Mã thẻ'] || p['Mã Thẻ'] || p['maThe'] || ''
      return String(maThe).trim() === String(cardCode).trim()
    })
    
    if (!person) {
      console.warn(`⚠️ Không tìm thấy người với mã thẻ: ${cardCode}`)
      return
    }
    
    const personId = person.id || person['ID'] || ''
    if (!personId) {
      console.warn(`⚠️ Không có ID để xóa khỏi Firestore. Mã thẻ: ${cardCode}`)
      // Vẫn xóa khỏi local state
      setScannedCards(prev => {
        const newMap = new Map(prev)
        newMap.delete(cardCode)
        return newMap
      })
      return
    }
    
    // Xác nhận trước khi xóa
    const personName = person.hoTen || person['Họ và tên'] || person['Họ tên'] || ''
    if (!window.confirm(`Bạn có chắc chắn muốn xóa điểm danh của "${personName}" (Mã thẻ: ${cardCode})?\n\nDữ liệu sẽ bị xóa khỏi Firestore.`)) {
      return
    }
    
    // Xóa khỏi Firestore
    console.log(`🗑️ Đang xóa điểm danh khỏi Firestore cho ID: ${personId}`)
    const deleteResult = await deleteFaceScanFromFirestore(personId)
    
    if (deleteResult) {
      console.log(`✅ Đã xóa thành công điểm danh khỏi Firestore cho: ${personName} (ID: ${personId})`)
      // Dữ liệu sẽ được cập nhật tự động qua real-time subscription
    } else {
      console.error(`❌ Không thể xóa khỏi Firestore cho ID: ${personId}`)
      alert('Không thể xóa dữ liệu khỏi Firestore. Vui lòng kiểm tra console để xem chi tiết lỗi.')
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu điểm danh?\n\nDữ liệu sẽ bị xóa khỏi Firestore. Hành động này KHÔNG THỂ hoàn tác!')) {
      return
    }
    
    if (!window.confirm('Xác nhận lần cuối: Bạn thực sự muốn xóa TẤT CẢ dữ liệu điểm danh?')) {
      return
    }
    
    // Xóa tất cả documents từ Firestore
    const scannedCardsArray = Array.from(scannedCards.values())
    let successCount = 0
    let failCount = 0
    
    console.log(`🗑️ Đang xóa ${scannedCardsArray.length} bản ghi khỏi Firestore...`)
    
    for (const cardData of scannedCardsArray) {
      const personId = cardData.id
      if (personId) {
        const result = await deleteFaceScanFromFirestore(personId)
        if (result) {
          successCount++
        } else {
          failCount++
        }
      }
    }
    
    console.log(`✅ Đã xóa ${successCount} bản ghi thành công`)
    if (failCount > 0) {
      console.warn(`⚠️ Không thể xóa ${failCount} bản ghi`)
      alert(`Đã xóa ${successCount} bản ghi thành công. ${failCount > 0 ? `${failCount} bản ghi không thể xóa.` : ''}`)
    } else {
      alert(`Đã xóa thành công tất cả ${successCount} bản ghi điểm danh.`)
    }
    
    // Dữ liệu sẽ được cập nhật tự động qua real-time subscription (sẽ trống)
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
    localStorage.setItem(AUTH_KEY, 'true')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem(AUTH_KEY)
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>HỘI NGHỊ ĐẠI BIỂU VIÊN CHỨC NGƯỜI LAO ĐỘNG NĂM 2025</h1>
        <div className="header-actions">
          <PhongBanDistributionPopup 
            attendanceList={attendanceList}
            scannedCards={scannedCards}
          />
          <StatisticsPanel 
            attendanceList={attendanceList}
            scannedCards={scannedCards}
          />
          <ExcelUploader onUpload={handleExcelUpload} />
          <button className="logout-button" onClick={handleLogout} title="Đăng xuất">
            🚪 Đăng xuất
          </button>
        </div>
      </header>
      
      <div className="app-content">
        <div className="left-panel">
          <CardScanner 
            onScan={handleCardScan}
            scannedCards={Array.from(scannedCards.values()).sort((a, b) => {
              // Sắp xếp từ mới nhất (timestamp lớn nhất) đến cũ nhất (timestamp nhỏ nhất)
              const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
              const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
              return timeB - timeA // Sắp xếp giảm dần (mới nhất trước)
            })}
            onRemove={handleRemoveScan}
            onClearAll={handleClearAll}
            newScanFromFirestore={newScanFromFirestore}
            onDismissNewScan={() => setNewScanFromFirestore(null)}
          />
        </div>
        
        <div className="right-panel">
          <ConferenceLayout 
            attendanceList={attendanceList}
            scannedCards={scannedCards}
          />
        </div>
      </div>
    </div>
  )
}

export default App
