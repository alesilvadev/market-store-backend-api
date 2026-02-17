# Market Store Backend API

REST API for the Market Store self-ordering system. Built with Hono.js, TypeScript, and SQLite.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key configuration:
- `PORT=3000` - Server port
- `DATABASE_PATH=./data/market-store.db` - SQLite database location
- `JWT_SECRET` - Secret key for JWT tokens (change in production)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
- `TAX_RATE=0.21` - Tax rate for order calculations

### Development

```bash
npm run dev
```

Server will start on http://localhost:3000

### Build

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:coverage
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current authenticated user

### Products
- `GET /api/products` - List all active products (paginated)
- `GET /api/products/search?sku=CODE` - Search products by SKU
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `POST /api/orders` - Create new order (customer)
- `GET /api/orders/code/:code` - Get order by code (public)
- `GET /api/orders/:id` - Get order details (authenticated)
- `GET /api/orders` - List orders with filters (authenticated)
- `POST /api/orders/:id/complete` - Complete order (cashier)
- `PATCH /api/orders/:id/status` - Update order status (authenticated)

### Users
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user details (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Statistics
- `GET /api/stats/orders` - Get order statistics
- `GET /api/stats/top-products` - Get top selling products

### Import
- `POST /api/import/csv` - Import products from CSV (admin only)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Getting a Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "USR_...",
      "email": "user@example.com",
      "name": "User Name",
      "role": "CASHIER"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Using the Token

Include the token in the Authorization header:

```bash
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## 📊 Database Schema

### Users
- `id` - Unique identifier
- `email` - User email (unique)
- `password_hash` - Hashed password
- `name` - User full name
- `role` - ADMIN or CASHIER
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Products
- `id` - Unique identifier
- `sku` - Stock Keeping Unit (unique)
- `name` - Product name
- `description` - Product description
- `price` - Product price
- `color` - Optional product color
- `image_url` - Product image URL
- `is_active` - Active/inactive flag
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Orders
- `id` - Unique identifier
- `code` - Order code (unique, 8 chars alphanumeric)
- `status` - PENDING, PROCESSING, COMPLETED, CANCELLED
- `subtotal` - Sum of items before tax
- `tax` - Calculated tax amount
- `total` - Final order total
- `payment_method` - CASH, CARD, MOBILE_PAYMENT, OTHER
- `payment_status` - UNPAID, PAID, REFUNDED
- `created_at` - Creation timestamp
- `completed_at` - Completion timestamp
- `notes` - Optional notes

### Order Items
- `id` - Unique identifier
- `order_id` - Reference to order
- `product_id` - Reference to product
- `sku` - Product SKU snapshot
- `name` - Product name snapshot
- `quantity` - Item quantity
- `unit_price` - Price per unit
- `color` - Selected color

## 📝 API Response Format

All API responses follow a consistent format:

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
    "details": { /* validation errors or details */ }
  }
}
```

## 🧪 Examples

### Create an Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "sku": "PROD001",
        "quantity": 2,
        "color": "RED"
      },
      {
        "sku": "PROD002",
        "quantity": 1
      }
    ],
    "notes": "Customer request: No plastic bags"
  }'
```

### Complete an Order

```bash
curl -X POST http://localhost:3000/api/orders/ORD_123/complete \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "CASH",
    "notes": "Payment received"
  }'
```

### Import Products from CSV

```bash
curl -X POST http://localhost:3000/api/import/csv \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@products.csv"
```

CSV Format:
```
sku,name,price,description,color,imageUrl
PROD001,Product 1,10.50,Description,RED,http://example.com/image.jpg
PROD002,Product 2,20.00,Description,,
```

## 🔍 Development

### Code Structure

```
src/
├── db/              # Database initialization and setup
├── middleware/      # Authentication and error handling
├── routes/          # API route handlers
├── schemas/         # Zod validation schemas
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (JWT, password, logger)
└── index.ts         # Main application entry point
```

### Security Features

- ✅ Password hashing with bcryptjs (12 rounds)
- ✅ JWT authentication with expiration
- ✅ Input validation with Zod
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS protection
- ✅ Role-based access control (ADMIN, CASHIER)
- ✅ Rate limiting ready (not yet implemented)

### Performance Features

- ✅ Database indexes on frequently queried columns
- ✅ Efficient pagination
- ✅ Response caching ready (not yet implemented)
- ✅ Connection pooling (better-sqlite3)

## 🚀 Deployment

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=3000
DATABASE_PATH=/data/market-store.db
JWT_SECRET=<generate-long-random-string>
CORS_ORIGIN=https://customer.market-store.com,https://admin.market-store.com
TAX_RATE=0.21
```

### Running with Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## 📞 Support

For issues or questions, please contact the development team.

## 📄 License

MIT
