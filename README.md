# NovaCart — Full-Stack E-Commerce Web Application

NovaCart is a full-stack online store built with modern web standards, featuring complete product catalog management, persistent cart and checkout, real-time order tracking milestones, and role-based access control (Admin & User).

---

## 🌟 Key Features

### 🛍️ 1. Product Catalog & Discovery
- **Rich Product Catalog**: Product cards with high-resolution imagery, category badges, dynamic stock counters, and ratings.
- **Search & Category Filtering**: Instant search across titles and descriptions; filter by categories (*Electronics, Fashion, Home & Kitchen, Accessories*).
- **Sorting**: Sort products by newest arrivals, price (low-high, high-low), and top customer ratings.
- **Product Details Modal**: Modal view with specifications, warranty guarantees, stock warning, and direct quantity selector.

### 🛒 2. Add to Cart & Checkout Flow
- **Dual-Mode Cart**: Works seamlessly for both guest visitors and authenticated users.
- **Slide-out Cart Drawer**: Dynamic quantity increment/decrement, real-time item subtotal, tax (8%), and free shipping threshold calculation.
- **Checkout Modal**: Complete shipping address entry, contact information, and payment method selector (*Credit Card, PayPal / UPI, Cash on Delivery*).
- **Automatic Stock Reservation**: Product inventory automatically decrements upon completed checkout.

### 🚚 3. Real-Time Order Tracking & Management
- **Live Milestone Timeline**: Tracks progress across 4 stages:
  1. **Order Placed**: Verification & payment confirmation.
  2. **Processing & Packing**: Fulfillment center processing.
  3. **Dispatched & In Transit**: Courier handoff with carrier name and unique tracking code (e.g., `TRK87216391`).
  4. **Delivered**: Final destination handover.
- **Order History**: Customers can view past orders, review items purchased, view tracking timelines, and cancel processing orders.
- **Restocking on Cancellation**: Cancelling an order automatically returns quantities back to the product stock.

### 🔐 4. Role-Based Access Control (Admin / User)
- **Customer Role (`user`)**: Browse store, manage cart, place orders, view personal order history, and track shipments.
- **Administrator Role (`admin`)**: Access the dedicated **Admin Hub**:
  - **KPI Analytics**: Total Revenue, Total Orders, Active Catalog Items, Registered Customers.
  - **Order Management**: View orders across all customers; change status between `Pending`, `Processing`, `Shipped`, `Delivered`, and `Cancelled`.
  - **Product Catalog CRUD**: Create new products, modify price/description/stock, and remove products.
- **One-Click Demo Credentials**: Built into the Sign In dialog for quick testing without typing.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Fast, responsive modern UI |
| **Styling** | Tailwind CSS v4 | Clean, modern design system |
| **Icons** | Lucide React | High-quality UI icons |
| **Backend** | Node.js + Express 5 | RESTful APIs with route modularity |
| **Database** | SQLite (`better-sqlite3`) | Fast, zero-config local relational database with WAL mode |
| **Security** | JWT + bcryptjs | Encrypted passwords and stateless token authentication |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+) & npm

### Running the Application

1. **Start the Backend API Server**:
   ```bash
   npm run server
   ```
   *Runs at `http://localhost:5000` with auto-seeded demo catalog and users.*

2. **Start the Frontend Dev Server**:
   ```bash
   npm run client
   ```
   *Runs at `http://localhost:5173` with proxy configured to the backend API.*

---

## 🔑 Demo Accounts

Use these pre-configured accounts (or click the quick buttons inside the Sign In modal):

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@store.com` | `admin123` | Full Admin Hub, order status updates, catalog management |
| **Customer** | `user@store.com` | `user123` | Store shopping, checkout, personal order tracking |

---

## 📡 Backend API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Retrieve current authenticated profile

### Products
- `GET /api/products` — Filter, search, and list catalog items (`?search=`, `?category=`, `?sortBy=`, `?order=`)
- `GET /api/products/categories` — Distinct product categories
- `GET /api/products/:id` — Single product details
- `POST /api/products` — Create product *(Admin only)*
- `PUT /api/products/:id` — Update product *(Admin only)*
- `DELETE /api/products/:id` — Delete product *(Admin only)*

### Cart
- `GET /api/cart` — Get user's cart and calculated subtotal/tax/shipping
- `POST /api/cart` — Add product to cart or increment quantity
- `PUT /api/cart/:id` — Update cart item quantity
- `DELETE /api/cart/:id` — Remove item from cart
- `DELETE /api/cart` — Clear entire cart

### Orders & Tracking
- `POST /api/orders` — Place order, decrement inventory, generate tracking number
- `GET /api/orders` — User's order history
- `GET /api/orders/:id` — Track order with milestone timeline and package items
- `PUT /api/orders/:id/cancel` — Cancel order and restock items

### Admin
- `GET /api/admin/stats` — Revenue, order counts, product counts, inventory alerts
- `GET /api/admin/orders` — Full list of all orders from all customers
- `PUT /api/admin/orders/:id/status` — Update order delivery status
