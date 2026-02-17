# Market Store Backend API - Complete Endpoint Documentation

## Base URL
`http://localhost:3000/api`

## Response Format

### Success Response (2xx)
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": { /* validation errors or additional info */ }
  }
}
```

## Authentication

All authenticated endpoints require the `Authorization` header:
```
Authorization: Bearer <JWT_TOKEN>
```

JWT tokens are obtained from the `/auth/login` endpoint and expire after 24 hours.

---

## AUTHENTICATION ENDPOINTS

### `POST /auth/login`
Login with email and password to get JWT token.

**Public endpoint** - No authentication required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Request Validation:**
- `email` (string, required) - Valid email address
- `password` (string, required) - At least 1 character

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "USR_abc123def456",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CASHIER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password"
  }
}
```

---

### `POST /auth/register`
Register a new user (admin only).

**Authentication:** Required (ADMIN role)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "name": "Jane Smith",
  "role": "CASHIER"
}
```

**Request Validation:**
- `email` (string, required) - Valid email address, must be unique
- `password` (string, required) - Minimum 8 characters
- `name` (string, optional) - Maximum 100 characters
- `role` (enum, optional) - ADMIN or CASHIER, defaults to CASHIER

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "USR_xyz789abc123",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "CASHIER",
    "createdAt": "2026-02-17T17:00:00.000Z",
    "updatedAt": "2026-02-17T17:00:00.000Z"
  }
}
```

---

### `GET /auth/me`
Get current authenticated user information.

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "USR_abc123def456",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CASHIER",
    "createdAt": "2026-02-17T17:00:00.000Z",
    "updatedAt": "2026-02-17T17:00:00.000Z"
  }
}
```

---

## PRODUCT ENDPOINTS

### `GET /products`
List all active products with pagination.

**Public endpoint** - No authentication required

**Query Parameters:**
- `page` (integer, optional) - Page number, defaults to 1
- `limit` (integer, optional) - Items per page (max 100), defaults to 20

**Request Example:**
```
GET /products?page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "PRD_abc123def456",
      "sku": "PROD001",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "color": "RED",
      "imageUrl": "https://example.com/image.jpg",
      "isActive": true,
      "createdAt": "2026-02-17T17:00:00.000Z",
      "updatedAt": "2026-02-17T17:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150
  }
}
```

---

### `GET /products/search?sku=CODE`
Search products by SKU (code printed on shelf).

**Public endpoint** - No authentication required

**Query Parameters:**
- `sku` (string, required) - Product SKU to search for

**Request Example:**
```
GET /products/search?sku=PROD001
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "PRD_abc123def456",
      "sku": "PROD001",
      "name": "Coca-Cola 2L",
      "description": "Classic Coca-Cola 2 liter bottle",
      "price": 4.99,
      "color": null,
      "imageUrl": "https://example.com/coke.jpg",
      "isActive": true,
      "createdAt": "2026-02-17T17:00:00.000Z",
      "updatedAt": "2026-02-17T17:00:00.000Z"
    }
  ]
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "SKU parameter is required"
  }
}
```

---

### `GET /products/:id`
Get product details by ID.

**Public endpoint** - No authentication required

**URL Parameters:**
- `id` (string, required) - Product ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "PRD_abc123def456",
    "sku": "PROD001",
    "name": "Product Name",
    "description": "Product description",
    "price": 29.99,
    "color": "RED",
    "imageUrl": "https://example.com/image.jpg",
    "isActive": true,
    "createdAt": "2026-02-17T17:00:00.000Z",
    "updatedAt": "2026-02-17T17:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "message": "Product not found"
  }
}
```

---

### `POST /products`
Create a new product (admin only).

**Authentication:** Required (ADMIN role)

**Request Body:**
```json
{
  "sku": "PROD002",
  "name": "New Product",
  "description": "Product description",
  "price": 19.99,
  "color": "BLUE",
  "imageUrl": "https://example.com/product.jpg",
  "isActive": true
}
```

**Request Validation:**
- `sku` (string, required) - Must be unique, max 50 chars
- `name` (string, required) - Required, max 200 chars
- `description` (string, optional) - Max 1000 chars
- `price` (number, required) - Positive number
- `color` (string, optional) - Max 50 chars
- `imageUrl` (string, optional) - Valid URL
- `isActive` (boolean, optional) - Defaults to true

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "PRD_new123abc456",
    "sku": "PROD002",
    "name": "New Product",
    "description": "Product description",
    "price": 19.99,
    "color": "BLUE",
    "imageUrl": "https://example.com/product.jpg",
    "isActive": true,
    "createdAt": "2026-02-17T17:00:00.000Z",
    "updatedAt": "2026-02-17T17:00:00.000Z"
  }
}
```

**Error Response (409):**
```json
{
  "success": false,
  "error": {
    "message": "Product with SKU PROD002 already exists"
  }
}
```

---

### `PUT /products/:id`
Update product details (admin only).

**Authentication:** Required (ADMIN role)

**URL Parameters:**
- `id` (string, required) - Product ID

**Request Body:** (all fields optional)
```json
{
  "sku": "PROD002",
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 24.99,
  "color": "GREEN",
  "imageUrl": "https://example.com/updated.jpg",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "PRD_abc123def456",
    "sku": "PROD002",
    "name": "Updated Product Name",
    "description": "Updated description",
    "price": 24.99,
    "color": "GREEN",
    "imageUrl": "https://example.com/updated.jpg",
    "isActive": true,
    "createdAt": "2026-02-17T17:00:00.000Z",
    "updatedAt": "2026-02-17T17:00:50.000Z"
  }
}
```

---

### `DELETE /products/:id`
Delete a product (admin only).

**Authentication:** Required (ADMIN role)

**URL Parameters:**
- `id` (string, required) - Product ID

**Response (200):**
```json
{
  "success": true
}
```

---

## ORDER ENDPOINTS

### `POST /orders`
Create a new order with items.

**Public endpoint** - No authentication required

**Request Body:**
```json
{
  "items": [
    {
      "productId": "PRD_abc123def456",
      "sku": "PROD001",
      "quantity": 2,
      "color": "RED"
    },
    {
      "productId": "PRD_xyz789abc123",
      "sku": "PROD002",
      "quantity": 1
    }
  ],
  "notes": "Customer request: No plastic bags"
}
```

**Request Validation:**
- `items` (array, required) - At least one item
  - `productId` (string, required) - Product ID
  - `sku` (string, required) - Product SKU
  - `quantity` (integer, required) - Greater than 0
  - `color` (string, optional) - Selected color
- `notes` (string, optional) - Max 500 chars

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ORD_abc123def456",
    "code": "ABC12345",
    "status": "PENDING",
    "subtotal": 70.00,
    "tax": 14.70,
    "total": 84.70,
    "paymentMethod": null,
    "paymentStatus": "UNPAID",
    "items": [
      {
        "id": "OIT_item001",
        "orderId": "ORD_abc123def456",
        "productId": "PRD_abc123def456",
        "sku": "PROD001",
        "name": "Product Name",
        "quantity": 2,
        "unitPrice": 29.99,
        "color": "RED",
        "createdAt": "2026-02-17T17:00:00.000Z"
      }
    ],
    "createdAt": "2026-02-17T17:00:00.000Z",
    "updatedAt": "2026-02-17T17:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "details": {
      "formErrors": {},
      "fieldErrors": {
        "items": ["Order must have at least one item"]
      }
    }
  }
}
```

---

### `GET /orders/code/:code`
Get order by customer-facing code (for customer verification).

**Public endpoint** - No authentication required

**URL Parameters:**
- `code` (string, required) - 8-character order code (e.g., "ABC12345")

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ORD_abc123def456",
    "code": "ABC12345",
    "status": "COMPLETED",
    "subtotal": 70.00,
    "tax": 14.70,
    "total": 84.70,
    "paymentMethod": "CASH",
    "paymentStatus": "PAID",
    "items": [
      {
        "id": "OIT_item001",
        "orderId": "ORD_abc123def456",
        "productId": "PRD_abc123def456",
        "sku": "PROD001",
        "name": "Product Name",
        "quantity": 2,
        "unitPrice": 29.99,
        "color": "RED",
        "createdAt": "2026-02-17T17:00:00.000Z"
      }
    ],
    "createdAt": "2026-02-17T17:00:00.000Z",
    "updatedAt": "2026-02-17T17:05:00.000Z",
    "completedAt": "2026-02-17T17:05:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "message": "Order not found"
  }
}
```

---

### `GET /orders/:id`
Get order details by ID (authenticated).

**Authentication:** Required

**URL Parameters:**
- `id` (string, required) - Order ID

**Response (200):** Same as `/orders/code/:code`

---

### `GET /orders`
List orders with optional filtering (authenticated).

**Authentication:** Required

**Query Parameters:**
- `page` (integer, optional) - Page number, defaults to 1
- `limit` (integer, optional) - Items per page (max 100), defaults to 20
- `status` (enum, optional) - Filter by status: PENDING, PROCESSING, COMPLETED, CANCELLED
- `startDate` (string, optional) - ISO 8601 datetime (e.g., 2026-02-17T00:00:00Z)
- `endDate` (string, optional) - ISO 8601 datetime

**Request Example:**
```
GET /orders?page=1&limit=20&status=COMPLETED&startDate=2026-02-01T00:00:00Z
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ORD_abc123def456",
      "code": "ABC12345",
      "status": "COMPLETED",
      "subtotal": 70.00,
      "tax": 14.70,
      "total": 84.70,
      "paymentMethod": "CASH",
      "paymentStatus": "PAID",
      "items": [ /* ... */ ],
      "createdAt": "2026-02-17T17:00:00.000Z",
      "updatedAt": "2026-02-17T17:05:00.000Z",
      "completedAt": "2026-02-17T17:05:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### `POST /orders/:id/complete`
Complete an order (mark as paid and finished).

**Authentication:** Required (CASHIER or ADMIN)

**URL Parameters:**
- `id` (string, required) - Order ID

**Request Body:**
```json
{
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "notes": "Payment received successfully"
}
```

**Request Validation:**
- `paymentMethod` (enum, required) - CASH, CARD, MOBILE_PAYMENT, OTHER
- `paymentStatus` (enum, optional) - UNPAID, PAID, REFUNDED, defaults to PAID
- `notes` (string, optional) - Max 500 chars

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ORD_abc123def456",
    "code": "ABC12345",
    "status": "COMPLETED",
    "subtotal": 70.00,
    "tax": 14.70,
    "total": 84.70,
    "paymentMethod": "CASH",
    "paymentStatus": "PAID",
    "items": [ /* ... */ ],
    "createdAt": "2026-02-17T17:00:00.000Z",
    "updatedAt": "2026-02-17T17:05:00.000Z",
    "completedAt": "2026-02-17T17:05:00.000Z",
    "notes": "Payment received successfully"
  }
}
```

---

### `PATCH /orders/:id/status`
Update order status (authenticated).

**Authentication:** Required

**URL Parameters:**
- `id` (string, required) - Order ID

**Request Body:**
```json
{
  "status": "PROCESSING",
  "notes": "Order is being prepared"
}
```

**Request Validation:**
- `status` (enum, required) - PENDING, PROCESSING, COMPLETED, CANCELLED
- `notes` (string, optional) - Max 500 chars

**Response (200):** Updated order object

---

## USER ENDPOINTS

### `GET /users`
List all users (admin only).

**Authentication:** Required (ADMIN role)

**Query Parameters:**
- `page` (integer, optional) - Page number, defaults to 1
- `limit` (integer, optional) - Items per page (max 100), defaults to 20

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "USR_abc123def456",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CASHIER",
      "createdAt": "2026-02-17T17:00:00.000Z",
      "updatedAt": "2026-02-17T17:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

---

### `GET /users/:id`
Get user details (admin only).

**Authentication:** Required (ADMIN role)

**URL Parameters:**
- `id` (string, required) - User ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "USR_abc123def456",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CASHIER",
    "createdAt": "2026-02-17T17:00:00.000Z",
    "updatedAt": "2026-02-17T17:00:00.000Z"
  }
}
```

---

### `POST /users`
Create a new user (admin only).

**Authentication:** Required (ADMIN role)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "name": "Jane Smith",
  "role": "CASHIER"
}
```

**Response (201):** User object

---

### `PUT /users/:id`
Update user (admin only).

**Authentication:** Required (ADMIN role)

**URL Parameters:**
- `id` (string, required) - User ID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

**Response (200):** Updated user object

---

### `DELETE /users/:id`
Delete a user (admin only).

**Authentication:** Required (ADMIN role)

**URL Parameters:**
- `id` (string, required) - User ID

**Response (200):**
```json
{
  "success": true
}
```

---

## STATISTICS ENDPOINTS

### `GET /stats/orders`
Get order statistics (authenticated).

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "completedOrders": 145,
    "pendingOrders": 5,
    "totalRevenue": 12450.75,
    "averageOrderValue": 85.90
  }
}
```

---

### `GET /stats/top-products`
Get top selling products (authenticated).

**Authentication:** Required

**Query Parameters:**
- `limit` (integer, optional) - Number of top products to return (max 100), defaults to 10

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "sku": "PROD001",
      "name": "Coca-Cola 2L",
      "total_quantity": 250,
      "order_count": 145,
      "total_revenue": 1247.50
    }
  ]
}
```

---

## IMPORT ENDPOINTS

### `POST /import/csv`
Import products from CSV file (admin only).

**Authentication:** Required (ADMIN role)

**Request:**
- Content-Type: multipart/form-data
- Field name: `file` (required) - CSV file

**CSV Format:**
```
sku,name,price,description,color,imageUrl
PROD001,Coca-Cola 2L,4.99,Classic Coca-Cola,BLACK,https://example.com/coke.jpg
PROD002,Sprite 2L,4.99,Lemon-lime soda,,https://example.com/sprite.jpg
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "importId": "IMP_abc123def456",
    "filename": "products.csv",
    "totalRows": 100,
    "successfulRows": 98,
    "failedRows": 2,
    "errors": [
      "Row 5: SKU is required",
      "Row 12: Price must be a positive number"
    ],
    "importedProducts": [
      {
        "sku": "PROD001",
        "name": "Coca-Cola 2L",
        "price": 4.99,
        "description": "Classic Coca-Cola",
        "color": "BLACK",
        "imageUrl": "https://example.com/coke.jpg"
      }
    ]
  }
}
```

---

## HTTP STATUS CODES

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET request, product found |
| 201 | Created | POST new product, new order created |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Product/Order doesn't exist |
| 409 | Conflict | Duplicate SKU, duplicate email |
| 500 | Server Error | Database error, internal server error |

---

## EXAMPLE WORKFLOWS

### Complete Customer Workflow

```bash
# 1. Customer searches for a product by SKU
curl http://localhost:3000/api/products/search?sku=PROD001

# 2. Customer creates an order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "sku": "PROD001",
        "quantity": 2,
        "color": "RED"
      }
    ]
  }'
# Response: Order with code "ABC12345"

# 3. Customer presents order code at checkout
curl http://localhost:3000/api/orders/code/ABC12345
```

### Complete Cashier Workflow

```bash
# 1. Cashier logs in
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cashier@example.com",
    "password": "password123"
  }'
# Response: Token "eyJ..."

# 2. Cashier retrieves order by code
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:3000/api/orders/code/ABC12345

# 3. Cashier completes order with payment
curl -X POST http://localhost:3000/api/orders/ORD_abc123/complete \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "CASH",
    "notes": "Payment received"
  }'
```

### Admin Workflow

```bash
# 1. Admin logs in
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin_password"
  }'

# 2. Admin imports products from CSV
curl -X POST http://localhost:3000/api/import/csv \
  -H "Authorization: Bearer eyJ..." \
  -F "file=@products.csv"

# 3. Admin views statistics
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:3000/api/stats/orders
```

---

## ERROR HANDLING

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "details": { /* optional: validation errors or additional info */ }
  }
}
```

### Validation Errors (400)
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "details": {
      "formErrors": {},
      "fieldErrors": {
        "email": ["Invalid email address"],
        "password": ["Password must be at least 8 characters"]
      }
    }
  }
}
```

### Authentication Errors (401)
```json
{
  "success": false,
  "error": {
    "message": "No token provided"
  }
}
```

### Permission Errors (403)
```json
{
  "success": false,
  "error": {
    "message": "Insufficient permissions"
  }
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "error": {
    "message": "Product not found"
  }
}
```

### Conflict Errors (409)
```json
{
  "success": false,
  "error": {
    "message": "Product with SKU PROD001 already exists"
  }
}
```

---

## SECURITY FEATURES

- ✅ **JWT Authentication**: Tokens expire after 24 hours
- ✅ **Password Hashing**: bcryptjs with 12 salt rounds
- ✅ **Input Validation**: Zod schema validation on all endpoints
- ✅ **SQL Injection Prevention**: Parameterized queries
- ✅ **CORS Protection**: Configured for specific origins
- ✅ **Role-Based Access Control**: ADMIN and CASHIER roles
- ✅ **Rate Limiting**: Ready for implementation
- ✅ **Error Messages**: No sensitive information leaked

---

## RATE LIMITS

Currently not implemented but recommended:
- 100 requests per 15 minutes for standard endpoints
- 5 requests per 15 minutes for login endpoint
- 10 requests per 15 minutes for CSV import

---

## PAGINATION

All list endpoints support pagination:
- Default page: 1
- Default limit: 20
- Maximum limit: 100

Example:
```
GET /products?page=2&limit=25
```

---

## SORTING & FILTERING

Orders endpoint supports filtering by:
- `status` - PENDING, PROCESSING, COMPLETED, CANCELLED
- `startDate` - ISO 8601 format (e.g., 2026-02-17T00:00:00Z)
- `endDate` - ISO 8601 format

Products endpoint supports:
- Active/inactive products (only active products returned by default)

---

## PERFORMANCE

- Database indexes on frequently queried columns
- Efficient pagination to prevent memory overload
- JSON response format for fast serialization
- Connection pooling with SQLite

---

## HEALTH CHECK

### `GET /health`
Check API health status.

**Public endpoint** - No authentication required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-02-17T17:00:00.000Z"
  }
}
```

---

**Last Updated:** February 17, 2026
**API Version:** 1.0.0
