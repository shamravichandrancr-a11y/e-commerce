# NovaCart — Default Account Credentials & Access Guide

This file contains the pre-configured default login credentials for both **Administrator** and **Customer** accounts, along with their role permissions and test data.

---

## 🔑 Login Accounts

### 1. Administrator Account (Admin Role)
- **Role:** `admin`
- **Email:** `admin@store.com`
- **Password:** `admin123`
- **Full Name:** `Admin Manager`
- **Privileges & Access:**
  - Full access to the **Admin Hub** navigation tab
  - View real-time store analytics: **Total Revenue, Total Orders, Active Catalog Items, Registered Customers**
  - **Order Management:** View all customer orders, change order delivery statuses (`Pending` ➔ `Processing` ➔ `Shipped` ➔ `Delivered` ➔ `Cancelled`)
  - **Product Management:** Add new products, update existing product prices, descriptions, and stock quantities, or delete products
  - View detailed delivery milestone tracking for any customer order

---

### 2. Customer Account (User Role)
- **Role:** `user`
- **Email:** `user@store.com`
- **Password:** `user123`
- **Full Name:** `Jane Customer`
- **Privileges & Access:**
  - Browse product catalog with search, category filtering, and sorting
  - Add items to shopping cart and modify quantities
  - Proceed to checkout with shipping address details and simulated payment methods
  - Access **My Orders** page to review past orders
  - Real-time shipment tracking with unique tracking code and milestone progress
  - Cancel pending/processing orders (automatically restocks product inventory)

---

## ⚡ Quick Testing Tips
1. In the web application ([http://localhost:5173](http://localhost:5173)), click **"Sign In"** in the top navigation bar.
2. In the modal, you can simply click either **"Admin Account"** or **"Customer Account"** under the **"Instant Test Accounts"** section to automatically fill the email and password fields.
3. You can also register any new customer account directly from the **"Register"** tab.

---

## 🗄️ Database Information
- **Database Engine:** SQLite (Local database file)
- **Database File:** `backend/ecommerce.db`
- **Password Encryption:** Hashed with `bcryptjs` (salt rounds: 10)
- **Authentication Method:** JSON Web Tokens (JWT)
