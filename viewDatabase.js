// viewDatabase.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Khởi tạo ứng dụng Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://restaurant-manager-c6a43-default-rtdb.firebaseio.com/' // URL cơ sở dữ liệu Realtime Database của bạn
});

const db = admin.database(); // Sử dụng Realtime Database

const viewEntireDatabase = async () => {
  try {
    const rootRef = db.ref();  // Lấy tham chiếu gốc của cơ sở dữ liệu
    const snapshot = await rootRef.once('value');
    const entireDatabase = snapshot.val();  // Lấy toàn bộ dữ liệu từ cơ sở dữ liệu

    // Kiểm tra nếu cơ sở dữ liệu có dữ liệu
    if (entireDatabase) {
      console.log('Toàn bộ cơ sở dữ liệu:');
      console.log(JSON.stringify(entireDatabase, null, 2));  // Hiển thị toàn bộ dữ liệu với định dạng dễ đọc
    } else {
      console.log('Không có dữ liệu trong cơ sở dữ liệu.');
    }
  } catch (error) {
    console.error('Lỗi khi lấy toàn bộ cơ sở dữ liệu:', error);
  }
};

// Gọi hàm để xem dữ liệu
viewEntireDatabase();
