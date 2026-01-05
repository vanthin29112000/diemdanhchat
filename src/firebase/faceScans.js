import { db, isFirebaseConfigured } from './config'
import { doc, getDoc, setDoc, deleteDoc, Timestamp, collection, getDocs, onSnapshot } from 'firebase/firestore'

/**
 * Kiểm tra xem đã điểm danh chưa bằng cách tìm trong collection face_scans
 * @param {string} id - ID của người cần kiểm tra
 * @returns {Promise<{hasScanned: boolean, firstScan: Date|null, data: any|null}>}
 */
export async function checkFaceScanAttendance(id) {
  try {
    if (!isFirebaseConfigured || !db) {
      console.warn('Firebase chưa được cấu hình, không thể kiểm tra Firestore')
      return { hasScanned: false, firstScan: null, data: null, error: 'Firebase not configured' }
    }

    if (!id) {
      return { hasScanned: false, firstScan: null, data: null }
    }

    // Tạo reference đến document với id trong collection face_scans
    const faceScanRef = doc(db, 'face_scans', String(id))
    
    // Lấy document
    const faceScanSnap = await getDoc(faceScanRef)

    if (faceScanSnap.exists()) {
      const data = faceScanSnap.data()
      
      // Lấy thời gian firstScan (hỗ trợ cả firstScan và firstscan)
      let firstScan = null
      const firstScanField = data.firstScan || data.firstscan || data.first_scan
      
      if (firstScanField) {
        // Nếu là Firestore Timestamp, convert sang Date
        if (firstScanField.toDate) {
          firstScan = firstScanField.toDate()
        } else if (firstScanField.seconds) {
          // Nếu là object có seconds (Firestore Timestamp format)
          firstScan = new Date(firstScanField.seconds * 1000)
        } else if (typeof firstScanField === 'string') {
          // Nếu là string ISO
          firstScan = new Date(firstScanField)
        } else if (firstScanField instanceof Date) {
          firstScan = firstScanField
        } else if (typeof firstScanField === 'number') {
          // Nếu là timestamp số
          firstScan = new Date(firstScanField)
        }
      }

      return {
        hasScanned: true,
        firstScan: firstScan,
        data: data
      }
    } else {
      // Document không tồn tại
      return { hasScanned: false, firstScan: null, data: null }
    }
  } catch (error) {
    console.error('Error checking face_scans:', error)
    // Nếu có lỗi (ví dụ: chưa config Firebase đúng), trả về false
    return { hasScanned: false, firstScan: null, data: null, error: error.message }
  }
}

/**
 * Lưu thông tin điểm danh lên Firestore collection face_scans
 * @param {string} id - ID của người (từ cột ID trong Excel)
 * @param {Date} scanTime - Thời gian điểm danh
 * @param {object} additionalData - Dữ liệu bổ sung (optional)
 * @param {boolean} isUpdateOnly - Nếu true, chỉ cập nhật lastScan, không tạo firstScan mới
 * @returns {Promise<boolean>} - true nếu lưu thành công
 */
export async function saveFaceScanToFirestore(id, scanTime, additionalData = {}, isUpdateOnly = false) {
  try {
    if (!isFirebaseConfigured || !db) {
      console.error('❌ Firebase chưa được cấu hình, không thể lưu lên Firestore')
      console.error('Vui lòng cập nhật file src/firebase/config.js với thông tin từ Firebase Console')
      return false
    }

    if (!id) {
      console.error('Cannot save to Firestore: ID is required')
      return false
    }

    // Tạo reference đến document với id trong collection face_scans
    const faceScanRef = doc(db, 'face_scans', String(id))
    
    const scanTimestamp = Timestamp.fromDate(scanTime instanceof Date ? scanTime : new Date(scanTime))
    
    let updateData = {
      ...additionalData,
      lastScan: scanTimestamp,
      updatedAt: Timestamp.now()
    }
    
    // Chỉ lưu firstScan và isShowNotify nếu chưa có document (không phải update only)
    if (!isUpdateOnly) {
      // Kiểm tra xem document đã tồn tại chưa
      const faceScanSnap = await getDoc(faceScanRef)
      
      // Chỉ tạo firstScan và isShowNotify nếu document chưa tồn tại
      if (!faceScanSnap.exists()) {
        updateData.firstScan = scanTimestamp
        // Nếu additionalData không có isShowNotify, mặc định là false (cần hiển thị notification)
        // Nếu có thì dùng giá trị từ additionalData
        if (!('isShowNotify' in additionalData)) {
          updateData.isShowNotify = false
        }
      }
    }

    // Lưu với merge: true để không ghi đè dữ liệu hiện có
    await setDoc(faceScanRef, updateData, { merge: true })
    
    console.log(`✅ Đã lưu thông tin điểm danh lên Firestore cho ID: ${id}`)
    console.log('📊 Dữ liệu đã lưu:', { id, ...updateData })
    return true
  } catch (error) {
    console.error('❌ Lỗi khi lưu lên Firestore:', error)
    console.error('Chi tiết lỗi:', {
      code: error.code,
      message: error.message,
      id: id
    })
    
    // Hiển thị lỗi chi tiết hơn
    if (error.code === 'permission-denied') {
      console.error('🔒 Lỗi quyền truy cập: Vui lòng kiểm tra Firestore Security Rules')
    } else if (error.code === 'unavailable') {
      console.error('🌐 Firestore không khả dụng: Kiểm tra kết nối internet và Firebase config')
    }
    
    return false
  }
}

/**
 * Đánh dấu đã hiển thị notification cho một document
 * @param {string} id - ID của người (từ cột ID trong Excel)
 * @returns {Promise<boolean>} - true nếu cập nhật thành công
 */
export async function markNotificationAsShown(id) {
  try {
    if (!isFirebaseConfigured || !db) {
      console.error('❌ Firebase chưa được cấu hình, không thể cập nhật Firestore')
      return false
    }

    if (!id) {
      console.error('Cannot update Firestore: ID is required')
      return false
    }

    const faceScanRef = doc(db, 'face_scans', String(id))
    await setDoc(faceScanRef, { isShowNotify: true }, { merge: true })
    
    console.log(`✅ Đã đánh dấu đã hiển thị notification cho ID: ${id}`)
    return true
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật isShowNotify:', error)
    return false
  }
}

/**
 * Xóa document khỏi Firestore collection face_scans
 * @param {string} id - ID của người (từ cột ID trong Excel)
 * @returns {Promise<boolean>} - true nếu xóa thành công
 */
export async function deleteFaceScanFromFirestore(id) {
  try {
    if (!isFirebaseConfigured || !db) {
      console.error('❌ Firebase chưa được cấu hình, không thể xóa khỏi Firestore')
      return false
    }

    if (!id) {
      console.error('Cannot delete from Firestore: ID is required')
      return false
    }

    const faceScanRef = doc(db, 'face_scans', String(id))
    await deleteDoc(faceScanRef)
    
    console.log(`✅ Đã xóa điểm danh khỏi Firestore cho ID: ${id}`)
    return true
  } catch (error) {
    console.error('❌ Lỗi khi xóa khỏi Firestore:', error)
    console.error('Chi tiết lỗi:', {
      code: error.code,
      message: error.message,
      id: id
    })
    
    if (error.code === 'permission-denied') {
      console.error('🔒 Lỗi quyền truy cập: Vui lòng kiểm tra Firestore Security Rules')
    } else if (error.code === 'not-found') {
      console.warn(`⚠️ Document không tồn tại trong Firestore cho ID: ${id}`)
      return true // Document đã không tồn tại, coi như đã xóa thành công
    }
    
    return false
  }
}

/**
 * Load tất cả dữ liệu điểm danh từ Firestore collection face_scans
 * @param {Array} attendanceList - Danh sách người tham gia từ Excel (để map với dữ liệu Firestore)
 * @returns {Promise<Map>} - Map với key là mã thẻ, value là thông tin điểm danh
 */
export async function loadAllFaceScansFromFirestore(attendanceList = []) {
  try {
    if (!isFirebaseConfigured || !db) {
      console.warn('Firebase chưa được cấu hình, không thể load từ Firestore')
      return new Map()
    }

    console.log('📥 Đang tải dữ liệu điểm danh từ Firestore...')
    
    // Lấy tất cả documents từ collection face_scans
    const faceScansCollection = collection(db, 'face_scans')
    const snapshot = await getDocs(faceScansCollection)
    
    const scannedCardsMap = new Map()
    
    // Tạo map từ ID (document ID) sang mã thẻ từ attendanceList
    const idToMaTheMap = new Map()
    attendanceList.forEach(person => {
      const personId = person.id || person['ID'] || ''
      const maThe = person.maThe || person['Mã thẻ'] || person['Mã Thề'] || person['maThe'] || ''
      if (personId && maThe) {
        idToMaTheMap.set(String(personId), String(maThe).trim())
      }
    })
    
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      const documentId = docSnapshot.id // ID từ Firestore (tương ứng với ID trong Excel)
      
      // Tìm mã thẻ tương ứng với ID này
      const maThe = idToMaTheMap.get(documentId) || ''
      
      if (!maThe) {
        console.warn(`⚠️ Không tìm thấy mã thẻ cho ID: ${documentId}`)
        return
      }
      
      // Lấy thời gian firstScan
      let firstScan = null
      const firstScanField = data.firstScan || data.firstscan || data.first_scan
      
      if (firstScanField) {
        if (firstScanField.toDate) {
          firstScan = firstScanField.toDate()
        } else if (firstScanField.seconds) {
          firstScan = new Date(firstScanField.seconds * 1000)
        } else if (typeof firstScanField === 'string') {
          firstScan = new Date(firstScanField)
        } else if (firstScanField instanceof Date) {
          firstScan = firstScanField
        } else if (typeof firstScanField === 'number') {
          firstScan = new Date(firstScanField)
        }
      }
      
      if (firstScan) {
        // Tìm person từ attendanceList để lấy thông tin đầy đủ
        const person = attendanceList.find(p => {
          const pId = p.id || p['ID'] || ''
          return String(pId) === documentId
        })
        
        const personData = {
          id: documentId,
          maThe: maThe,
          hoTen: data.hoTen || (person ? (person.hoTen || person['Họ và tên'] || person['Họ tên'] || '') : ''),
          phong: data.phong || (person ? (person.phong || person['Phòng'] || person['Phòng ban'] || '') : ''),
          idCho: data.idCho || (person ? (person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || '') : ''),
          image: (person ? (person.image || person['Image'] || person['Ảnh'] || '') : '') || data.image || '',
          timestamp: firstScan.toISOString(),
          timeString: firstScan.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          fromFirestore: true,
          isShowNotify: data.isShowNotify !== undefined ? data.isShowNotify : true // Default là true nếu không có field
        }
        
        scannedCardsMap.set(maThe, personData)
      }
    })
    
    console.log(`✅ Đã tải ${scannedCardsMap.size} bản ghi điểm danh từ Firestore`)
    return scannedCardsMap
  } catch (error) {
    console.error('❌ Lỗi khi load dữ liệu từ Firestore:', error)
    return new Map()
  }
}

/**
 * Subscribe để lắng nghe thay đổi real-time từ Firestore
 * @param {Array} attendanceList - Danh sách người tham gia từ Excel
 * @param {Function} callback - Callback function được gọi khi có thay đổi
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToFaceScans(attendanceList, callback) {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase chưa được cấu hình, không thể subscribe')
    return () => {}
  }

  // Tạo map từ ID sang mã thẻ
  const idToMaTheMap = new Map()
  attendanceList.forEach(person => {
    const personId = person.id || person['ID'] || ''
    const maThe = person.maThe || person['Mã thẻ'] || person['Mã Thề'] || person['maThe'] || ''
    if (personId && maThe) {
      idToMaTheMap.set(String(personId), String(maThe).trim())
    }
  })

  const faceScansCollection = collection(db, 'face_scans')
  
  const unsubscribe = onSnapshot(faceScansCollection, (snapshot) => {
    const scannedCardsMap = new Map()
    
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      const documentId = docSnapshot.id
      const maThe = idToMaTheMap.get(documentId) || ''
      
      if (!maThe) return
      
      let firstScan = null
      const firstScanField = data.firstScan || data.firstscan || data.first_scan
      
      if (firstScanField) {
        if (firstScanField.toDate) {
          firstScan = firstScanField.toDate()
        } else if (firstScanField.seconds) {
          firstScan = new Date(firstScanField.seconds * 1000)
        } else if (typeof firstScanField === 'string') {
          firstScan = new Date(firstScanField)
        } else if (firstScanField instanceof Date) {
          firstScan = firstScanField
        } else if (typeof firstScanField === 'number') {
          firstScan = new Date(firstScanField)
        }
      }
      
      if (firstScan) {
        // Tìm person từ attendanceList để lấy thông tin đầy đủ
        const person = attendanceList.find(p => {
          const pId = p.id || p['ID'] || ''
          return String(pId) === documentId
        })
        
        const personData = {
          id: documentId,
          maThe: maThe,
          hoTen: data.hoTen || (person ? (person.hoTen || person['Họ và tên'] || person['Họ tên'] || '') : ''),
          phong: data.phong || (person ? (person.phong || person['Phòng'] || person['Phòng ban'] || '') : ''),
          idCho: data.idCho || (person ? (person.idCho || person['ID chỗ'] || person['ID Chỗ'] || person['id chỗ'] || '') : ''),
          image: (person ? (person.image || person['Image'] || person['Ảnh'] || '') : '') || data.image || '',
          timestamp: firstScan.toISOString(),
          timeString: firstScan.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          fromFirestore: true,
          isShowNotify: data.isShowNotify !== undefined ? data.isShowNotify : true // Default là true nếu không có field
        }
        
        scannedCardsMap.set(maThe, personData)
      }
    })
    
    callback(scannedCardsMap)
  }, (error) => {
    console.error('❌ Lỗi khi subscribe Firestore:', error)
  })
  
  return unsubscribe
}

