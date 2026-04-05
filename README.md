# ✦ Luxe Library — Premium Library Management System

A full-stack MERN application with luxury UI, e-commerce cart, payment gateway, and complete admin panel.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB v7.0
- npm v9+

### 1. Start MongoDB
```bash
brew services start mongodb-community@7.0
```

### 2. Setup Server
```bash
cd server
npm install
npm install nodemailer razorpay   # Important!
# Edit .env with your Gmail App Password and Razorpay keys
npm run dev
```

### 3. Setup Client
```bash
cd client
npm install
npm start
```

### 4. Access
- Frontend: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
- API: http://localhost:5000/api

## 🔑 Default Admin
- Email: admin@library.com
- Password: admin123

## ⚙️ Environment Variables (server/.env)
```
MONGO_URI=mongodb://127.0.0.1:27017/library_luxury_db
PORT=5000
JWT_SECRET=library_super_secret_jwt_key_2024
JWT_EXPIRE=7d
EMAIL_USER=your.gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
ADMIN_EMAIL=your.gmail@gmail.com
CLIENT_URL=http://localhost:3000
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
```

## 📚 Tech Stack
- **Frontend**: React 18, React Router v6, Context API, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Auth**: JWT, bcryptjs
- **Email**: Nodemailer (Gmail)
- **Payment**: Razorpay

## ✨ Features
- JWT Authentication with role-based access (Admin/Member)
- Book catalog with 6 categories + search
- Add to cart with quantity controls
- Multi-step checkout (Card/UPI/COD via Razorpay)
- Order management with 7 status stages
- Cancel request workflow
- Email notifications (Order, Contact, Password Reset)
- Forgot/Reset Password via email
- Saved delivery addresses
- Admin panel with full management
- Dark/Light mode

© 2026 Luxe Library — Atmanand Saraswati Science College, Surat
