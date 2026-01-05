// Firebase configuration
// Bạn cần lấy các thông tin này từ Firebase Console > Project Settings > General > Your apps
// Xem hướng dẫn chi tiết tại: HUONG_DAN_LAY_FIREBASE_CONFIG.md
// 
// LƯU Ý: File chatbot-ktx-firebase-adminsdk-*.json là Admin SDK (dùng cho server),
//        KHÔNG dùng được cho Client SDK (web app). Bạn cần tạo Web app trong Firebase Console
//        để lấy apiKey, messagingSenderId, appId
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// TODO: Lấy thông tin từ Firebase Console > Project Settings > Your apps > Web app
// Xem file HUONG_DAN_LAY_FIREBASE_CONFIG.md để biết cách lấy
const firebaseConfig = {

    apiKey: "AIzaSyCX_AwCvvvdsfPbKgzj-oOdieBYQ2krwg8",
    authDomain: "chatbot-ktx.firebaseapp.com",
    projectId: "chatbot-ktx",
    storageBucket: "chatbot-ktx.firebasestorage.app",
    messagingSenderId: "205541829562",
    appId: "1:205541829562:web:cbe5bed449186e05720b83",
    measurementId: "G-0ERNHD3G71"
  
}

// Kiểm tra xem Firebase config đã được cấu hình chưa
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.messagingSenderId && 
  firebaseConfig.messagingSenderId !== "YOUR_MESSAGING_SENDER_ID" &&
  firebaseConfig.appId && 
  firebaseConfig.appId !== "YOUR_APP_ID"

if (!isFirebaseConfigured) {
  console.warn('⚠️ Firebase chưa được cấu hình! Vui lòng cập nhật file src/firebase/config.js với thông tin từ Firebase Console.')
  console.warn('Xem hướng dẫn tại file FIREBASE_SETUP.md')
}

// Initialize Firebase
let app
let db

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  
  if (isFirebaseConfigured) {
    console.log('✅ Firebase đã được khởi tạo thành công')
  }
} catch (error) {
  console.error('❌ Lỗi khởi tạo Firebase:', error)
  console.error('Vui lòng kiểm tra lại cấu hình Firebase trong file src/firebase/config.js')
}

export { db, isFirebaseConfigured }
export default app

