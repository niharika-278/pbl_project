# Retail Inventory & Sales – API Reference

Base URL: `http://localhost:5000/api` (or your backend URL).

## Authentication

All protected endpoints require header: `Authorization: Bearer <token>`.

---

### POST /auth/login

Login and receive JWT.

**Body:**
```json
{
  "email": "admin@retail.com",
  "password": "Admin@123",
  "role": "admin"
}
```
`role` optional: `"admin"` | `"seller"`.

**Response:**
```json
{
  "success": true,
  "token": "eyJhbG...",
  "user": { "id": 1, "name": "Admin", "email": "admin@retail.com", "role": "admin" }
}
```

---

### POST /auth/forgot-password

Request password reset.

**Body:** `{ "email": "user@example.com" }`

**Response:** `{ "success": true, "message": "...", "resetLink": "..." }`

---

### POST /auth/reset-password

Set new password with token.

**Body:** `{ "token": "<reset-token>", "newPassword": "newpass" }`

**Response:** `{ "success": true, "message": "Password updated" }`

---

### GET /auth/me

Current user (protected).

**Response:** `{ "success": true, "user": { "id", "name", "email", "role" } }`

---

## Analytics (protected)

### GET /analytics/dashboard

Dashboard KPIs and chart data.

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalRevenue": 0,
      "totalOrders": 0,
      "activeCustomers": 0,
      "lowStockItems": 0,
      "expiredOrNearExpiry": 0
    },
    "popularCategories": [ { "name": "...", "total": 0 } ],
    "salesByDay": [ { "date": "YYYY-MM-DD", "amount": 0, "orders": 0 } ],
    "revenueTrend": [ { "date": "YYYY-MM-DD", "revenue": 0 } ]
  }
}
```

---

## Checkout (protected, admin/seller)

### GET /checkout/customers

List customers (limit 200).

**Response:** `{ "success": true, "data": [ { "id", "unique_id", "name", "phone", "email", "zip_code", "city", "state" } ] }`

### GET /checkout/customers/search?q=

Search customers by name, email, phone.

**Response:** `{ "success": true, "data": [ ... ] }`

### POST /checkout/customers

Create customer.

**Body:** `{ "name", "phone?", "email?", "zip_code?", "city?", "state?", "unique_id?" }`

**Response:** `{ "success": true, "data": { "id", ... } }`

### GET /checkout/products?q=

List/search products with stock for current seller.

**Response:** `{ "success": true, "data": [ { "id", "name", "price", "expiry_date", "category_name", "stock" } ] }`

### POST /checkout/orders

Place order (transactional: deduct stock, insert order + items).

**Body:**
```json
{
  "customerId": 1,
  "items": [ { "productId": 1, "quantity": 2 } ]
}
```

**Response:** `{ "success": true, "data": { "orderId": 1, "totalAmount": 99.99 } }`

---

## Data ingestion (protected, admin/seller)

All ingestion endpoints: `Content-Type: multipart/form-data`, field name: `file` (CSV).

### POST /ingestion/customers

Upload customers CSV. Columns: name (required), phone, email, unique_id, zip_code, city, state (or Zip-code, City, State).

**Response:** `{ "success": true, "summary": { "processed", "rejected", "cleaned", "total" }, "preview": [...] }`

### POST /ingestion/products

Upload products CSV. Columns: name (or product_name), category (or category_name, default "General"), price, expiry_date (optional). Creates categories by name and inserts products.

**Response:** `{ "success": true, "summary": { "processed", "rejected", "total" }, "preview": [...] }`

### POST /ingestion/inventory

Upload inventory CSV. Columns: product_id, stock. Upserts for current seller.

**Response:** `{ "success": true, "summary": { "processed", "rejected", "total" }, "preview": [...] }`

### POST /ingestion/sales

Upload sales CSV. Columns: customer_id, product_id, quantity, price?, order_id? (optional). Creates orders and deducts inventory.

**Response:** `{ "success": true, "summary": { "processed", "rejected", "total" } }`

---

## Health

### GET /api/health

**Response:** `{ "ok": true }`
