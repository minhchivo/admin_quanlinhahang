const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const session = require('express-session');
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
const path = require('path');
const multer = require('multer');
const fs = require('fs');


// Khởi tạo Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://restaurant-manager-c6a43-default-rtdb.firebaseio.com/'
});

const db = admin.database(); // Sử dụng Realtime Database

// Khởi tạo ứng dụng Express
const app = express();
const router = express.Router()
app.use(cors({
  origin: ['https://minhchivo.github.io', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Đọc dữ liệu từ form HTML

// Cấu hình session middleware
app.use(session({
  secret: 'NqJ4s8Lx!hS5P@kT3bY7gW2f',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, sameSite: 'lax' } // Thử 'none' nếu vẫn lỗi
}));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'Image')); // Đường dẫn lưu ảnh
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${timestamp}-${file.originalname}`); // Đặt tên file ảnh theo timestamp
  }
});

const upload = multer({ storage });
app.use('/Image', express.static(path.join(__dirname, 'Image')));


// Cấu hình để phục vụ các tệp tĩnh từ thư mục 'public'
app.use(express.static(path.join(__dirname, 'public')));



// Route chính - luôn hiển thị trang login.html nếu chưa đăng nhập
app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/giaodien');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});
//Đăng nhập ADMIN
// Route đăng nhập
app.post('/login', async (req, res) => {
  const { adminId, password } = req.body;
  
  console.log("Received adminId and password:", adminId, password);

  try {
    const snapshot = await db.ref(`Admins/${adminId}`).once('value');
    const adminData = snapshot.val();
    
    console.log("Fetched admin data from Firebase:", adminData);

    if (adminData && adminData.password === password) {
      req.session.loggedIn = true;
      req.session.adminId = adminId; // Lưu adminId vào session
      console.log("Login successful. Redirecting to giaodien.");
      res.redirect('/giaodien'); // Chuyển đến trang giaodien.html sau khi đăng nhập thành công
    } else {
      console.log("Invalid credentials provided.");
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    console.error("Login failed: ", error);
    res.status(500).send('Server error');
  }
});


// Route để hiển thị giaodien.html, yêu cầu đăng nhập
app.get('/giaodien', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'public', 'giaodien.html'));
  } else {
    res.redirect('/');
  }
});

// Route đăng xuất để xóa session
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    console.log("Logged out successfully.");
    res.redirect('/');
  });
});


app.get('/admin-info', (req, res) => {
  if (req.session.loggedIn && req.session.adminId) {
    // Lấy adminId từ session
    const adminId = req.session.adminId;

    // Truy xuất thông tin admin từ Firebase bằng adminId từ session
    db.ref(`Admins/${adminId}`).once('value')
      .then(snapshot => {
        const adminData = snapshot.val();
        if (adminData) {
          res.json({
            address: adminData.address,
            adminId: adminData.adminId,
            created_at: adminData.created_at,
            image_url: adminData.image_url,
            name: adminData.name,
            password: adminData.password,
            phone: adminData.phone
          });
        } else {
          res.status(404).json({ error: 'Admin not found' });
        }
      })
      .catch(error => {
        console.error("Error fetching admin data:", error);
        res.status(500).json({ error: 'Server error' });
      });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// API để xem dữ liệu từ Firebase Realtime Database
app.get('/api/view-database', async (req, res) => {
  try {
    const rootRef = db.ref();
    const snapshot = await rootRef.once('value');
    const data = snapshot.val();
    
    if (data) {
      res.json(data);  // Trả về dữ liệu cho frontend
    } else {
      res.status(404).json({ error: 'Không có dữ liệu' });
    }
  } catch (error) {
    console.error('Lỗi khi truy xuất cơ sở dữ liệu:', error);
    res.status(500).json({ error: 'Lỗi khi truy xuất cơ sở dữ liệu' });
  }
});
// Cấu hình multer để lưu trữ hình ảnh và đặt tên theo tên nhân viên



// API để thêm bàn
app.post('/api/add-table', async (req, res) => {
  try {
    const { tableId, tableName, status } = req.body;
    if (!tableId || !tableName || status === undefined) {
      return res.status(400).json({ error: 'Thông tin bàn không hợp lệ' });
    }
    const newTableRef = db.ref(`Tables/${tableId}`);
    await newTableRef.set({ tableName, status });
    res.json({ message: 'Bàn đã được thêm thành công' });
  } catch (error) {
    console.error('Lỗi khi thêm bàn:', error);
    res.status(500).json({ error: 'Lỗi khi thêm bàn' });
  }
});

// API để xóa bàn
app.delete('/api/delete-table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    await db.ref('Tables/' + tableId).remove();
    res.json({ message: 'Bàn đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa bàn:', error);
    res.status(500).json({ error: 'Lỗi khi xóa bàn' });
  }
});

// API để sửa bàn
app.put('/api/update-table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    const { tableName, status } = req.body;
    if (!tableName || status === undefined) {
      return res.status(400).json({ error: 'Dữ liệu cập nhật không hợp lệ' });
    }
    await db.ref('Tables/' + tableId).update({ tableName, status });
    res.json({ message: 'Bàn đã được cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật bàn:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật bàn' });
  }
});

// ---------------------- Booking API ----------------------

// API để thêm booking
app.post('/api/add-booking', async (req, res) => {
  try {
    const { customerID, tableID, bookingDate, expiredTime } = req.body;
    if (!customerID || !tableID || !bookingDate || !expiredTime) {
      return res.status(400).json({ error: 'Thông tin booking không hợp lệ' });
    }
    const newBookingRef = db.ref('BookingTables').push();
    await newBookingRef.set({ customerID, tableID, bookingDate, expiredTime });
    res.json({ message: 'Booking đã được thêm thành công' });
  } catch (error) {
    console.error('Lỗi khi thêm booking:', error);
    res.status(500).json({ error: 'Lỗi khi thêm booking' });
  }
});



// API để sửa booking
app.put('/api/update-booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { customerID, tableID, bookingDate, expiredTime } = req.body;
    if (!customerID || !tableID || !bookingDate || !expiredTime) {
      return res.status(400).json({ error: 'Dữ liệu cập nhật không hợp lệ' });
    }
    await db.ref('BookingTables/' + bookingId).update({ customerID, tableID, bookingDate, expiredTime });
    res.json({ message: 'Booking đã được cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật booking:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật booking' });
  }
});

app.post('/api/add-food', upload.single('image'), async (req, res) => {
  try {
    const { foodName, price, description, category } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!foodName || !price || !description || !category) {
      return res.status(400).json({ error: 'Thông tin thức ăn không hợp lệ' });
    }

    // Xử lý ảnh (nếu có)
    const imageUrl = req.file ? `/Image/${req.file.filename}` : '';

    // Lấy dữ liệu hiện tại để tính ID mới
    const foodRef = db.ref('Food');
    const snapshot = await foodRef.once('value');
    const foodData = snapshot.val() || {};

    // Tìm ID lớn nhất trong danh sách và tăng thêm 1
    const maxId = Object.keys(foodData).reduce((max, id) => Math.max(max, parseInt(id, 10)), 0);
    const newId = maxId + 1; // ID mới là ID lớn nhất + 1

    // Ghi dữ liệu mới vào Firebase với ID kiểu số
    await db.ref(`Food/${newId}`).set({
      foodName,
      price,
      imageUrl,
      description,
      category
    });

    // Trả về kết quả
    res.json({ message: 'Thức ăn đã được thêm thành công', id: newId });
  } catch (error) {
    console.error('Lỗi khi thêm thức ăn:', error);
    res.status(500).json({ error: 'Lỗi khi thêm thức ăn' });
  }
});




// API để xóa thức ăn
app.delete('/api/delete-food/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;

    // Lấy thông tin thức ăn trước khi xóa
    const foodRef = db.ref(`Food/${foodId}`);
    const snapshot = await foodRef.once('value');
    const foodData = snapshot.val();

    if (foodData && foodData.imageUrl) {
      // Xóa file ảnh từ hệ thống
      const imagePath = path.join(__dirname, foodData.imageUrl);
      fs.unlinkSync(imagePath);
    }

    await foodRef.remove();
    res.json({ message: 'Thức ăn đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa thức ăn:', error);
    res.status(500).json({ error: 'Lỗi khi xóa thức ăn' });
  }
});


// API để sửa thức ăn
app.put('/api/update-food/:foodId', upload.single('image'), async (req, res) => {
  try {
      const { foodId } = req.params;
      const { foodName, price, description, category } = req.body;
      
      // Lấy thông tin món ăn hiện tại từ cơ sở dữ liệu để giữ lại ảnh cũ nếu không có ảnh mới
      const foodRef = db.ref('Food/' + foodId);
      const snapshot = await foodRef.once('value');
      const existingData = snapshot.val();

      if (!existingData) {
          return res.status(404).json({ error: 'Món ăn không tồn tại' });
      }

      // Sử dụng URL ảnh cũ nếu không có ảnh mới được tải lên
      const imageUrl = req.file ? `/Image/${req.file.filename}` : existingData.imageUrl;

      // Cập nhật dữ liệu món ăn
      await foodRef.update({
          foodName: foodName || existingData.foodName,
          price: price || existingData.price,
          description: description || existingData.description,
          category: category || existingData.category,
          imageUrl: imageUrl // Giữ lại URL ảnh cũ nếu không có ảnh mới
      });

      res.json({ message: 'Món đã được cập nhật thành công' });
  } catch (error) {
      console.error('Lỗi khi cập nhật món ăn:', error);
      res.status(500).json({ error: 'Lỗi khi cập nhật món ăn' });
  }
});

//thêm nước
app.post('/api/add-drink', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, isAvailable } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !price || !description || typeof isAvailable === 'undefined') {
      return res.status(400).json({ error: 'Thông tin nước uống không hợp lệ' });
    }

    // Lưu đường dẫn ảnh nếu có
    const imageUrl = req.file ? `/Image/${req.file.filename}` : '';

    // Lấy ID lớn nhất và tăng thêm 1
    const drinkRef = db.ref('FoodDrinks');
    const snapshot = await drinkRef.once('value');
    const drinkData = snapshot.val() || {};
    const newId = Object.keys(drinkData).length > 0 ? Math.max(...Object.keys(drinkData).map(id => parseInt(id, 10))) + 1 : 1;

    // Thêm nước uống mới vào database
    await db.ref(`FoodDrinks/${newId}`).set({
      name,
      price,
      imageUrl,
      description,
      isAvailable: isAvailable === 'true'
    });

    res.json({ message: 'Nước uống đã được thêm thành công' });
  } catch (error) {
    console.error('Lỗi khi thêm nước uống:', error);
    res.status(500).json({ error: 'Lỗi khi thêm nước uống' });
  }
});

//xóa nước
app.delete('/api/delete-drink/:drinkId', async (req, res) => {
  try {
    const { drinkId } = req.params;

    // Lấy thông tin nước uống trước khi xóa
    const drinkRef = db.ref(`FoodDrinks/${drinkId}`);
    const snapshot = await drinkRef.once('value');
    const drinkData = snapshot.val();

    // Xóa ảnh từ hệ thống nếu có
    if (drinkData && drinkData.imageUrl) {
      const imagePath = path.join(__dirname, drinkData.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Xóa nước uống từ database
    await drinkRef.remove();
    res.json({ message: 'Nước uống đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa nước uống:', error);
    res.status(500).json({ error: 'Lỗi khi xóa nước uống' });
  }
});

//sửa nước
app.put('/api/update-drink/:drinkId', upload.single('image'), async (req, res) => {
  try {
    const { drinkId } = req.params;
    const { name, price, description, isAvailable } = req.body;

    // Lấy thông tin nước uống hiện tại từ cơ sở dữ liệu
    const drinkRef = db.ref(`FoodDrinks/${drinkId}`);
    const snapshot = await drinkRef.once('value');
    const existingData = snapshot.val();

    if (!existingData) {
      return res.status(404).json({ error: 'Nước uống không tồn tại' });
    }

    // Xử lý ảnh mới nếu có, giữ ảnh cũ nếu không có ảnh mới
    const imageUrl = req.file ? `/Image/${req.file.filename}` : existingData.imageUrl;

    // Cập nhật dữ liệu nước uống
    await drinkRef.update({
      name: name || existingData.name,
      price: price || existingData.price,
      description: description || existingData.description,
      isAvailable: typeof isAvailable !== 'undefined' ? (isAvailable === 'true') : existingData.isAvailable,
      imageUrl
    });

    res.json({ message: 'Nước uống đã được cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật nước uống:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật nước uống' });
  }
});


// Thêm khách hàng mới
app.post('/api/add-user', async (req, res) => {
  try {
      console.log("Received add-user request with data:", req.body); // Log input data
      const { name, email, phone, address } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!name || !email || !phone || !address) {
          console.log("Invalid input data:", { name, email, phone, address });
          return res.status(400).json({ error: 'Thông tin khách hàng không hợp lệ' });
      }

      // Lấy ID lớn nhất hiện tại và tăng lên 1
      const usersRef = admin.database().ref('Users');
      const snapshot = await usersRef.once('value');
      const users = snapshot.val();

      let newId = 1;
      if (users) {
          const ids = Object.keys(users).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
          newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
      }

      const newUserRef = admin.database().ref(`Users/${newId}`);
      await newUserRef.set({
          name,
          email,
          phone,
          address,
          created_at: new Date().toISOString()
      });

      console.log("User added successfully with ID:", newId); // Log success
      res.json({ message: 'Khách hàng đã được thêm thành công', id: newId });
  } catch (error) {
      console.error("Error adding user:", error); // Log lỗi
      res.status(500).json({ error: 'Lỗi khi thêm khách hàng' });
  }
});


//Api để xóa khách hàng
app.delete('/api/delete-user/:userId', async (req, res) => {
  try {
      const { userId } = req.params;
      const userRef = admin.database().ref(`Users/${userId}`);
      
      const snapshot = await userRef.once('value');
      if (snapshot.exists()) {
          await userRef.remove();
          res.json({ message: 'Khách hàng đã được xóa thành công' });
      } else {
          res.status(404).json({ error: 'Khách hàng không tồn tại' });
      }
  } catch (error) {
      console.error("Lỗi khi xóa khách hàng:", error);
      res.status(500).json({ error: 'Lỗi khi xóa khách hàng' });
  }
});
//APi sửa khách hàng
app.put('/api/update-user/:userId', async (req, res) => {
  try {
      const { userId } = req.params;
      const { name, email, phone, address } = req.body;

      // Lấy thông tin khách hàng hiện tại từ cơ sở dữ liệu
      const userRef = admin.database().ref(`Users/${userId}`);
      const snapshot = await userRef.once('value');
      const existingData = snapshot.val();

      if (!existingData) {
          return res.status(404).json({ error: 'Khách hàng không tồn tại' });
      }

      // Cập nhật dữ liệu khách hàng, giữ nguyên nếu không có dữ liệu mới
      await userRef.update({
          name: name || existingData.name,
          email: email || existingData.email,
          phone: phone || existingData.phone,
          address: address || existingData.address,
          updated_at: new Date().toISOString()
      });

      res.json({ message: 'Khách hàng đã được cập nhật thành công' });
  } catch (error) {
      console.error("Lỗi khi cập nhật khách hàng:", error);
      res.status(500).json({ error: 'Lỗi khi cập nhật khách hàng' });
  }
});



// API để lấy danh sách hóa đơn kèm chi tiết
app.get('/api/combined-invoices', async (req, res) => {
  try {
      // Lấy tất cả Orders
      const ordersSnapshot = await db.ref('Orders').once('value');
      const orders = ordersSnapshot.val();
      if (!orders) {
          return res.status(404).json({ error: 'Không có dữ liệu đơn hàng' });
      }

      // Lấy tất cả DetailOrders
      const detailOrdersSnapshot = await db.ref('DetailOrders').once('value');
      const detailOrders = detailOrdersSnapshot.val() || {};

      // Kết hợp các Orders và DetailOrders
      const combinedInvoices = Object.keys(orders).map(orderId => {
          const order = orders[orderId];
          const details = Object.keys(detailOrders)
              .filter(detailId => detailOrders[detailId].orderID == orderId)
              .map(detailId => detailOrders[detailId]);

          return {
              ...order,
              orderId,
              details
          };
      });

      res.json(combinedInvoices);
  } catch (error) {
      console.error('Lỗi khi lấy hóa đơn kết hợp:', error);
      res.status(500).json({ error: 'Lỗi khi lấy hóa đơn kết hợp' });
  }
});



// API để lấy danh sách đặt bàn cho một người dùng cụ thể
app.get('/api/bookings', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Thiếu userId' });
  }

  try {
    const bookingSnapshot = await db
      .ref('BookingTables')
      .orderByChild('userId')
      .equalTo(Number(userId))
      .once('value');
    const bookings = [];

    bookingSnapshot.forEach((childSnapshot) => {
      bookings.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });

    // Truy xuất tên bàn từ `Tables`
    const tableSnapshot = await db.ref('Tables').once('value');
    const tables = tableSnapshot.val();

    // Kết hợp tên bàn vào dữ liệu booking
    const enrichedBookings = bookings.map((booking) => ({
      ...booking,
      tableName: tables[booking.tableID]?.tableName || `Table ${booking.tableID}`,
    }));

    res.json(enrichedBookings);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đặt bàn:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đặt bàn' });
  }
});

// API lấy danh sách hóa đơn
app.get('/api/view-database', async (req, res) => {
  try {
      const invoicesRef = db.ref('Invoices');
      const invoicesSnapshot = await invoicesRef.once('value');

      if (!invoicesSnapshot.exists()) {
          return res.json({ Invoices: [] }); // Trả về danh sách rỗng nếu không có hóa đơn
      }

      const invoices = invoicesSnapshot.val();
      res.json({ Invoices: invoices });
  } catch (error) {
      console.error('Lỗi khi lấy danh sách hóa đơn:', error);
      res.status(500).json({ error: 'Lỗi khi lấy danh sách hóa đơn.' });
  }
});

app.post('/api/add-invoice', async (req, res) => {
  try {
      const { userId, paymentMethod, totalAmount, items, status } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!userId || !paymentMethod || !totalAmount || !items) {
          return res.status(400).json({ error: 'Thông tin hóa đơn không hợp lệ' });
      }

      // Lấy dữ liệu hiện tại để tính ID mới
      const invoiceRef = db.ref('Invoices');
      const snapshot = await invoiceRef.once('value');
      const invoiceData = snapshot.val() || {};

      // Tìm ID lớn nhất trong danh sách và tăng thêm 1
      const maxId = Object.keys(invoiceData).reduce((max, id) => Math.max(max, parseInt(id, 10)), 0);
      const newId = maxId + 1;

      // Ghi dữ liệu mới vào Firebase với ID kiểu số
      await db.ref(`Invoices/${newId}`).set({
          userId,
          paymentMethod,
          totalAmount,
          items,
          status: status || 'Chưa thanh toán',
          createdAt: new Date().toISOString(),
      });

      res.json({ message: 'Hóa đơn đã được thêm thành công', id: newId });
  } catch (error) {
      console.error('Lỗi khi thêm hóa đơn:', error);
      res.status(500).json({ error: 'Lỗi khi thêm hóa đơn' });
  }
});
// API để xóa hóa đơn
app.delete('/api/delete-invoice/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;

  if (!invoiceId || isNaN(invoiceId)) {
    return res.status(400).json({ error: 'Invoice ID không hợp lệ' });
  }

  const invoiceRef = db.ref(`Invoices/${invoiceId}`);
  const snapshot = await invoiceRef.once('value');

  if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Hóa đơn không tồn tại' });
  }

  await invoiceRef.remove();
  res.json({ message: 'Hóa đơn đã được xóa thành công' });
});


// API để cập nhật trạng thái thanh toán của hóa đơn
app.put('/api/update-status/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  const { status } = req.body;

  if (!status || !['Chưa thanh toán', 'Đã thanh toán', 'Đang xử lý'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ. Các trạng thái hợp lệ: "Chưa thanh toán", "Đã thanh toán", "Đang xử lý"' });
  }

  const invoiceRef = db.ref(`Invoices/${invoiceId}`);
  const snapshot = await invoiceRef.once('value');

  if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Hóa đơn không tồn tại' });
  }

  await invoiceRef.update({ status });
  res.json({ message: 'Trạng thái hóa đơn đã được cập nhật thành công' });
});



//Người dùng
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const usersSnapshot = await db.ref('Users').once('value');
    const users = usersSnapshot.val();

    const foundUser = Object.values(users || {}).find(
      user => user.email === email && user.password === password
    );

    if (foundUser) {
      if (!foundUser.isVerified) {
        return res.status(403).json({ error: 'Tài khoản chưa được xác nhận. Vui lòng kiểm tra email của bạn.' });
      }

      req.session.loggedIn = true;
      req.session.userId = foundUser.userId;

      res.json({
        message: 'Login successful',
        userInfo: {
          userId: foundUser.userId,
          name: foundUser.name,
          email: foundUser.email,
          phone: foundUser.phone,
          address: foundUser.address,
        },
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login failed: ', error);
    res.status(500).json({ error: 'Server error' });
  }
});
const BASE_URL = 'https://admin-quanlinhahang.onrender.com'; // URL backend

const nodemailer = require('nodemailer');

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Hoặc dịch vụ email bạn sử dụng
  auth: {
    user: 'quanlynhahang33@gmail.com', // Email gửi
    pass: 'mulf fzpe fzuv hprp' // Mật khẩu ứng dụng
  }
});

const uuidv4 = require('uuid').v4;

app.post('/api/register', async (req, res) => {
  const { name, password, address, phone, email } = req.body;

  if (!name || !password || !address || !phone || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const usersRef = db.ref('Users');
    const snapshot = await usersRef.once('value');
    const users = snapshot.val();

    // Tìm `userId` lớn nhất hoặc khởi tạo giá trị 1
    let maxUserId = 0;
    if (users) {
      const userIds = Object.values(users).map(user => parseInt(user.userId, 10));
      maxUserId = Math.max(...userIds.filter(id => !isNaN(id)), 0);
    }
    const newUserId = maxUserId + 1;

    // Kiểm tra email đã tồn tại hay chưa
    const emailExists = Object.values(users || {}).some(user => user.email === email);
    if (emailExists) {
      return res.status(400).json({ error: 'Email đã tồn tại. Vui lòng sử dụng email khác.' });
    }

    const verificationToken = uuidv4(); // Tạo token xác minh email

    // Lưu người dùng mới với `userId`
    const newUserRef = usersRef.child(newUserId); // Dùng `userId` làm key
    await newUserRef.set({
      userId: newUserId,
      name,
      password,
      address,
      phone,
      email,
      verificationToken,
      isVerified: false, // Chưa xác nhận
      created_at: new Date().toISOString(),
    });

    // Tạo link xác nhận
    const verificationLink = `${BASE_URL}/verify-email/${verificationToken}`;

    // Gửi email xác nhận
    const mailOptions = {
      from: 'quanlynhahang33@gmail.com',
      to: email,
      subject: 'Xác nhận đăng ký tài khoản',
      html: `
        <p>Chào ${name},</p>
        <p>Vui lòng nhấn vào link dưới đây để xác nhận tài khoản của bạn:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>Trân trọng,</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.',
    });
  } catch (error) {
    console.error('Registration failed: ', error);
    res.status(500).json({ error: 'Server error' });
  }
});






app.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).send('<h3>Link xác nhận không hợp lệ.</h3>');
  }

  try {
    const usersRef = db.ref('Users');
    const snapshot = await usersRef.once('value');
    const users = snapshot.val();

    // Tìm người dùng dựa trên token
    const userKey = Object.keys(users || {}).find(
      key => users[key].verificationToken === token
    );

    if (!userKey) {
      return res.status(404).send('<h3>Link xác nhận không hợp lệ hoặc đã hết hạn.</h3>');
    }

    const userData = users[userKey];

    // Kiểm tra nếu tài khoản đã được xác nhận
    if (userData.isVerified) {
      return res.send('<h3>Tài khoản của bạn đã được xác minh trước đó! Giờ đây bạn có thể đăng nhập.</h3>');
    }

    // Cập nhật trạng thái tài khoản
    await db.ref(`Users/${userKey}`).update({ isVerified: true, verificationToken: null });

    res.send('<h3>Tài khoản của bạn đã được xác minh thành công! Giờ đây bạn có thể đăng nhập.</h3>');
  } catch (error) {
    console.error('Verification failed: ', error);
    res.status(500).send('<h3>Đã xảy ra lỗi, vui lòng thử lại sau.</h3>');
  }
});




// Đăng xuất người dùng
app.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});


app.get('/api/tables', async (req, res) => {
  try {
    const snapshot = await db.ref('Tables').once('value');
    const data = snapshot.val();

    if (!data) {
      return res.status(404).json({ error: 'Không có dữ liệu bàn trong cơ sở dữ liệu.' });
    }

    const tables = Object.keys(data).map((key) => ({
      tableID: key, // Đảm bảo tableID lấy từ key Firebase
      tableName: data[key].tableName,
      status: data[key].status,
    }));

    console.log("Tables fetched:", tables); // Log danh sách bàn
    res.json(tables);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bàn:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách bàn.' });
  }
});

app.post('/api/book-table', async (req, res) => {
  const { tableID, bookingDate, expiredTime, userId } = req.body;

  console.log("Received booking data:", { tableID, bookingDate, expiredTime, userId });

  // Kiểm tra dữ liệu đầu vào
  if (!tableID || !bookingDate || !expiredTime || !userId) {
    console.error("Missing booking data:", { tableID, bookingDate, expiredTime, userId });
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ.' });
  }

  try {
    // Kiểm tra trạng thái bàn
    const tableRef = db.ref(`Tables/${tableID}`);
    const tableSnapshot = await tableRef.once('value');
    const tableData = tableSnapshot.val();

    if (!tableData || tableData.status !== "1") {
      console.error("Table not available or already booked:", tableID);
      return res.status(400).json({ error: 'Bàn không khả dụng hoặc đã được đặt.' });
    }

    // Đặt bàn
    const bookingRef = db.ref(`BookingTables/${userId}_${tableID}`);
    await bookingRef.set({
      tableID,
      bookingDate,
      expiredTime,
      userId,
    });

    // Cập nhật trạng thái bàn
    await tableRef.update({ status: "0" });

    console.log("Booking successful for table:", tableID);
    res.json({ message: 'Đặt bàn thành công.' });
  } catch (error) {
    console.error('Lỗi khi đặt bàn:', error);
    res.status(500).json({ error: 'Lỗi khi đặt bàn.' });
  }
});

app.delete('/api/delete-booking/:bookingId', async (req, res) => {
  const { bookingId } = req.params; // bookingId = userId_tableID

  try {
    const bookingRef = db.ref(`BookingTables/${bookingId}`);
    const snapshot = await bookingRef.once('value');
    const bookingData = snapshot.val();

    if (!bookingData) {
      return res.status(404).json({ error: 'Booking không tồn tại.' });
    }

    const { tableID } = bookingData;

    if (!tableID) {
      return res.status(400).json({ error: 'Không tìm thấy tableID trong dữ liệu booking.' });
    }

    // Xóa booking
    await bookingRef.remove();

    // Cập nhật trạng thái bàn thành '1' (Available)
    const tableRef = db.ref(`Tables/${tableID}`);
    const tableSnapshot = await tableRef.once('value');

    if (!tableSnapshot.exists()) {
      return res.status(404).json({ error: 'Bàn không tồn tại.' });
    }

    await tableRef.update({ status: '1' }); // Cập nhật trạng thái thành '1' (Available)

    console.log(`Đã hủy booking và cập nhật trạng thái bàn ${tableID} thành '1'`);
    res.json({ message: 'Hủy booking thành công và trạng thái bàn đã được cập nhật.' });
  } catch (error) {
    console.error('Lỗi khi hủy booking:', error);
    res.status(500).json({ error: 'Lỗi khi hủy booking.' });
  }
});








// API để lấy danh sách món ăn
app.get('/api/foods', async (req, res) => {
  try {
    const snapshot = await db.ref('Food').once('value');
    const data = snapshot.val();

    // Kiểm tra nếu không có dữ liệu
    if (!data) {
      return res.status(404).json({ error: 'Không có món ăn nào trong cơ sở dữ liệu' });
    }

    // Chuyển đổi dữ liệu từ đối tượng sang mảng
    const foods = Object.keys(data).map(key => ({
      id: key,
      foodName: data[key].foodName,
      price: data[key].price,
      imageUrl: data[key].imageUrl,
      description: data[key].description,
      category: data[key].category,
    }));

    res.json(foods);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách món ăn:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách món ăn' });
  }
});

// API để lấy danh sách thức uống
app.get('/api/drinks', async (req, res) => {
  try {
    const snapshot = await db.ref('FoodDrinks').once('value');
    const data = snapshot.val();

    // Kiểm tra nếu không có dữ liệu
    if (!data) {
      return res.status(404).json({ error: 'Không có thức uống nào trong cơ sở dữ liệu' });
    }

    // Chuyển đổi dữ liệu từ đối tượng sang mảng
    const drinks = Object.keys(data).map(key => ({
      id: key,
      name: data[key].name,
      price: data[key].price,
      imageUrl: data[key].imageUrl,
      description: data[key].description,
      isAvailable: data[key].isAvailable,
    }));

    res.json(drinks);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thức uống:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách thức uống' });
  }
});
// API để thêm sản phẩm vào giỏ hàng
app.post('/api/add-to-cart', async (req, res) => {
  const { userId, productId, productName, quantity, price, type, imageUrl } = req.body;

  if (!userId || !productId || !productName || !quantity || !price || !type || !imageUrl) {
    return res.status(400).json({ error: 'Thiếu dữ liệu sản phẩm' });
  }

  try {
    const cartRef = db.ref(`Cart/${userId}/items`);
    const snapshot = await cartRef.orderByChild('productId').equalTo(productId).once('value');

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity, 10);
    let newQuantity = parsedQuantity;
    let totalPrice = parsedPrice * parsedQuantity;

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const existingItem = childSnapshot.val();
        newQuantity += existingItem.quantity;
        totalPrice += existingItem.totalPrice;
        childSnapshot.ref.update({
          quantity: newQuantity,
          totalPrice: totalPrice,
        });
      });
    } else {
      await cartRef.push({
        productId,
        productName,
        quantity: parsedQuantity,
        price: parsedPrice,
        type,
        totalPrice,
        imageUrl, // Lưu URL hình ảnh
      });
    }

    const cartTotalRef = db.ref(`Cart/${userId}/totalAmount`);
    const totalAmountSnapshot = await cartTotalRef.once('value');
    const existingTotal = totalAmountSnapshot.val() || 0;
    await cartTotalRef.set(existingTotal + totalPrice);

    res.json({ message: 'Sản phẩm đã được thêm vào giỏ hàng' });
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi khi thêm vào giỏ hàng' });
  }
});

// API để lấy giỏ hàng của người dùng
app.get('/api/cart/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const cartRef = db.ref(`Cart/${userId}`);
    const snapshot = await cartRef.once('value');
    const cartData = snapshot.val();

    if (cartData) {
      const items = cartData.items
        ? Object.values(cartData.items).map((item) => ({
            ...item,
            imageUrl: item.imageUrl || '/default-image.jpg', // Đảm bảo có URL ảnh
          }))
        : [];
      const recalculatedTotalAmount = items.reduce(
        (sum, item) => sum + parseFloat(item.totalPrice || 0),
        0
      );

      console.log('Cart data:', { items, totalAmount: recalculatedTotalAmount });
      res.json({ items, totalAmount: recalculatedTotalAmount });
    } else {
      res.status(404).json({ items: [], totalAmount: 0 });
    }
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Lỗi khi lấy giỏ hàng.' });
  }
});

app.post('/api/invoices', async (req, res) => {
  const { userId, items, totalAmount, paymentMethod, status, createdAt } = req.body;

  if (!userId || !items || !totalAmount || !paymentMethod || !status) {
    return res.status(400).json({ error: 'Thông tin không hợp lệ' });
  }

  try {
    const invoicesRef = db.ref('Invoices');
    const newInvoiceRef = invoicesRef.push();
    await newInvoiceRef.set({
      userId,
      items,
      totalAmount,
      paymentMethod,
      status,
      createdAt,
    });

    res.json({ message: 'Hóa đơn đã được tạo thành công' });
  } catch (error) {
    console.error('Lỗi khi tạo hóa đơn:', error);
    res.status(500).json({ error: 'Lỗi khi tạo hóa đơn' });
  }
});
app.delete('/api/cart/:userId/clear', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Thiếu userId' });
  }

  try {
    // Xóa toàn bộ giỏ hàng của người dùng
    await db.ref(`Cart/${userId}`).remove();

    res.json({ message: 'Giỏ hàng đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi khi xóa giỏ hàng' });
  }
});

app.get('/api/invoices/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'Thiếu userId' });
  }

  try {
    const invoicesRef = db.ref('Invoices');
    const snapshot = await invoicesRef
      .orderByChild('userId')
      .equalTo(Number(userId)) // Chuyển userId thành kiểu số
      .once('value');
    const invoices = snapshot.val();

    console.log('Hóa đơn từ Firebase:', invoices);

    if (!invoices) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn nào' });
    }

    const invoiceList = Object.keys(invoices).map((key) => ({
      id: key,
      ...invoices[key],
    }));

    res.json(invoiceList);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hóa đơn:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách hóa đơn' });
  }
});





// API tìm kiếm món ăn, thức uống
app.get('/api/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Thiếu từ khóa tìm kiếm' });
  }

  try {
    // Tìm kiếm thức ăn
    const foodsSnapshot = await db.ref('Food').once('value');
    const foodsData = foodsSnapshot.val() || {};
    const foods = Object.keys(foodsData).map(key => ({
      id: key,
      foodName: foodsData[key].foodName,
      price: foodsData[key].price,
      imageUrl: foodsData[key].imageUrl,
      description: foodsData[key].description,
      category: foodsData[key].category,
    }));

    // Tìm kiếm thức uống
    const drinksSnapshot = await db.ref('FoodDrinks').once('value');
    const drinksData = drinksSnapshot.val() || {};
    const drinks = Object.keys(drinksData).map(key => ({
      id: key,
      name: drinksData[key].name,
      price: drinksData[key].price,
      imageUrl: drinksData[key].imageUrl,
      description: drinksData[key].description,
      isAvailable: drinksData[key].isAvailable,
    }));

    // Kết hợp kết quả tìm kiếm
    const searchResults = [
      ...foods.filter(item => item.foodName.toLowerCase().includes(query.toLowerCase())),
      ...drinks.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
    ];

    if (searchResults.length > 0) {
      res.json(searchResults);
    } else {
      res.status(404).json({ message: 'Không tìm thấy kết quả' });
    }
  } catch (error) {
    console.error('Lỗi khi tìm kiếm:', error);
    res.status(500).json({ error: 'Lỗi khi tìm kiếm' });
  }
});


// API để xóa sản phẩm khỏi giỏ hàng
app.delete('/api/cart/:userId/remove', async (req, res) => {
  const { userId } = req.params;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Thiếu ID sản phẩm để xóa' });
  }

  try {
    const cartRef = db.ref(`Cart/${userId}/items`);
    const snapshot = await cartRef.orderByChild('productId').equalTo(productId).once('value');

    if (snapshot.exists()) {
      let itemTotalPrice = 0;

      snapshot.forEach((childSnapshot) => {
        const item = childSnapshot.val();
        itemTotalPrice = parseFloat(item.totalPrice) || 0; // Đảm bảo `totalPrice` là số
        childSnapshot.ref.remove();
      });

      const cartTotalRef = db.ref(`Cart/${userId}/totalAmount`);
      const totalAmountSnapshot = await cartTotalRef.once('value');
      const existingTotal = totalAmountSnapshot.val() || 0;

      const updatedTotal = Math.max(existingTotal - itemTotalPrice, 0);
      await cartTotalRef.set(updatedTotal);

      res.json({ message: 'Sản phẩm đã được xóa', totalAmount: updatedTotal });
    } else {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi xóa sản phẩm' });
  }
});



// API để chỉnh sửa số lượng sản phẩm trong giỏ hàng
app.put('/api/cart/:userId/update', async (req, res) => {
  const { userId } = req.params;
  const { productId, newQuantity } = req.body;

  if (!productId || !newQuantity || newQuantity < 1) {
    return res.status(400).json({ error: 'Thiếu thông tin hoặc số lượng không hợp lệ' });
  }

  try {
    const cartRef = db.ref(`Cart/${userId}/items`);
    const snapshot = await cartRef.orderByChild('productId').equalTo(productId).once('value');

    if (snapshot.exists()) {
      let pricePerUnit = 0;
      let previousQuantity = 0;

      // Duyệt qua sản phẩm và cập nhật số lượng
      snapshot.forEach((childSnapshot) => {
        const item = childSnapshot.val();
        pricePerUnit = item.price || 0; // Đảm bảo giá không undefined
        previousQuantity = item.quantity || 0; // Đảm bảo số lượng cũ không undefined

        if (isNaN(pricePerUnit) || isNaN(newQuantity)) {
          throw new Error('Invalid price or quantity');
        }

        childSnapshot.ref.update({
          quantity: newQuantity,
          totalPrice: pricePerUnit * newQuantity,
        });
      });

      // Tính toán tổng tiền
      const cartTotalRef = db.ref(`Cart/${userId}/totalAmount`);
      const totalAmountSnapshot = await cartTotalRef.once('value');
      const existingTotal = totalAmountSnapshot.val() || 0; // Tổng tiền hiện tại

      // Tổng tiền thay đổi = giá đơn vị * (số lượng mới - số lượng cũ)
      const totalDifference = pricePerUnit * (newQuantity - previousQuantity);

      if (isNaN(existingTotal) || isNaN(totalDifference)) {
        throw new Error('Invalid total amount calculation');
      }

      const updatedTotal = Math.max(existingTotal + totalDifference, 0); // Đảm bảo tổng >= 0
      await cartTotalRef.set(updatedTotal);

      res.json({ message: 'Cập nhật số lượng thành công', totalAmount: updatedTotal });
    } else {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật số lượng:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật số lượng' });
  }
});



// Sử dụng các route từ router
app.use('/', router);

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Đã xảy ra lỗi!');
});

// Khởi động server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});