// seedDatabase.js
const db = require('./firebaseConfig');  // Import Firebase config

// Mảng chứa nhiều người dùng (bao gồm cả user và admin)
const users = [
  {
    userId: 'userId1',
    name: 'Nguyen Van A',
    email: 'nva@example.com',
    password: 'hashed_password_here',
    phone: '0987654321',
    address: '123 Ho Chi Minh, Vietnam',
    reservations: [],
    created_at: new Date().toISOString(),
    image_url: 'path/to/image1.jpg'
  },
  {
    userId: 'userId2',
    name: 'Le Thi B',
    email: 'ltb@example.com',
    password: 'hashed_password_here',
    phone: '0123456789',
    address: '456 Ha Noi, Vietnam',
    reservations: [],
    created_at: new Date().toISOString(),
    image_url: 'path/to/image2.jpg'
  },
  {
    userId: 'userId3',
    name: 'Tran Van C',
    email: 'tvc@example.com',
    password: 'hashed_password_here',
    phone: '0987654322',
    address: '789 Da Nang, Vietnam',
    reservations: [],
    created_at: new Date().toISOString(),
    image_url: 'path/to/image3.jpg'
  },
  {
    userId: 'userId4',
    name: 'Pham Thi D',
    email: 'ptd@example.com',
    password: 'hashed_password_here',
    phone: '0912345678',
    address: '111 Hai Phong, Vietnam',
    reservations: [],
    created_at: new Date().toISOString(),
    image_url: 'path/to/image4.jpg'
  },
  {
    userId: 'userId5',
    name: 'Do Van E',
    email: 'dve@example.com',
    password: 'hashed_password_here',
    phone: '0908765432',
    address: '222 Nha Trang, Vietnam',
    reservations: [],
    created_at: new Date().toISOString(),
    image_url: 'path/to/image5.jpg'
  }
];

// Hàm thêm nhiều người dùng vào Firebase
const addUsers = () => {
  users.forEach((user) => {
    const userRef = db.ref('Users/' + user.userId);

    userRef.set(user).then(() => {
      console.log(`User ${user.name} đã được thêm thành công!`);
    }).catch((error) => {
      console.error(`Lỗi khi thêm user ${user.name}:`, error);
    });
  });
};

// Gọi hàm để đổ dữ liệu
addUsers();

// Mảng chứa nhiều admin
const admins = [
  {
    adminId: 'admin1',
    name: 'Admin A',
    address: '123 Ho Chi Minh, Vietnam',
    phone: '0987654321',
    password: 'hashed_password_here',
    created_at: new Date().toISOString(),
    image_url: 'path/to/admin_image1.jpg'
  },
  {
    adminId: 'admin2',
    name: 'Admin B',
    address: '456 Ha Noi, Vietnam',
    phone: '0987654322',
    password: 'hashed_password_here',
    created_at: new Date().toISOString(),
    image_url: 'path/to/admin_image2.jpg'
  }
];

// Hàm thêm nhiều admin vào Firebase
const addAdmins = () => {
  admins.forEach((admin) => {
    const adminRef = db.ref('Admins/' + admin.adminId);

    adminRef.set(admin).then(() => {
      console.log(`Admin ${admin.name} đã được thêm thành công!`);
    }).catch((error) => {
      console.error(`Lỗi khi thêm admin ${admin.name}:`, error);
    });
  });
};

// Gọi hàm để đổ dữ liệu admin
addAdmins();

// Mảng chứa BookingTables
const bookingTables = [
  {
    customerID: 1,
    tableID: 101,
    bookingDate: new Date().toISOString(),
    expiredTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString() // Expired in 2 hours
  },
  {
    customerID: 2,
    tableID: 102,
    bookingDate: new Date().toISOString(),
    expiredTime: new Date(new Date().getTime() + 1 * 60 * 60 * 1000).toISOString() // Expired in 1 hour
  }
];

// Hàm thêm nhiều booking vào Firebase
const addBookingTables = () => {
  bookingTables.forEach((booking) => {
    const bookingRef = db.ref('BookingTables/' + booking.customerID + '_' + booking.tableID);

    bookingRef.set(booking).then(() => {
      console.log(`Booking for Customer ${booking.customerID} at Table ${booking.tableID} added successfully!`);
    }).catch((error) => {
      console.error(`Error adding booking for Customer ${booking.customerID}:`, error);
    });
  });
};

// Gọi hàm để đổ dữ liệu BookingTables
addBookingTables();

// Mảng chứa Employees
const employees = [
  {
    employeeID: 1,
    name: 'Nguyen Thi X',
    isFemale: true,
    dateOfBirth: new Date('1990-05-12').toISOString(),
    phoneNumber: '0901234567',
    address: '123 Ho Chi Minh, Vietnam',
    cmnd: '123456789012',
    email: 'ntx@example.com',
    username: 'ntx',
    password: 'hashed_password_here',
    hinAnh: 'path/to/employee_image1.jpg'
  },
  {
    employeeID: 2,
    name: 'Le Thi Y',
    isFemale: false,
    dateOfBirth: new Date('1985-08-22').toISOString(),
    phoneNumber: '0987654321',
    address: '456 Ha Noi, Vietnam',
    cmnd: '987654321098',
    email: 'lty@example.com',
    username: 'lty',
    password: 'hashed_password_here',
    hinAnh: 'path/to/employee_image2.jpg'
  }
];

// Hàm thêm nhiều employee vào Firebase
const addEmployees = () => {
  employees.forEach((employee) => {
    const employeeRef = db.ref('Employees/' + employee.employeeID);

    employeeRef.set(employee).then(() => {
      console.log(`Employee ${employee.name} added successfully!`);
    }).catch((error) => {
      console.error(`Error adding employee ${employee.name}:`, error);
    });
  });
};

// Gọi hàm để đổ dữ liệu Employees
addEmployees();

// Mảng chứa FoodDrinks
const foodDrinks = [
  {
    foodDrinkID: 1,
    name: 'Pho',
    imageURL: 'path/to/pho_image.jpg',
    description: 'Delicious Vietnamese noodle soup',
    isAvailable: true,
    price: 50.00
  },
  {
    foodDrinkID: 2,
    name: 'Coffee',
    imageURL: 'path/to/coffee_image.jpg',
    description: 'Rich and aromatic Vietnamese coffee',
    isAvailable: true,
    price: 25.00
  }
];

// Hàm thêm nhiều food drinks vào Firebase
const addFoodDrinks = () => {
  foodDrinks.forEach((foodDrink) => {
    const foodDrinkRef = db.ref('FoodDrinks/' + foodDrink.foodDrinkID);

    foodDrinkRef.set(foodDrink).then(() => {
      console.log(`FoodDrink ${foodDrink.name} added successfully!`);
    }).catch((error) => {
      console.error(`Error adding foodDrink ${foodDrink.name}:`, error);
    });
  });
};

// Gọi hàm để đổ dữ liệu FoodDrinks
addFoodDrinks();

// Mảng chứa Orders
const orders = [
  {
    orderID: 1,
    orderDate: new Date().toISOString(),
    isPaid: false,
    total: 125.00,
    customerID: 1,
    tableID: 101,
    employeeID: 1,
    status: "no",
    foodDrinkID: 1, // ID của món ăn/thức uống
    quantity: 2, // Số lượng món
    unitPrice: 50.00, // Giá mỗi món
    discount: 0, // Mức giảm giá (nếu có)
    tax: 10.00, // Thuế áp dụng
    description: 'Phở - Món súp phở Việt Nam' // Mô tả chi tiết
  },
  {
    orderID: 2,
    orderDate: new Date().toISOString(),
    isPaid: true,
    total: 150.00,
    customerID: 2,
    tableID: 102,
    employeeID: 2,
    status: "no",
    foodDrinkID: 2, // ID của món ăn/thức uống
    quantity: 1, // Số lượng món
    unitPrice: 50.00, // Giá mỗi món
    discount: 0, // Mức giảm giá (nếu có)
    tax: 5.00, // Thuế áp dụng
    description: 'Cà phê - Cà phê Việt Nam đậm đà' // Mô tả chi tiết
  }
];

// Hàm thêm nhiều orders vào Firebase
const addOrders = () => {
  orders.forEach((order) => {
    const orderRef = db.ref('Orders/' + order.orderID);

    orderRef.set(order).then(() => {
      console.log(`Order ${order.orderID} added successfully!`);
    }).catch((error) => {
      console.error(`Error adding order ${order.orderID}:`, error);
    });
  });
};

// Gọi hàm để đổ dữ liệu Orders
addOrders();

// Mảng chứa Tables
// Mảng chứa Tables
const tables = [
  {
    tableID: 101,
    tableName: 'Table 1',
    status: 1 // 1: Available, 0: Occupied
  },
  {
    tableID: 102,
    tableName: 'Table 2',
    status: 0 // 1: Available, 0: Occupied
  },
  {
    tableID: 103,
    tableName: 'Table 3',
    status: 1 // 1: Available, 0: Occupied
  }
];

// Hàm thêm nhiều table vào Firebase
const addTables = () => {
  tables.forEach((table) => {
    const tableRef = db.ref('Tables/' + table.tableID);

    tableRef.set(table).then(() => {
      console.log(`Table ${table.tableName} added successfully!`);
    }).catch((error) => {
      console.error(`Error adding table ${table.tableName}:`, error);
    });
  });
};

// Gọi hàm để đổ dữ liệu Tables
addTables();

// Mảng chứa Food
const foods = [
  {
    foodID: 1,
    foodName: 'Banh Mi',
    imageURL: 'path/to/banhmi_image.jpg',
    description: 'Vietnamese sandwich with fresh ingredients',
    price: 30.00
  },
  {
    foodID: 2,
    foodName: 'Goi Cuon',
    imageURL: 'OIP.jpg',
    description: 'Vietnamese spring rolls with shrimp and vegetables',
    price: 40.00
  },
  {
    foodID: 3,
    foodName: 'Com tam',
    imageURL: 'path/to/comtam_image.jpg',
    description: 'Broken rice with grilled pork',
    price: 55.00
  }
];

// Hàm thêm nhiều food vào Firebase
const addFoods = () => {
  foods.forEach((food) => {
    const foodRef = db.ref('Food/' + food.foodID);

    foodRef.set(food).then(() => {
      console.log(`Food ${food.foodName} added successfully!`);
    }).catch((error) => {
      console.error(`Error adding food ${food.foodName}:`, error);
    });
  });
};

// Gọi hàm để đổ dữ liệu Food
addFoods();

// Mảng chứa detailOrders với các trường đầy đủ

