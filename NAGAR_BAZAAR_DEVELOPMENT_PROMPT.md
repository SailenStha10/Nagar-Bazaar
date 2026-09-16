# Nagar Bazaar – Integrated E-Commerce and E-Governance Platform
## Complete Development Prompt & Sprint Guide

**Project Type:** University Project  
**Status:** Development  
**Last Updated:** 2026  

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Setup Instructions](#project-setup-instructions)
4. [Sprint Planning & Tickets](#sprint-planning--tickets)
5. [How to Use This Document](#how-to-use-this-document)

---

## 🎯 Project Overview

### Vision
Nagar Bazaar is a unified platform that bridges e-commerce and e-governance for local markets. Citizens can purchase authentic local and grocery products while accessing government services like complaint management, seller verification, and market monitoring.

### Key Objectives
- ✅ Enable local sellers to reach wider customer bases
- ✅ Empower citizens with complaint and grievance mechanisms
- ✅ Provide government oversight tools for market regulation
- ✅ Showcase authentic Nepali/local products
- ✅ Create a transparent, trustworthy marketplace

### Target Users
1. **Customers/Citizens** – Browse, purchase, file complaints, view notices
2. **Sellers/Local Business** – Manage stores, products, orders, verification
3. **Government Officers** – Verify sellers, manage complaints, monitor markets, issue notices
4. **Admin** – System-wide management and analytics

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js with React.js
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts
- **Language:** JavaScript/JSX

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT
- **Encryption:** bcrypt
- **Environment:** .env files for configuration

### Key Libraries (To Install)
```
Frontend: axios, react-router-dom, zustand/context-api
Backend: jsonwebtoken, dotenv, cors, express-validator
```

---

## 🚀 Project Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB (local or Atlas)
- Git
- Code editor (VSCode recommended)

### Directory Structure
```
nagar-bazaar/
├── frontend/                  # Next.js frontend
│   ├── app/
│   ├── components/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   ├── hooks/
│   └── package.json
├── backend/                   # Express.js backend
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── utils/
│   ├── config/
│   ├── server.js
│   └── package.json
├── .gitignore
├── README.md
└── DEVELOPMENT.md (this file)
```

### Backend Setup

#### Step 1: Create Backend Directory
```bash
mkdir nagar-bazaar && cd nagar-bazaar
mkdir backend && cd backend
npm init -y
```

#### Step 2: Install Dependencies
```bash
npm install express mongoose jwt bcryptjs cors dotenv express-validator
npm install --save-dev nodemon
```

#### Step 3: Create .env File
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nagar_bazaar
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this
NODE_ENV=development
```

#### Step 4: Update package.json Scripts
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

#### Step 5: Create server.js
```javascript
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Routes (to be added in sprints)
app.use('/api/users', require('./routes/userRoutes'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Frontend Setup

#### Step 1: Create Frontend Directory (from nagar-bazaar root)
```bash
cd .. && npx create-next-app@latest frontend
# Select: TypeScript: No, ESLint: Yes, Tailwind: Yes, src/: No, App Router: Yes
cd frontend
```

#### Step 2: Install Additional Dependencies
```bash
npm install axios lucide-react recharts
```

#### Step 3: Configure Tailwind (next.config.js)
Tailwind should be configured automatically. Verify tailwind.config.js includes all content paths.

#### Step 4: Create .env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### Step 5: Create app/page.js
```javascript
export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen">
      <h1 className="text-4xl font-bold text-blue-600">Nagar Bazaar</h1>
    </div>
  );
}
```

### Running the Project

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:3000
```

---

## 📅 Sprint Planning & Tickets

### How to Work Through Sprints
1. **Read the sprint overview** to understand the goals
2. **Follow each ticket sequentially** - tickets in one sprint often depend on previous ones
3. **Complete the ticket requirements** as listed
4. **Test the implementation** with provided test cases
5. **Mark ticket as complete** and move to next
6. **At sprint end**, request a summary from the AI tool
7. **Review the summary**, then say "continue" to move to next sprint

---

---

# SPRINT 1: Project Setup & Base Infrastructure

**Duration:** 2-3 days  
**Goal:** Establish project foundations, database models, and basic API structure

## Ticket 1.1: Database Schema & Models

### Description
Create MongoDB Mongoose models for all core collections. These form the foundation for all features.

### Requirements
Create files in `backend/models/`:

#### 1. User Model (`models/User.js`)
```javascript
Fields:
- _id (ObjectID, auto)
- name (String, required)
- email (String, required, unique)
- password (String, hashed)
- phone (String)
- address (String)
- role (Enum: 'customer', 'seller', 'officer', 'admin')
- createdAt (Date, default: now)
- updatedAt (Date)
- isActive (Boolean, default: true)
```

#### 2. Seller Model (`models/Seller.js`)
```javascript
Fields:
- _id (ObjectID, auto)
- userId (Reference to User, required)
- shopName (String, required)
- description (Text)
- location (String)
- contact (String)
- bankDetails (Object)
- verificationStatus (Enum: 'pending', 'approved', 'rejected', 'review_required')
- verifiedBy (Reference to GovernmentOfficer)
- verificationDate (Date)
- banner (String, image URL)
- ratings (Number, default: 0)
- totalOrders (Number, default: 0)
- createdAt (Date)
```

#### 3. Category Model (`models/Category.js`)
```javascript
Fields:
- _id (ObjectID, auto)
- name (String, required, unique)
- description (String)
- icon (String, emoji or icon name)
- image (String, image URL)
- isActive (Boolean, default: true)
```

#### 4. Product Model (`models/Product.js`)
```javascript
Fields:
- _id (ObjectID, auto)
- sellerId (Reference to Seller, required)
- categoryId (Reference to Category, required)
- name (String, required)
- description (Text)
- price (Number, required)
- stock (Number, required)
- image (String, image URL)
- isLocal (Boolean, default: false)
- localProductDetails (Object: producer, location)
- ratings (Array of ratings)
- averageRating (Number)
- createdAt (Date)
- updatedAt (Date)
```

#### 5. Cart & CartItem Models (`models/Cart.js`, `models/CartItem.js`)
```javascript
Cart Fields:
- _id (ObjectID, auto)
- userId (Reference to User, required)
- items (Array of CartItem references)
- totalPrice (Number)
- updatedAt (Date)

CartItem Fields:
- _id (ObjectID, auto)
- cartId (Reference to Cart)
- productId (Reference to Product)
- quantity (Number)
- price (Number at time of adding)
```

#### 6. Order & OrderItem Models (`models/Order.js`, `models/OrderItem.js`)
```javascript
Order Fields:
- _id (ObjectID, auto)
- userId (Reference to User, required)
- orderNumber (String, unique)
- items (Array of OrderItem references)
- totalAmount (Number)
- paymentMethod (Enum: 'cod', 'online')
- paymentStatus (Enum: 'pending', 'completed', 'failed')
- orderStatus (Enum: 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled')
- deliveryAddress (String)
- createdAt (Date)
- deliveredAt (Date)

OrderItem Fields:
- _id (ObjectID, auto)
- orderId (Reference to Order)
- productId (Reference to Product)
- quantity (Number)
- price (Number at time of order)
- sellerId (Reference to Seller)
```

#### 7. Complaint Model (`models/Complaint.js`)
```javascript
Fields:
- _id (ObjectID, auto)
- complaintNumber (String, unique)
- userId (Reference to User)
- sellerId (Reference to Seller)
- productId (Reference to Product, optional)
- category (Enum: 'overpricing', 'expired_product', 'quality_issue', 'misleading_info', 'seller_issue', 'other')
- title (String, required)
- description (Text, required)
- attachments (Array of URLs, optional)
- status (Enum: 'submitted', 'under_review', 'in_progress', 'resolved')
- assignedOfficer (Reference to GovernmentOfficer, optional)
- officerRemarks (Text, optional)
- resolution (Text, optional)
- createdAt (Date)
- resolvedAt (Date)
```

#### 8. GovernmentOfficer Model (`models/GovernmentOfficer.js`)
```javascript
Fields:
- _id (ObjectID, auto)
- userId (Reference to User, required)
- department (String)
- designation (String)
- officeLocation (String)
- verificationLimit (Number, complaints assigned limit)
- createdAt (Date)
```

#### 9. GovernmentNotice Model (`models/GovernmentNotice.js`)
```javascript
Fields:
- _id (ObjectID, auto)
- title (String, required)
- content (Text, required)
- category (Enum: 'market_info', 'consumer_awareness', 'public_notice', 'regulations', 'price_info')
- issuedBy (Reference to GovernmentOfficer)
- publishedAt (Date)
- archiveAt (Date, optional)
- isArchived (Boolean, default: false)
- priority (Enum: 'low', 'medium', 'high')
```

#### 10. MarketPrice Model (`models/MarketPrice.js`)
```javascript
Fields:
- _id (ObjectID, auto)
- productId (Reference to Product)
- sellerId (Reference to Seller)
- price (Number)
- averageMarketPrice (Number)
- status (Enum: 'normal', 'review_required')
- lastUpdated (Date)
- monitoredBy (Reference to GovernmentOfficer, optional)
```

#### 11. Review Model (`models/Review.js`)
```javascript
Fields:
- _id (ObjectID, auto)
- productId (Reference to Product, required)
- userId (Reference to User, required)
- rating (Number, 1-5)
- comment (Text)
- createdAt (Date)
```

### Test Cases
- [ ] All models created without errors
- [ ] Models have proper validation (required fields, data types)
- [ ] Relationships/references are properly defined
- [ ] Models can be imported without errors

---

## Ticket 1.2: Authentication Middleware & Utilities

### Description
Create authentication utilities for JWT token handling and middleware for protected routes.

### Requirements

#### Create `backend/utils/auth.js`
```javascript
Functions needed:
1. generateToken(userId, role) - generates JWT token
2. verifyToken(token) - verifies JWT token
3. hashPassword(password) - hashes password with bcrypt
4. comparePasswords(password, hashedPassword) - compares passwords
```

#### Create `backend/middleware/auth.js`
```javascript
Middleware functions:
1. protect - checks for valid JWT token in headers
2. authorize(roles) - checks if user has required role
   Example: authorize(['customer', 'seller'])
```

### Implementation Details
- JWT should expire in 7 days
- Password hashing should use bcrypt with salt rounds of 10
- Token should contain userId and role
- Protected routes should extract user from token

### Test Cases
- [ ] generateToken creates a valid JWT
- [ ] verifyToken correctly validates tokens
- [ ] hashPassword hashes passwords securely
- [ ] comparePasswords correctly validates passwords
- [ ] protect middleware blocks requests without token
- [ ] authorize middleware blocks unauthorized roles

---

## Ticket 1.3: User Registration & Login API Routes

### Description
Create authentication endpoints for user registration and login.

### Requirements

#### Create `backend/routes/authRoutes.js`

**POST /api/auth/register**
```
Request body:
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "role": "customer" | "seller"
}

Response (200):
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": { userId, name, email, role }
}

Errors (400, 409):
- Email already exists
- Invalid email format
- Password too weak
- Missing required fields
```

**POST /api/auth/login**
```
Request body:
{
  "email": "string",
  "password": "string"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token",
  "user": { userId, name, email, role }
}

Errors (401, 404):
- User not found
- Invalid password
- Account inactive
```

**GET /api/auth/profile**
```
Headers: Authorization: Bearer token
Response (200):
{
  "success": true,
  "user": { full user object }
}

Errors (401):
- Unauthorized
```

### Validation
- Email: valid email format, unique
- Password: minimum 8 characters
- Name: minimum 2 characters
- Phone: valid phone format

### Test Cases
- [ ] User can register with valid data
- [ ] Duplicate email rejected
- [ ] Invalid email rejected
- [ ] Weak password rejected
- [ ] User can login with correct credentials
- [ ] Invalid credentials rejected
- [ ] Protected endpoint returns user profile
- [ ] Token expiration works

---

## Ticket 1.4: Basic Frontend Setup & Navigation

### Description
Create basic frontend structure with navigation and routing.

### Requirements

#### Create `frontend/components/Navbar.jsx`
```javascript
Features:
- Logo and branding
- Navigation links (Home, Products, Stores, Notices)
- Auth links (Login/Register when logged out)
- User menu with dropdown (when logged in)
- Responsive hamburger menu for mobile
- Colors: Primary Navy (#12355B), Text (#172033)
```

#### Create `frontend/components/Footer.jsx`
```javascript
Sections:
- About
- Quick Links
- Contact Info
- Social Links
- Copyright notice
```

#### Create `frontend/app/layout.js`
```javascript
- Import Navbar and Footer
- Set up Tailwind CSS configuration
- Configure metadata
```

#### Create `frontend/app/page.js` (Homepage)
```javascript
Sections:
1. Hero section with CTA buttons
2. Featured products grid (mock data)
3. Featured sellers section
4. Local products showcase
5. Key features section
6. Call-to-action for government services
```

#### Create `frontend/app/login/page.js`
```javascript
Form with:
- Email input
- Password input
- Remember me checkbox
- Login button
- Link to register
- Form validation and error display
```

#### Create `frontend/app/register/page.js`
```javascript
Form with:
- Name input
- Email input
- Password input
- Confirm password
- Phone input
- Role selection (Customer/Seller)
- Terms checkbox
- Register button
- Link to login

Functionality:
- Client-side validation
- Display errors
- Redirect to dashboard on success
```

#### Create `frontend/hooks/useAuth.js`
```javascript
Custom hook that provides:
- login(email, password) function
- register(data) function
- logout() function
- getCurrentUser() function
- Loading and error states
```

#### Create Context/State Management
```javascript
Use Context API to store:
- Current user
- Auth token
- Loading state
```

### Test Cases
- [ ] Navbar displays correctly on desktop and mobile
- [ ] Navigation links work
- [ ] Login form validates input
- [ ] Register form validates input
- [ ] Auth token stored after login
- [ ] User redirected to dashboard after auth
- [ ] Footer displays on all pages
- [ ] Responsive design works on mobile

---

## Sprint 1 Completion

Once all tickets 1.1-1.4 are complete:

### ✅ Sprint 1 Summary
**Completed:**
- Database schema with all 11 collections defined
- Authentication utilities and middleware implemented
- User registration and login APIs functional
- Basic frontend structure with navigation and auth pages
- Responsive design foundation established

**Database Collections:** Users, Sellers, Categories, Products, Carts, CartItems, Orders, OrderItems, Complaints, GovernmentOfficers, GovernmentNotices

**Backend Routes:** /api/auth/register, /api/auth/login, /api/auth/profile

**Frontend Pages:** /, /login, /register, plus Navbar and Footer components

**Next Sprint:** Customer e-commerce features (products, search, cart)

---

---

# SPRINT 2: E-Commerce Foundation – Products & Search

**Duration:** 3-4 days  
**Goal:** Implement product browsing, searching, filtering, and detailed product views

## Ticket 2.1: Product API Routes & Listing

### Description
Create backend APIs for product management and create frontend product listing pages.

### Requirements

#### Backend: `backend/routes/productRoutes.js`

**GET /api/products**
```
Query params:
- page (default: 1)
- limit (default: 12)
- category (optional)
- sortBy (name, price, rating - default: name)
- sortOrder (asc, desc)

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Basmati Rice",
      "price": 450,
      "image": "...",
      "ratings": 4.5,
      "stock": 50,
      "isLocal": false,
      "seller": { name, shopName }
    }
  ],
  "pagination": { page, limit, total, pages }
}
```

**GET /api/products/:id**
```
Response (200):
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Gundruk",
    "description": "...",
    "price": 180,
    "stock": 100,
    "image": "...",
    "category": { name, icon },
    "seller": { full seller details },
    "ratings": 4.8,
    "reviews": [ { user, rating, comment, date } ],
    "isLocal": true,
    "localProductDetails": { producer, location }
  }
}
```

**GET /api/products/search**
```
Query params:
- q (search term)
- category (optional)
- minPrice (optional)
- maxPrice (optional)
- inStock (optional, boolean)

Response: Same as GET /api/products
```

### Test Cases
- [ ] GET /api/products returns paginated list
- [ ] Products sorted correctly by price and rating
- [ ] Search filters work correctly
- [ ] Out of stock products handled
- [ ] Seller information included
- [ ] Pagination works

---

## Ticket 2.2: Frontend Product Listing & Search

### Description
Create product listing page with search and filter functionality.

### Requirements

#### Create `frontend/app/products/page.js`
```javascript
Features:
1. Product grid layout (3-4 columns on desktop, 1-2 on mobile)
2. Product cards showing:
   - Image
   - Product name
   - Price (in NPR)
   - Rating and review count
   - Stock status
   - Local product badge (if applicable)
   - "Add to Cart" button
   - "View Details" link

3. Sidebar with filters:
   - Category dropdown (fetched from API)
   - Price range slider (0-5000 NPR)
   - Sort options (Latest, Price Low-High, Price High-Low, Rating)
   - Stock filter (In Stock Only)

4. Search bar at top with real-time search

5. Pagination buttons at bottom

6. Empty state message when no products found

7. Loading skeleton while fetching
```

#### Create `frontend/components/ProductCard.jsx`
```javascript
Props:
- product (object)
- onAddToCart (function)
- onViewDetails (function)

Display:
- Product image
- Product name
- Price
- Seller name
- Rating
- Stock status
- Local badge (conditionally)
- Buttons
```

#### Create `frontend/app/products/[id]/page.js`
```javascript
Features:
1. Large product image
2. Product details:
   - Name and description
   - Price
   - Stock status
   - Category
   - Rating and review count
   - Seller information with link
   - Local product details (if applicable)

3. Add to Cart button with quantity selector

4. Reviews section:
   - List of reviews
   - Star rating display
   - Review date
   - Reviewer name

5. Related products section (products from same seller)

6. Breadcrumb navigation

7. Loading and error states
```

### Test Cases
- [ ] Products load on initial page load
- [ ] Filters work correctly
- [ ] Search returns correct results
- [ ] Pagination works
- [ ] Product details page loads correctly
- [ ] Images load without errors
- [ ] Responsive on mobile, tablet, desktop
- [ ] Add to cart button available
- [ ] Loading states display
- [ ] Error states display

---

## Ticket 2.3: Category Management (Backend)

### Description
Create backend APIs for product categories.

### Requirements

#### Backend: `backend/routes/categoryRoutes.js`

**GET /api/categories**
```
Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Grocery",
      "icon": "🛒",
      "image": "...",
      "description": "..."
    }
  ]
}
```

**POST /api/categories** (Admin only)
```
Request body:
{
  "name": "string",
  "description": "string",
  "icon": "string",
  "image": "string (URL)"
}
```

### Mock Data Setup
Create 7 categories:
1. Grocery
2. Fruits & Vegetables
3. Dairy
4. Beverages
5. Household Items
6. Organic Products
7. Local Products

### Test Cases
- [ ] Categories endpoint returns all categories
- [ ] Mock data is properly seeded
- [ ] Category icons display
- [ ] No errors on category fetch

---

## Ticket 2.4: Mock Data Seeding

### Description
Create and seed realistic mock data into MongoDB.

### Requirements

#### Create `backend/utils/seedDatabase.js`
```javascript
Seed the following:
1. Categories (7 categories as listed above)
2. Users (4 sellers, 5 customers)
3. Sellers (4 sellers with profiles)
4. Products (30+ products across categories)
5. Reviews (10-15 reviews for various products)
6. GovernmentNotices (5 notices)
7. MarketPrices (for products with seller prices)

Sellers to create:
- Kathmandu Fresh Mart
- Valley Grocery Store
- Local Harvest Nepal
- Himalayan Organics

Sample products:
- Basmati Rice (500g) - Grocery
- Potato (1kg) - Vegetables
- Tomato (500g) - Vegetables
- Milk (500ml) - Dairy
- Honey (250g) - Organic
- Gundruk (250g) - Local Products
- Mustard Oil (500ml) - Local Products
- Local Pickle (300g) - Local Products
- Nepali Tea (100g) - Beverages

Use realistic Nepal prices in NPR
```

#### Create `backend/routes/seedRoutes.js`
```
POST /api/seed/initialize
- Runs seedDatabase.js
- Returns: success message with counts of created records
- Only accessible in development mode
```

### Test Cases
- [ ] Seed script runs without errors
- [ ] Correct number of records created
- [ ] Sellers have products
- [ ] Products have categories
- [ ] Prices are realistic
- [ ] Images are valid URLs

---

## Ticket 2.5: Local Products Section (Frontend)

### Description
Create dedicated section for authentic Nepali/local products.

### Requirements

#### Create `frontend/app/local-products/page.js`
```javascript
Features:
1. Hero section highlighting local products
2. Filtered product grid showing only isLocal: true products
3. For each local product, display:
   - Product image
   - Product name
   - Producer name
   - Location
   - Price
   - "Local Product" badge
   - Star rating
   - Seller name
   - "View Details" and "Add to Cart" buttons

4. Filter options:
   - By location
   - By producer (if available)
   - Price range

5. About Local Products section (informational)

6. Sort options (Price, Rating, Latest)
```

### Test Cases
- [ ] Only local products display
- [ ] Local badge visible
- [ ] Producer and location information displayed
- [ ] Filters work correctly
- [ ] Responsive layout

---

## Sprint 2 Completion

Once all tickets 2.1-2.5 are complete:

### ✅ Sprint 2 Summary
**Completed:**
- Product listing API with search and filter
- Product details API
- Product search endpoint
- Category management API
- Mock data seeding script
- Frontend product listing page with filters
- Frontend product details page
- Local products dedicated page
- Product cards component
- Search functionality

**Backend Routes:** /api/products, /api/products/:id, /api/products/search, /api/categories, /api/seed/initialize

**Frontend Pages:** /products, /products/[id], /local-products

**Features Working:**
- Browse products with pagination
- Search and filter products
- View product details and reviews
- Local product showcase
- Category browsing

**Next Sprint:** Shopping cart and checkout functionality

---

---

# SPRINT 3: Shopping Cart & Checkout

**Duration:** 3-4 days  
**Goal:** Implement cart management and order checkout flow

## Ticket 3.1: Cart API Routes

### Description
Create backend APIs for cart management (CRUD operations).

### Requirements

#### Backend: `backend/routes/cartRoutes.js`

**GET /api/cart** (Protected)
```
Headers: Authorization: Bearer token

Response (200):
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "items": [
      {
        "cartItemId": "...",
        "product": { _id, name, price, image, stock },
        "quantity": 2,
        "subtotal": 900
      }
    ],
    "totalItems": 3,
    "totalPrice": 2500
  }
}
```

**POST /api/cart/add** (Protected)
```
Request body:
{
  "productId": "string",
  "quantity": number
}

Response (200/201):
{
  "success": true,
  "message": "Product added to cart",
  "data": { cart object }
}

Errors (400, 404):
- Product not found
- Invalid quantity
- Out of stock
```

**PUT /api/cart/item/:itemId** (Protected)
```
Request body:
{
  "quantity": number
}

Response (200):
{
  "success": true,
  "message": "Cart item updated",
  "data": { cart object }
}
```

**DELETE /api/cart/item/:itemId** (Protected)
```
Response (200):
{
  "success": true,
  "message": "Item removed from cart",
  "data": { cart object }
}
```

**DELETE /api/cart/clear** (Protected)
```
Response (200):
{
  "success": true,
  "message": "Cart cleared"
}
```

### Logic
- If product already in cart, increase quantity
- Check stock availability
- Calculate totals automatically
- Each user has only one cart
- Remove cart item if quantity becomes 0

### Test Cases
- [ ] Product added to cart successfully
- [ ] Quantity updated correctly
- [ ] Out of stock prevented
- [ ] Cart total calculated correctly
- [ ] Item removed from cart
- [ ] Cart cleared
- [ ] Protected endpoints require auth

---

## Ticket 3.2: Frontend Cart Page & Component

### Description
Create cart page and cart management functionality on frontend.

### Requirements

#### Create `frontend/hooks/useCart.js`
```javascript
Functions:
- getCart() - fetch cart from API
- addToCart(productId, quantity)
- updateQuantity(itemId, quantity)
- removeItem(itemId)
- clearCart()
- All with loading and error states
```

#### Create `frontend/app/customer/cart/page.js`
```javascript
Features:
1. Cart items table/list showing:
   - Product image
   - Product name
   - Seller name
   - Price per unit
   - Quantity selector (with +/- buttons)
   - Subtotal
   - Remove button

2. Cart summary sidebar:
   - Subtotal
   - Taxes (if applicable)
   - Delivery fee
   - Total price
   - Proceed to Checkout button
   - Continue Shopping button

3. Empty cart state:
   - Message
   - Link to products page

4. Loading state with skeleton

5. Responsive layout (table on desktop, list on mobile)

6. Quantity change updates immediately

7. Swipe to remove on mobile (optional enhancement)
```

#### Create `frontend/components/CartSummary.jsx`
```javascript
Displays:
- Subtotal
- Taxes
- Delivery fee
- Total
- Checkout button
- Continue shopping link
```

### Features
- Real-time cart updates
- Quantity validation (can't exceed stock)
- Remove items with confirmation
- Persist cart state
- Update page title with cart count

### Test Cases
- [ ] Cart loads from API
- [ ] Add to cart works from products page
- [ ] Quantity can be updated
- [ ] Cart total calculated correctly
- [ ] Remove item works
- [ ] Clear cart works
- [ ] Empty cart message displays
- [ ] Cart count displays in navbar
- [ ] Mobile layout responsive

---

## Ticket 3.3: Checkout & Order Creation API

### Description
Create checkout process and order creation endpoints.

### Requirements

#### Backend: `backend/routes/orderRoutes.js`

**POST /api/orders/checkout** (Protected)
```
Request body:
{
  "deliveryAddress": "string",
  "paymentMethod": "cod" | "online",
  "items": [
    {
      "productId": "string",
      "quantity": number,
      "price": number
    }
  ]
}

Response (201):
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "...",
    "orderNumber": "NG-2024-00001",
    "totalAmount": 5000,
    "paymentMethod": "cod",
    "paymentStatus": "pending",
    "orderStatus": "placed",
    "items": [ items with seller info ],
    "createdAt": "..."
  }
}

Validations:
- Cart not empty
- All products in stock
- Valid delivery address
```

**GET /api/orders** (Protected - customer)
```
Response:
{
  "success": true,
  "data": [
    {
      "orderId": "...",
      "orderNumber": "...",
      "totalAmount": 5000,
      "orderStatus": "placed",
      "createdAt": "...",
      "itemCount": 3
    }
  ]
}
```

**GET /api/orders/:orderId** (Protected)
```
Response:
{
  "success": true,
  "data": {
    "orderNumber": "NG-2024-00001",
    "totalAmount": 5000,
    "orderStatus": "placed",
    "paymentMethod": "cod",
    "paymentStatus": "pending",
    "deliveryAddress": "...",
    "items": [
      {
        "product": { name, price, image },
        "quantity": 2,
        "seller": { shopName, contact }
      }
    ],
    "timeline": [
      { status: "placed", timestamp: "..." }
    ],
    "createdAt": "...",
    "estimatedDelivery": "..."
  }
}
```

### Business Logic
- Generate unique order number (NG-YYYY-00XXX format)
- Clear cart after order
- Create OrderItems for each product
- Set payment status to pending for COD
- Set initial status to "placed"
- Calculate estimated delivery (3-5 days)
- Send confirmation email (mock)

### Test Cases
- [ ] Order created successfully
- [ ] Order number generated correctly
- [ ] Cart cleared after order
- [ ] OrderItems created for each product
- [ ] Order retrieval works
- [ ] Orders list returns paginated results

---

## Ticket 3.4: Checkout Page (Frontend)

### Description
Create checkout page with order confirmation.

### Requirements

#### Create `frontend/app/customer/checkout/page.js`
```javascript
Sections:
1. Order Summary:
   - List items from cart
   - Subtotal
   - Delivery fee
   - Total amount

2. Delivery Information:
   - Address input/selection
   - Phone number
   - Delivery date estimation

3. Payment Method Selection:
   - Cash on Delivery (COD) radio button
   - Online Payment radio button (demo)
   - Payment details conditional render

4. Order Review:
   - Summary before placing
   - All details editable

5. Place Order Button:
   - Confirmation dialog
   - Loading state during submission

6. Validation:
   - Address required
   - Phone required
   - Method required
```

#### Create `frontend/app/customer/order-confirmation/[id]/page.js`
```javascript
Displays after order placed:
- Order number (NG-2024-XXXXX)
- Success message
- Order summary
- Items list
- Estimated delivery date
- Payment method
- Next steps message
- Track Order button
- Continue Shopping button
```

### Features
- Address validation
- Real-time price calculation
- Order review before submission
- Confirmation modal
- Success page redirect
- Order details pre-filled from user profile

### Test Cases
- [ ] Checkout page loads with cart items
- [ ] Address validation works
- [ ] Payment method selection works
- [ ] Order placed successfully
- [ ] Confirmation page displays
- [ ] Order number correct format
- [ ] Cart cleared after order
- [ ] Responsive layout

---

## Ticket 3.5: Order Tracking (Frontend & Backend)

### Description
Create order tracking functionality.

### Requirements

#### Backend: `backend/routes/orderRoutes.js`
Add new endpoint:

**GET /api/orders/:orderId/track** (Protected)
```
Response:
{
  "success": true,
  "data": {
    "orderNumber": "NG-2024-00001",
    "timeline": [
      {
        "status": "placed",
        "timestamp": "2024-01-15T10:30:00Z",
        "label": "Order Placed"
      },
      {
        "status": "confirmed",
        "timestamp": "2024-01-15T11:00:00Z",
        "label": "Order Confirmed"
      },
      {
        "status": "shipped",
        "timestamp": null,
        "label": "Shipped (Pending)"
      },
      {
        "status": "delivered",
        "timestamp": null,
        "label": "Delivery (Pending)"
      }
    ],
    "currentStatus": "confirmed",
    "estimatedDelivery": "2024-01-18"
  }
}
```

#### Frontend: `frontend/app/customer/orders/[id]/page.js`
```javascript
Features:
1. Order Timeline Component:
   - Vertical timeline
   - Completed steps (green)
   - Current step (blue)
   - Pending steps (gray)
   - Timestamps for completed
   - Status descriptions

2. Order Details Section:
   - Order number
   - Order date
   - Delivery address
   - Payment method
   - Payment status

3. Items Section:
   - Product list
   - Quantity per item
   - Seller information
   - Individual item links

4. Estimated Delivery

5. Contact Seller Button

6. Print Receipt Button

7. Report Issue Button (links to complaints)
```

#### Create `frontend/components/OrderTimeline.jsx`
```javascript
Props:
- timeline (array)
- currentStatus (string)

Displays vertical timeline with icons and labels
```

### Test Cases
- [ ] Order tracking page loads correctly
- [ ] Timeline displays all statuses
- [ ] Completed statuses show timestamps
- [ ] Current status highlighted
- [ ] Responsive layout
- [ ] All order details display correctly

---

## Sprint 3 Completion

Once all tickets 3.1-3.5 are complete:

### ✅ Sprint 3 Summary
**Completed:**
- Full shopping cart implementation with CRUD operations
- Cart management with add, update, remove items
- Checkout flow with delivery and payment options
- Order creation with automatic number generation
- Order history and tracking functionality
- Cart and order persistence
- Order timeline visualization
- Confirmation pages

**Backend Routes:** /api/cart/*, /api/orders/*, /api/orders/*/track

**Frontend Pages:** /customer/cart, /customer/checkout, /customer/order-confirmation/[id], /customer/orders/[id]

**Key Features Working:**
- Add/remove products from cart
- Checkout with address and payment
- Order placement
- Order tracking with timeline
- Order history
- Cart summary

**Next Sprint:** Seller store and product management

---

---

# SPRINT 4: Seller Management & Store Features

**Duration:** 3-4 days  
**Goal:** Implement seller profile, store management, product management, and order handling for sellers

## Ticket 4.1: Seller Profile & Registration API

### Description
Create seller registration and profile management endpoints.

### Requirements

#### Backend: `backend/routes/sellerRoutes.js`

**POST /api/sellers/register** (Protected - authenticated users with seller role)
```
Request body:
{
  "shopName": "string",
  "description": "string",
  "location": "string",
  "contact": "string",
  "bankDetails": {
    "accountName": "string",
    "accountNumber": "string",
    "bankName": "string"
  },
  "banner": "string (image URL)"
}

Response (201):
{
  "success": true,
  "message": "Seller profile created",
  "data": {
    "sellerId": "...",
    "userId": "...",
    "shopName": "...",
    "verificationStatus": "pending",
    "createdAt": "..."
  }
}

Validations:
- User must have seller role
- shopName required and unique
- Contact valid phone format
```

**GET /api/sellers/:sellerId**
```
Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "shopName": "...",
    "description": "...",
    "location": "...",
    "contact": "...",
    "banner": "...",
    "ratings": 4.5,
    "totalOrders": 150,
    "productCount": 45,
    "verificationStatus": "approved",
    "verifiedBy": "...",
    "verificationDate": "..."
  }
}
```

**GET /api/sellers** (Public)
```
Query params:
- page
- limit
- location (filter)
- verified (boolean filter)

Response:
{
  "success": true,
  "data": [ sellers array ],
  "pagination": { page, limit, total, pages }
}
```

**PUT /api/sellers/profile** (Protected - seller only)
```
Request body:
{
  "shopName": "string",
  "description": "string",
  "location": "string",
  "contact": "string",
  "banner": "string (URL)"
}

Response (200):
{
  "success": true,
  "message": "Profile updated",
  "data": { updated seller }
}
```

### Test Cases
- [ ] Seller can register with valid data
- [ ] Unique shop name enforced
- [ ] Seller profile retrieved correctly
- [ ] Seller list paginated
- [ ] Profile update works
- [ ] Verification status shows correctly

---

## Ticket 4.2: Seller Product Management API

### Description
Create APIs for sellers to manage their products.

### Requirements

#### Backend: `backend/routes/productRoutes.js` (new endpoints)

**POST /api/sellers/products** (Protected - seller only)
```
Request body:
{
  "name": "string",
  "description": "string",
  "categoryId": "string",
  "price": number,
  "stock": number,
  "image": "string (URL)",
  "isLocal": boolean,
  "localProductDetails": {
    "producer": "string",
    "location": "string"
  }
}

Response (201):
{
  "success": true,
  "message": "Product added",
  "data": { product object }
}
```

**GET /api/sellers/products** (Protected - seller only)
```
Query params:
- page
- limit
- sortBy (name, price, stock, createdAt)

Response:
{
  "success": true,
  "data": [ seller's products ],
  "pagination": { ... }
}
```

**PUT /api/sellers/products/:productId** (Protected - seller only)
```
Request body: same as POST

Response (200):
{
  "success": true,
  "message": "Product updated",
  "data": { updated product }
}
```

**DELETE /api/sellers/products/:productId** (Protected - seller only)
```
Response (200):
{
  "success": true,
  "message": "Product deleted"
}

Note: Hard delete or soft delete with flag
```

### Validation
- All fields required except localProductDetails
- Stock must be non-negative
- Price must be positive
- Category must exist
- Only seller's own products can be edited/deleted

### Test Cases
- [ ] Seller can add product
- [ ] Product appears in seller's list
- [ ] Product can be updated
- [ ] Product can be deleted
- [ ] Only seller's products shown
- [ ] Validation works

---

## Ticket 4.3: Seller Dashboard (Frontend)

### Description
Create seller dashboard with overview and management panels.

### Requirements

#### Create `frontend/app/seller/dashboard/page.js`
```javascript
Sections:

1. Welcome Section:
   - Seller name
   - Verification status badge
   - Shop name

2. Statistics Cards (4 columns):
   - Total Sales (NPR amount)
   - Total Orders (count)
   - Total Products (count)
   - Average Rating (stars)

3. Recent Orders Section:
   - Table with:
     - Order number
     - Customer name
     - Items count
     - Order status
     - Order date
     - Total amount
   - View Details link
   - Mark as Shipped/Delivered buttons

4. Low Stock Alert:
   - Products with stock < 5
   - Link to manage inventory

5. Sales Chart:
   - Last 7 days sales
   - Using Recharts (line or bar chart)

6. Quick Actions:
   - Add Product button
   - View All Orders button
   - Manage Store button
   - View Analytics button

7. Responsive grid layout
```

#### Create `frontend/components/DashboardStatCard.jsx`
```javascript
Props:
- title (string)
- value (string or number)
- icon (React component)
- trend (optional, percentage change)
- color (color theme)

Displays: Stat card with icon and value
```

### Features
- Protected route (seller only)
- Load seller profile on mount
- Real-time or periodic updates of orders
- Loading states
- Error handling
- Responsive layout

### Test Cases
- [ ] Dashboard loads for seller only
- [ ] Statistics display correctly
- [ ] Recent orders show
- [ ] Low stock alerts display
- [ ] Chart renders correctly
- [ ] Quick action buttons work
- [ ] Mobile responsive

---

## Ticket 4.4: Seller Product Management Pages (Frontend)

### Description
Create pages for sellers to manage products.

### Requirements

#### Create `frontend/app/seller/products/page.js`
```javascript
Features:
1. Products List Table:
   - Product image thumbnail
   - Product name
   - Category
   - Price (NPR)
   - Stock quantity
   - Status (active/inactive)
   - Rating
   - Action buttons (Edit, Delete)

2. Toolbar:
   - Add Product button
   - Search box
   - Filter by category
   - Sort options

3. Pagination

4. Bulk actions (optional):
   - Select multiple
   - Delete selected
   - Change category

5. Empty state

6. Confirmation before delete

7. Responsive (table on desktop, cards on mobile)
```

#### Create `frontend/app/seller/products/new/page.js`
```javascript
Form with fields:
- Product name
- Description (textarea)
- Category (dropdown)
- Price (number)
- Stock (number)
- Image upload/URL input
- Is Local Product (checkbox)
- If local:
  - Producer name
  - Location

Features:
- Form validation
- Image preview
- Category suggestions
- Save Draft (optional)
- Submit button with loading
- Success/error messages
- Auto-redirect to products list
```

#### Create `frontend/app/seller/products/[id]/edit/page.js`
```javascript
Same as new product page but:
- Pre-filled with product data
- Edit mode
- Delete button
- Cancel button goes back
```

### Features
- Form validation
- Image preview before save
- Controlled inputs
- Loading states
- Error messages
- Success notifications
- Auto-redirect after save

### Test Cases
- [ ] Products list loads
- [ ] Can add new product
- [ ] Product appears in list
- [ ] Can edit product
- [ ] Can delete product
- [ ] Form validation works
- [ ] Image preview works
- [ ] Mobile responsive

---

## Ticket 4.5: Seller Order Management

### Description
Create endpoints and pages for sellers to manage customer orders.

### Requirements

#### Backend: `backend/routes/orderRoutes.js` (new endpoints)

**GET /api/sellers/orders** (Protected - seller only)
```
Query params:
- page
- limit
- status (filter: placed, confirmed, shipped, delivered)
- sortBy (date, amount)

Response:
{
  "success": true,
  "data": [
    {
      "orderId": "...",
      "orderNumber": "NG-2024-00001",
      "customerName": "...",
      "itemsForThisSeller": 3,
      "totalAmount": 2500,
      "orderStatus": "placed",
      "createdAt": "..."
    }
  ],
  "pagination": { ... }
}
```

**PUT /api/sellers/orders/:orderId/status** (Protected - seller only)
```
Request body:
{
  "status": "confirmed" | "shipped" | "delivered"
}

Response (200):
{
  "success": true,
  "message": "Order status updated",
  "data": { updated order }
}

Validations:
- Can only update own orders
- Status progression: placed → confirmed → shipped → delivered
```

#### Frontend: `frontend/app/seller/orders/page.js`
```javascript
Features:
1. Orders Table:
   - Order number
   - Customer name
   - Items count
   - Order status (with badge)
   - Order date
   - Amount
   - Action buttons (View, Update Status)

2. Filters:
   - Status dropdown
   - Date range picker (optional)

3. Sort options

4. Pagination

5. Order Detail Modal or Page:
   - Full order details
   - Items list
   - Customer info
   - Delivery address
   - Status update dropdown
   - Confirmation before update
   - Order timeline

6. Responsive layout
```

### Features
- Only see orders containing seller's products
- Update order status with confirmation
- View order details with items
- Customer contact information
- Delivery address
- Order history

### Test Cases
- [ ] Seller sees only own orders
- [ ] Orders list filters work
- [ ] Can update order status
- [ ] Status progression validated
- [ ] Order details display correctly
- [ ] Customer info shown

---

## Ticket 4.6: Seller Verification Status (Frontend)

### Description
Create page for sellers to check verification status.

### Requirements

#### Create `frontend/app/seller/verification/page.js`
```javascript
Display:
1. Verification Status Card:
   - Current status (Pending/Approved/Rejected/Review Required)
   - Status badge with color
   - Last updated date

2. If Pending:
   - Message: "Your profile is under review"
   - Expected timeline
   - Submitted documents/info

3. If Approved:
   - Congratulations message
   - Approval date
   - Officer name (if available)

4. If Rejected:
   - Rejection reason
   - Officer remarks
   - Option to appeal/resubmit (links to form)

5. If Review Required:
   - Reason for review
   - Required changes
   - Update Profile button

6. Support Message:
   - Contact info for questions
   - FAQ section
```

### Test Cases
- [ ] Status displays correctly based on database
- [ ] Approved status shows
- [ ] Pending status shows
- [ ] Rejected status with reason
- [ ] UI responsive

---

## Sprint 4 Completion

Once all tickets 4.1-4.6 are complete:

### ✅ Sprint 4 Summary
**Completed:**
- Seller registration and profile management
- Seller product management (add, edit, delete)
- Seller dashboard with statistics and charts
- Seller product management interface
- Seller order management and status updates
- Seller verification status page
- Order filtering and sorting for sellers

**Backend Routes:** /api/sellers/*, /api/sellers/products/*, /api/sellers/orders/*

**Frontend Pages:** /seller/dashboard, /seller/products, /seller/products/new, /seller/products/[id]/edit, /seller/orders, /seller/verification, /seller/store

**Key Features Working:**
- Sellers can manage products
- Sellers can track orders
- Product inventory management
- Order status updates
- Seller dashboard with insights
- Verification status tracking

**Next Sprint:** E-Governance (Complaints and Verification)

---

---

# SPRINT 5: E-Governance – Citizen Complaints

**Duration:** 3-4 days  
**Goal:** Implement complaint system and citizen grievance management

## Ticket 5.1: Complaint API Routes

### Description
Create backend APIs for complaint submission, tracking, and management.

### Requirements

#### Backend: `backend/routes/complaintRoutes.js`

**POST /api/complaints** (Protected - customers only)
```
Request body:
{
  "category": "overpricing" | "expired_product" | "quality_issue" | "misleading_info" | "seller_issue" | "other",
  "title": "string",
  "description": "string",
  "sellerId": "string (optional)",
  "productId": "string (optional)",
  "attachments": ["URL1", "URL2"] (optional),
  "relatedOrderId": "string (optional)"
}

Response (201):
{
  "success": true,
  "message": "Complaint submitted successfully",
  "data": {
    "complaintId": "...",
    "complaintNumber": "NC-2024-00001",
    "status": "submitted",
    "createdAt": "..."
  }
}

Validations:
- At least one of sellerId or productId
- Title min 10 characters
- Description min 20 characters
- Max 3 attachments
```

**GET /api/complaints** (Protected - officer/admin)
```
Query params:
- page
- limit
- status (filter)
- category (filter)
- assignedTo (filter - officer)
- dateFrom, dateTo (filter)

Response:
{
  "success": true,
  "data": [
    {
      "complaintId": "...",
      "complaintNumber": "NC-2024-00001",
      "category": "quality_issue",
      "title": "...",
      "status": "under_review",
      "submittedBy": { name, userId },
      "seller": { shopName },
      "assignedOfficer": { name },
      "createdAt": "...",
      "priority": "medium"
    }
  ],
  "pagination": { ... }
}
```

**GET /api/complaints/:complaintId** (Protected)
```
Response:
{
  "success": true,
  "data": {
    "complaintId": "...",
    "complaintNumber": "NC-2024-00001",
    "category": "quality_issue",
    "title": "...",
    "description": "...",
    "status": "under_review",
    "timeline": [
      { status: "submitted", timestamp: "...", message: "Complaint received" },
      { status: "under_review", timestamp: "...", message: "Officer assigned" },
      { status: "in_progress", timestamp: null, message: "Pending" }
    ],
    "submittedBy": { name, email, phone },
    "seller": { shopName, contact },
    "product": { name, category },
    "assignedOfficer": { name, department },
    "officerRemarks": "...",
    "resolution": "...",
    "attachments": [URLs],
    "relatedOrder": { orderNumber },
    "createdAt": "...",
    "resolvedAt": null
  }
}
```

**GET /api/complaints/citizen** (Protected - citizen/customer)
```
Query params:
- page
- limit
- status (filter)

Response:
{
  "success": true,
  "data": [
    {
      "complaintId": "...",
      "complaintNumber": "NC-2024-00001",
      "category": "...",
      "title": "...",
      "status": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**PUT /api/complaints/:complaintId/status** (Protected - officer/admin)
```
Request body:
{
  "status": "under_review" | "in_progress" | "resolved",
  "officerRemarks": "string (optional)"
}

Response (200):
{
  "success": true,
  "message": "Complaint status updated",
  "data": { updated complaint }
}
```

**PUT /api/complaints/:complaintId/assign** (Protected - admin)
```
Request body:
{
  "officerId": "string"
}

Response (200):
{
  "success": true,
  "message": "Complaint assigned",
  "data": { updated complaint }
}
```

**PUT /api/complaints/:complaintId/resolve** (Protected - officer/admin)
```
Request body:
{
  "resolution": "string",
  "officerRemarks": "string (optional)"
}

Response (200):
{
  "success": true,
  "message": "Complaint resolved",
  "data": { updated complaint }
}
```

### Business Logic
- Generate unique complaint number (NC-YYYY-XXXXX)
- Initial status: "submitted"
- Timeline tracks all status changes
- Officer can only be assigned by admin
- Resolution auto-sets status to "resolved"

### Test Cases
- [ ] Complaint created successfully
- [ ] Complaint number generated correctly
- [ ] Complaint retrieved by citizen and officer
- [ ] Status updated correctly
- [ ] Timeline updated
- [ ] Officer assignment works
- [ ] Resolution works

---

## Ticket 5.2: Citizen Complaint Pages (Frontend)

### Description
Create pages for citizens to submit and track complaints.

### Requirements

#### Create `frontend/app/customer/complaints/new/page.js`
```javascript
Form with sections:

1. Complaint Category:
   - Radio buttons or dropdown
   - Categories: Overpricing, Expired Product, Quality Issue, Misleading Info, Seller Issue, Other

2. Product/Seller Selection:
   - Search and select product
   - Or select seller
   - Shows product/seller details

3. Complaint Details:
   - Title (min 10 chars)
   - Description (textarea, min 20 chars)
   - Related Order (optional dropdown)

4. Attachments:
   - File upload (up to 3 files)
   - Image previews
   - File type validation

5. Validation Messages

6. Submit Button with loading state

7. Success Modal with:
   - Complaint number (to save/screenshot)
   - Confirmation message
   - Link to track complaint
   - "Create Another" button

Features:
- Form validation
- File preview
- Auto-save (optional)
- Error handling
- Mobile-friendly layout
```

#### Create `frontend/app/customer/complaints/page.js`
```javascript
Features:
1. Complaints List:
   - Table or card view
   - Complaint number
   - Title
   - Category badge
   - Status badge (with color)
   - Submitted date
   - Last updated
   - View Details link

2. Filters:
   - Status filter (All, Submitted, Under Review, In Progress, Resolved)
   - Category filter
   - Date range filter

3. Sort Options:
   - Latest first
   - Oldest first
   - By status

4. Pagination

5. Empty state with link to create complaint

6. Search complaint number

7. Responsive (table on desktop, cards on mobile)
```

#### Create `frontend/app/customer/complaints/[id]/page.js`
```javascript
Displays:

1. Complaint Header:
   - Complaint number (copyable)
   - Status badge
   - Category badge
   - Submit date
   - Last updated

2. Complaint Details:
   - Title
   - Description
   - Related product/seller
   - Related order (if any)
   - Attachments (viewable)

3. Timeline Section:
   - Vertical timeline
   - Submitted → Under Review → In Progress → Resolved
   - Timestamps for completed
   - Officer remarks displayed

4. Officer Information (if assigned):
   - Officer name
   - Department
   - Contact (if permitted)

5. Resolution (if resolved):
   - Resolution text
   - Officer remarks
   - Resolution date

6. Actions (if not resolved):
   - Edit button (maybe - to change details)
   - Escalate button (optional)
   - Contact officer link

7. Print button for record keeping
```

#### Create `frontend/components/ComplaintTimeline.jsx`
```javascript
Props:
- timeline (array of events)
- currentStatus (string)

Displays vertical timeline with statuses and remarks
```

### Features
- Validation on form submission
- File upload preview
- Success confirmation with complaint number
- Tracking with real-time updates
- Print functionality
- Mobile responsive

### Test Cases
- [ ] Complaint form validates
- [ ] File upload works
- [ ] Complaint created successfully
- [ ] Complaint number displayed
- [ ] Complaints list shows
- [ ] Filters work
- [ ] Detail page displays all info
- [ ] Timeline displays correctly
- [ ] Mobile responsive

---

## Ticket 5.3: Government Officer Complaint Management

### Description
Create pages for government officers to manage complaints.

### Requirements

#### Backend: Create `backend/routes/officerRoutes.js`

**GET /api/officers/dashboard** (Protected - officer)
```
Response:
{
  "success": true,
  "data": {
    "assignedComplaints": 15,
    "pendingComplaints": 5,
    "resolvedComplaints": 10,
    "resolutionRate": 0.67,
    "averageResolutionTime": 3.5,
    "recentComplaints": [ ... ]
  }
}
```

#### Frontend: Create `frontend/app/government/complaints/page.js`
```javascript
Features:
1. Complaints Queue Table:
   - Complaint number
   - Category icon and label
   - Title
   - Status with color badge
   - Submitted by (citizen name)
   - Assigned to (officer name or "Unassigned")
   - Created date
   - Days open
   - Action buttons (View, Assign, Update Status)

2. Filters and Search:
   - Status filter
   - Category filter
   - Assigned to me filter
   - Unassigned filter
   - Keyword search
   - Date range filter

3. Sort options

4. Pagination

5. Bulk actions:
   - Assign multiple
   - Close multiple (optional)

6. Statistics section:
   - Total complaints
   - Pending
   - Resolved
   - Average resolution time

7. Priority indicators
```

#### Frontend: Create `frontend/app/government/complaints/[id]/page.js`
```javascript
Displays:
1. Complaint Header:
   - Complaint number
   - Status dropdown (for updating)
   - Category
   - Priority

2. Complaint Details:
   - Citizen info
   - Seller info
   - Product info
   - Description
   - Attachments

3. Officer Assignment:
   - Current assignment
   - Reassign button
   - Officer dropdown

4. Officer Actions Panel:
   - Status update button
   - Add remarks/comments
   - Resolve button (if ready)
   - Notes field

5. Timeline of updates

6. Related Information:
   - Seller verification status
   - Product details
   - Related orders
   - Citizen complaint history

7. Resolution Form:
   - Resolution text
   - Officer signature (name with timestamp)
   - Submit button

8. Buttons:
   - Mark as Under Review
   - Mark as In Progress
   - Resolve Complaint
```

#### Create `frontend/app/government/dashboard/page.js`
```javascript
Displays:
1. Statistics Cards:
   - Total complaints (this period)
   - Pending complaints
   - Resolved complaints
   - Average resolution time (days)
   - Resolution rate (%)

2. My Workload:
   - Assigned to me
   - Resolved by me
   - Pending reviews

3. Recent Complaints Table:
   - List of recent complaints
   - Status, category, date

4. Category Distribution Chart:
   - Pie chart showing complaints by category

5. Status Distribution Chart:
   - Bar chart showing statuses

6. Trend Chart:
   - Line chart showing complaints over time (7-14 days)

7. Quick Actions:
   - View all complaints button
   - View assignments button
   - Reports button
```

### Features
- Protected routes (officer only)
- Real-time updates
- Bulk operations
- Status tracking
- Officer assignment
- Resolution workflow
- Timeline view
- Charts using Recharts

### Test Cases
- [ ] Officer dashboard loads
- [ ] Complaints list shows
- [ ] Can update status
- [ ] Can assign complaint
- [ ] Can add remarks
- [ ] Can resolve complaint
- [ ] Filters work
- [ ] Statistics calculate correctly
- [ ] Charts render

---

## Ticket 5.4: Complaint Assignment & Workflow

### Description
Backend logic for complaint workflow and assignment.

### Requirements

#### Backend Logic
```javascript
Complaint Workflow:
1. submitted → under_review (auto or manual)
2. under_review → in_progress (officer updates)
3. in_progress → resolved (officer resolves with resolution text)

Workflow Rules:
- Submitted complaints auto-assign to available officer
  (OR: require admin to assign)
- Officer can update status
- Resolution requires:
  - Resolution text
  - Officer remarks (optional)
  - Timestamp is auto-set

Assignment Logic:
- Admin assigns officer based on:
  - Officer workload
  - Officer availability
  - Category expertise (optional)

Timeline:
- Each status change creates timeline entry
- Include timestamp and user info
```

### Test Cases
- [ ] Status transitions work correctly
- [ ] Timeline updates
- [ ] Assignment logic works
- [ ] Workflow validations enforced

---

## Ticket 5.5: Complaint Notifications (Optional Enhancement)

### Description
Basic notification system for complaint updates.

### Requirements
```javascript
When complaint is:
1. Submitted:
   - Email to citizen: confirmation with complaint number
   - Notification to admin: new complaint submitted

2. Status Updated:
   - Email to citizen: complaint status changed
   - Show in citizen dashboard

3. Assigned to Officer:
   - Notification to officer: new complaint assigned

4. Resolved:
   - Email to citizen: complaint resolved with details
   - Show resolution in citizen dashboard
```

Note: For university project, can use console logs instead of actual emails initially.

### Test Cases
- [ ] Console logs show notifications
- [ ] All events trigger notifications

---

## Sprint 5 Completion

Once all tickets 5.1-5.5 are complete:

### ✅ Sprint 5 Summary
**Completed:**
- Citizen complaint submission form with validation
- Complaint tracking and status updates
- Government officer complaint management interface
- Complaint assignment and workflow
- Officer dashboard with statistics
- Complaint timeline and history
- File attachment handling
- Filtering and searching

**Backend Routes:** /api/complaints/*, /api/officers/*

**Frontend Pages:** /customer/complaints, /customer/complaints/new, /customer/complaints/[id], /government/complaints, /government/complaints/[id], /government/dashboard

**Key Features Working:**
- Citizens can file complaints
- Officers can track and manage complaints
- Status workflow (submitted → under review → in progress → resolved)
- Officer assignment
- Timeline tracking
- Dashboard statistics

**Next Sprint:** Seller Verification, Notices, and Market Monitoring

---

---

# SPRINT 6: E-Governance – Verification, Notices & Monitoring

**Duration:** 3-4 days  
**Goal:** Implement seller verification, government notices, and market price monitoring

## Ticket 6.1: Seller Verification Workflow & API

### Description
Create backend APIs for seller verification process.

### Requirements

#### Backend: `backend/routes/verificationRoutes.js`

**GET /api/verification/sellers** (Protected - admin/officer)
```
Query params:
- page
- limit
- status (pending, approved, rejected, review_required)
- sortBy (date, shopName)

Response:
{
  "success": true,
  "data": [
    {
      "sellerId": "...",
      "shopName": "...",
      "location": "...",
      "status": "pending",
      "appliedDate": "...",
      "lastUpdated": "...",
      "productsCount": 15,
      "viewDetails": "link"
    }
  ],
  "pagination": { ... }
}
```

**GET /api/verification/sellers/:sellerId** (Protected - admin/officer)
```
Response:
{
  "success": true,
  "data": {
    "sellerId": "...",
    "shopName": "...",
    "description": "...",
    "location": "...",
    "contact": "...",
    "owner": { name, email, phone },
    "bankDetails": { ... },
    "documents": [...],
    "status": "pending",
    "appliedDate": "...",
    "verificationHistory": [
      { status: "pending", date: "..." },
      { status: "review_required", date: "...", reason: "..." }
    ],
    "productsCount": 15,
    "totalOrders": 0,
    "complaintHistory": [...]
  }
}
```

**PUT /api/verification/sellers/:sellerId/approve** (Protected - admin)
```
Request body:
{
  "officerId": "string (approving officer)"
}

Response (200):
{
  "success": true,
  "message": "Seller approved",
  "data": { updated seller with approval date }
}
```

**PUT /api/verification/sellers/:sellerId/reject** (Protected - admin)
```
Request body:
{
  "reason": "string",
  "officerId": "string"
}

Response (200):
{
  "success": true,
  "message": "Seller rejected",
  "data": { updated seller with rejection reason }
}
```

**PUT /api/verification/sellers/:sellerId/review** (Protected - admin)
```
Request body:
{
  "reviewReason": "string",
  "officerId": "string"
}

Response (200):
{
  "success": true,
  "message": "Seller marked for review",
  "data": { updated seller }
}
```

### Test Cases
- [ ] Sellers list fetches correctly
- [ ] Approval endpoint works
- [ ] Rejection endpoint works
- [ ] Review status works
- [ ] History tracked

---

## Ticket 6.2: Seller Verification Interface (Frontend)

### Description
Create pages for admin/officers to review and verify sellers.

### Requirements

#### Frontend: `frontend/app/government/sellers/page.js`
```javascript
Features:
1. Sellers Queue Table:
   - Shop name
   - Owner name
   - Location
   - Status badge (Pending, Approved, Rejected, Review Required)
   - Applied date
   - Products count
   - Action buttons (View Details, Approve, Reject, Request Review)

2. Filters:
   - Status filter
   - Location filter
   - Date range filter
   - Keyword search

3. Sort options

4. Pagination

5. Statistics section:
   - Total sellers
   - Verified sellers
   - Pending sellers
   - Rejected sellers

6. Bulk actions (optional):
   - Approve multiple
   - Reject multiple

7. Responsive layout
```

#### Frontend: `frontend/app/government/sellers/[id]/page.js`
```javascript
Displays:
1. Seller Header:
   - Shop name
   - Owner name
   - Current status badge
   - Applied date

2. Basic Information:
   - Owner name, email, phone
   - Shop name
   - Description
   - Location
   - Contact number

3. Business Details:
   - Bank account details (masked)
   - Registration details (if applicable)

4. Documents/Evidence:
   - List of uploaded documents
   - Verification checklist

5. Products:
   - Product count
   - Sample products list
   - Link to view all

6. Complaint History:
   - Recent complaints
   - Complaint count
   - Link to view all

7. Order History:
   - Total orders
   - Recent orders

8. Verification Timeline:
   - History of status changes
   - Dates and officer names

9. Action Panel:
   - Approve button
   - Reject button with reason input
   - Request Review button with reason input
   - Submit buttons with loading states

10. Approval Form:
    - Officer notes (optional textarea)
    - Submit button

11. Rejection Form:
    - Rejection reason (required)
    - Officer notes (optional)
    - Submit button

12. Review Form:
    - Review reason (required)
    - Officer notes (optional)
    - Submit button
```

### Features
- Protected route (admin/officer only)
- Document viewing
- Status history
- Batch actions
- Confirmation modals
- Success notifications

### Test Cases
- [ ] Sellers list displays
- [ ] Can view seller details
- [ ] Can approve seller
- [ ] Can reject seller with reason
- [ ] Can request review
- [ ] History updates
- [ ] Responsive design

---

## Ticket 6.3: Government Notices API & Frontend

### Description
Create APIs and interface for government notices.

### Requirements

#### Backend: `backend/routes/noticeRoutes.js`

**POST /api/notices** (Protected - officer/admin)
```
Request body:
{
  "title": "string",
  "content": "text",
  "category": "market_info" | "consumer_awareness" | "public_notice" | "regulations" | "price_info",
  "priority": "low" | "medium" | "high"
}

Response (201):
{
  "success": true,
  "message": "Notice created",
  "data": { notice object }
}
```

**GET /api/notices** (Public)
```
Query params:
- page
- limit
- category (filter)
- priority (filter)
- archived (false by default)

Response:
{
  "success": true,
  "data": [
    {
      "noticeId": "...",
      "title": "...",
      "content": "...",
      "category": "market_info",
      "priority": "high",
      "issuedBy": { name },
      "publishedAt": "...",
      "viewCount": 150
    }
  ],
  "pagination": { ... }
}
```

**GET /api/notices/:noticeId** (Public)
```
Response:
{
  "success": true,
  "data": {
    "noticeId": "...",
    "title": "...",
    "content": "...",
    "category": "...",
    "priority": "...",
    "issuedBy": { name, department, office },
    "publishedAt": "...",
    "archiveDate": null,
    "viewCount": 150
  }
}
```

**PUT /api/notices/:noticeId** (Protected - officer/admin)
```
Request body: same as POST
Response (200): { success, message, data }
```

**DELETE /api/notices/:noticeId** (Protected - admin)
```
Response (200): { success, message }
```

**PUT /api/notices/:noticeId/archive** (Protected - admin)
```
Response (200): { success, message }
```

### Test Cases
- [ ] Notice created successfully
- [ ] Notice list displayed (public)
- [ ] Can filter and search
- [ ] Can edit notice
- [ ] Can archive notice

---

## Ticket 6.4: Notices Interface (Frontend)

### Description
Create pages for government officers to manage notices and for citizens to view them.

### Requirements

#### Frontend: `frontend/app/notices/page.js` (Public)
```javascript
Features:
1. Notices Feed:
   - Card or list view
   - Title
   - Category badge
   - Priority badge
   - Published date
   - Excerpt/preview (first 200 chars)
   - Read More link
   - Issued by (officer/department)

2. Filters:
   - Category filter
   - Priority filter
   - Date range filter

3. Sort options:
   - Latest first
   - Oldest first
   - By priority

4. Search

5. Pagination

6. Responsive layout
```

#### Frontend: `frontend/app/notices/[id]/page.js` (Public)
```javascript
Displays:
- Notice title
- Category and priority badges
- Published date
- Officer/department info
- Full content
- Print button
- Share button (optional)
- Download button (optional)
- Related notices section
- Back to notices link
```

#### Frontend: `frontend/app/government/notices/page.js` (Protected - officer)
```javascript
Features:
1. Notices Management Table:
   - Title
   - Category
   - Priority
   - Published date
   - Status (Published/Draft if applicable)
   - View count
   - Action buttons (View, Edit, Archive, Delete)

2. Create Notice Button

3. Filters and search

4. Pagination
```

#### Frontend: `frontend/app/government/notices/new/page.js` (Protected)
```javascript
Form with:
- Title input
- Content textarea (rich text optional)
- Category dropdown
- Priority radio buttons
- Publish button
- Save as draft (optional)
- Preview button
- Validation
- Success message
```

#### Frontend: `frontend/app/government/notices/[id]/edit/page.js`
```javascript
Same as create notice but with pre-filled data
```

### Features
- Rich text editor (optional, or use textarea with markdown)
- Category and priority management
- Draft/publish workflow
- View count tracking
- Responsive layout

### Test Cases
- [ ] Public can view notices
- [ ] Officer can create notice
- [ ] Officer can edit notice
- [ ] Officer can archive notice
- [ ] Filters and search work
- [ ] Responsive design

---

## Ticket 6.5: Market Price Monitoring API

### Description
Create APIs for government officers to monitor product prices.

### Requirements

#### Backend: `backend/routes/marketMonitoringRoutes.js`

**GET /api/market-monitoring/prices** (Protected - officer)
```
Query params:
- page
- limit
- category (filter)
- status (filter: normal, review_required)
- seller (filter)
- sortBy (product, averagePrice, deviation)

Response:
{
  "success": true,
  "data": [
    {
      "priceId": "...",
      "product": { name, category },
      "seller": { shopName, location },
      "currentPrice": 450,
      "averageMarketPrice": 400,
      "priceDeviation": 12.5, // percentage
      "status": "review_required", // if > 15% deviation
      "lastUpdated": "...",
      "monitoredBy": { name } (if any)
    }
  ],
  "pagination": { ... }
}
```

**PUT /api/market-monitoring/prices/:priceId/status** (Protected - officer)
```
Request body:
{
  "status": "normal" | "review_required",
  "remarks": "string (optional)"
}

Response (200):
{
  "success": true,
  "message": "Price status updated",
  "data": { updated price record }
}
```

**GET /api/market-monitoring/analytics** (Protected - officer)
```
Response:
{
  "success": true,
  "data": {
    "pricesUnderReview": 5,
    "averagePriceDeviation": 8.2,
    "mostOverpriced": [
      { product: "...", deviation: 25 }
    ],
    "pricesByCategory": {
      "Grocery": { count: 15, avgDeviation: 5 }
    },
    "trendData": [ { date, reviewCount } ]
  }
}
```

### Business Logic
- Calculate average price across all sellers for product
- Flag if price > 15% above average
- Track all price changes
- Provide historical trend data

### Test Cases
- [ ] Prices fetched correctly
- [ ] Average calculation correct
- [ ] Deviation percentage calculated
- [ ] Status update works
- [ ] Analytics data correct

---

## Ticket 6.6: Market Monitoring Interface (Frontend)

### Description
Create interface for government officers to monitor market prices.

### Requirements

#### Frontend: `frontend/app/government/market-monitoring/page.js`
```javascript
Features:
1. Price Monitoring Table:
   - Product name
   - Category badge
   - Seller name
   - Seller location
   - Current price
   - Average market price
   - Price deviation (percentage with color)
   - Status badge (Normal/Review Required)
   - Last updated date
   - Action button (Review)

2. Filters:
   - Category filter
   - Status filter (Normal, Review Required)
   - Location filter
   - Price range filter
   - Seller filter

3. Sort options

4. Pagination

5. Statistics Section:
   - Prices under review (count)
   - Average deviation (%)
   - Most overpriced products (top 5)
   - Price by category chart (Recharts)

6. Alert Section:
   - List of products flagged for review

7. Search by product name
```

#### Frontend: `frontend/app/government/market-monitoring/[priceId]/page.js`
```javascript
Displays:
- Product details
- Seller information
- Current price
- Average market price
- Deviation percentage
- Price history chart (Recharts - line chart)
- Historical prices table
- Current status
- Officer remarks (if any)
- Status update dropdown
- Remarks textarea
- Update button
- Comparison with other sellers (table)
```

### Features
- Real-time price monitoring
- Deviation alerts
- Price history visualization
- Comparative analysis
- Status management
- Responsive layout

### Test Cases
- [ ] Prices display correctly
- [ ] Filters work
- [ ] Charts render
- [ ] Can update status
- [ ] Statistics calculate correctly

---

## Sprint 6 Completion

Once all tickets 6.1-6.6 are complete:

### ✅ Sprint 6 Summary
**Completed:**
- Seller verification workflow (approve, reject, review)
- Seller verification interface for admin/officers
- Government notices creation and publishing
- Public notices viewing interface
- Market price monitoring system
- Price deviation alerts
- Market monitoring dashboard
- Statistical analytics

**Backend Routes:** /api/verification/sellers/*, /api/notices/*, /api/market-monitoring/*

**Frontend Pages:** /government/sellers, /government/sellers/[id], /government/notices, /government/notices/new, /government/notices/[id]/edit, /notices, /notices/[id], /government/market-monitoring, /government/market-monitoring/[id]

**Key Features Working:**
- Sellers can be verified/rejected
- Verification status tracking
- Government can publish notices
- Public can view notices
- Price monitoring and alerts
- Market analysis and reporting

**Next Sprint:** Dashboards for all user roles

---

---

# SPRINT 7: Dashboards & Admin Panel

**Duration:** 3-4 days  
**Goal:** Create comprehensive dashboards for all user roles and admin panel

## Ticket 7.1: Customer/Citizen Dashboard (Complete)

### Description
Create complete customer dashboard with all components.

### Requirements

#### Frontend: `frontend/app/customer/dashboard/page.js` (already started in Sprint 4, now complete)
```javascript
Sections:
1. Welcome Header:
   - User name
   - Current date/time
   - Quick actions menu

2. Statistics Cards (4 columns):
   - Total Orders (count)
   - Active Orders (count)
   - Completed Orders (count)
   - Total Spent (NPR amount)
   - Complaint Count

3. Recent Orders Section:
   - Table with latest 5 orders
   - Order number, status, date, amount
   - View/Track link
   - Pagination or View All link

4. Active Orders Section:
   - Only orders not delivered
   - Order status with progress
   - Expected delivery date
   - View tracking link

5. Complaints Section:
   - Pending complaints count
   - Recent complaints list
   - Status badges
   - File complaint button

6. Government Notices Section:
   - Latest 3 notices
   - Category and priority badges
   - Read more link

7. Quick Actions:
   - Browse Products button
   - View Cart button
   - File Complaint button
   - View Notices button

8. Charts:
   - Order trend (last 30 days) - line chart
   - Spending by category - pie chart

9. Responsive layout
10. Loading states
```

### Features
- All statistics calculated from actual data
- Real-time order updates
- Quick navigation
- Mobile responsive
- Empty states

### Test Cases
- [ ] Dashboard loads
- [ ] Statistics display correctly
- [ ] Recent orders show
- [ ] Charts render
- [ ] Links work
- [ ] Mobile responsive

---

## Ticket 7.2: Seller Dashboard (Complete)

### Description
Enhance seller dashboard created in Sprint 4 with all components.

### Requirements

#### Frontend: `frontend/app/seller/dashboard/page.js` (enhance)
```javascript
Sections:
1. Welcome Header:
   - Shop name
   - Verification status badge
   - Quick links

2. Key Metrics Cards (4-5 columns):
   - Total Sales (NPR) - this month
   - Total Orders (count) - this month
   - Total Products (count)
   - Average Rating (stars)
   - Low Stock Alert (count)

3. Sales Section:
   - This month sales (NPR)
   - Last month sales (for comparison)
   - Growth percentage
   - Today's sales

4. Recent Orders:
   - Table with 5 latest orders
   - Order number, customer, items, status, date, amount
   - View/Update status link

5. Low Stock Products:
   - Table showing products with stock < 5
   - Product name, category, current stock
   - Restock link

6. Top Products:
   - 5 best-selling products
   - Sales count, revenue
   - Rating

7. Charts:
   - Sales trend (last 30 days) - line chart
   - Orders by status - bar chart
   - Product performance - top 5 products

8. Seller Account Status:
   - Account info
   - Verification status with timeline
   - Compliance status

9. Quick Actions:
   - Add Product
   - View Orders
   - View Products
   - View Analytics

10. Responsive layout
```

### Features
- Month-to-month comparison
- Inventory alerts
- Sales analytics
- Product performance
- Multiple charts

### Test Cases
- [ ] Dashboard loads
- [ ] All statistics correct
- [ ] Charts render
- [ ] Low stock alerts work
- [ ] Mobile responsive

---

## Ticket 7.3: Government Officer Dashboard (Complete)

### Description
Create comprehensive officer dashboard with case management.

### Requirements

#### Frontend: `frontend/app/government/dashboard/page.js`
```javascript
Sections:
1. Welcome Header:
   - Officer name
   - Department
   - Today's date

2. Key Metrics Cards (5+ columns):
   - Total Complaints Assigned (count)
   - Pending Complaints (count)
   - Resolved Complaints (count) - this month
   - Average Resolution Time (days)
   - Sellers Under Review (count)
   - Verified Sellers (count)

3. My Workload Section:
   - My pending complaints (list/table)
   - Assignment date
   - Days pending
   - Priority
   - View link

4. Complaints Section:
   - Complaint statistics
   - Recent complaints (not assigned to officer)
   - Categorization

5. Seller Verification:
   - Pending sellers count
   - Recent applications
   - Quick approve/reject

6. Market Monitoring:
   - Prices under review count
   - Top overpriced products
   - Recent price violations

7. Charts:
   - Complaints by category - pie chart
   - Resolution timeline - line chart
   - Complaints by status - bar chart
   - Workload trend - line chart

8. Recent Activity:
   - Timeline of officer's recent actions
   - Updates to complaints/sellers

9. Quick Actions:
   - View All Complaints
   - Review Sellers
   - Monitor Prices
   - Create Notice
   - View Reports

10. Responsive layout
```

### Features
- Personalized workload view
- Multiple charts
- Activity tracking
- Quick navigation
- Performance metrics

### Test Cases
- [ ] Dashboard loads
- [ ] Metrics correct
- [ ] Charts render
- [ ] My workload shows assigned only
- [ ] Mobile responsive

---

## Ticket 7.4: Admin Dashboard

### Description
Create admin dashboard with system-wide management.

### Requirements

#### Frontend: `frontend/app/admin/dashboard/page.js`
```javascript
Sections:
1. System Statistics Cards (6+ columns):
   - Total Users (count)
   - Total Sellers (count)
   - Verified Sellers (count)
   - Total Products (count)
   - Total Orders (count) - this month
   - Total Revenue (NPR) - this month
   - Total Complaints (count)
   - Resolution Rate (%)

2. User Management:
   - Recent user registrations (table)
   - User breakdown (by type)
   - Active users (today)

3. Seller Management:
   - Sellers by status (bar chart)
   - Pending verifications
   - Recent applications

4. Market Activity:
   - Orders trend (line chart)
   - Revenue trend (line chart)
   - Sales by category (pie chart)

5. Complaint Analytics:
   - Complaints by category (pie chart)
   - Status distribution (bar chart)
   - Top complaint categories (table)
   - Resolution rate trend

6. System Health:
   - Total products available
   - Out of stock products
   - Categories overview

7. Officer Performance:
   - Officers statistics
   - Complaints resolved per officer
   - Resolution rate per officer

8. Recent Activity:
   - New users
   - New sellers
   - New complaints
   - Recent orders

9. Quick Navigation Links:
   - User Management
   - Seller Management
   - Product Management
   - Category Management
   - Officer Management
   - Complaints
   - Notices
   - Analytics

10. Responsive layout
```

### Features
- System-wide statistics
- Multiple data visualizations
- Quick access to management sections
- Performance metrics
- Activity monitoring

### Test Cases
- [ ] Dashboard loads
- [ ] All statistics display
- [ ] Charts render
- [ ] Links to management sections work
- [ ] Mobile responsive

---

## Ticket 7.5: Admin Management Panels

### Description
Create admin panels for system management (CRUD operations).

### Requirements

#### Frontend: Create multiple management pages

**`frontend/app/admin/users/page.js`**
```javascript
Features:
- Users table with: name, email, role, created date, status
- Search and filters
- Delete button (soft delete)
- View details
- Block/unblock user
- Pagination
```

**`frontend/app/admin/sellers/page.js`**
```javascript
Features:
- Sellers table with: shop name, owner, location, status, products, verification
- Search and filters
- View details
- Approve/reject seller
- View seller details link
- Pagination
```

**`frontend/app/admin/products/page.js`**
```javascript
Features:
- Products table with: name, seller, category, price, stock, rating
- Search and filters
- Delete product (remove from system)
- View details
- Bulk operations (optional)
- Pagination
```

**`frontend/app/admin/categories/page.js`**
```javascript
Features:
- Categories table with: name, icon, product count
- Create category button
- Edit category
- Delete category
- Sort
```

**`frontend/app/admin/officers/page.js`**
```javascript
Features:
- Officers table with: name, department, email, complaints assigned, resolved
- Create officer account
- Edit officer
- Deactivate officer
- View performance
```

**`frontend/app/admin/complaints/page.js`**
```javascript
Features:
- Same as officer view but with all complaints
- View details
- Assign to officer
- Update status
- Reports
```

**`frontend/app/admin/notices/page.js`**
```javascript
Features:
- Notices table with: title, category, priority, published date
- Create notice
- Edit notice
- Publish/archive
- Delete notice
```

**`frontend/app/admin/analytics/page.js`**
```javascript
Features:
- Custom date range analytics
- Export reports
- Advanced filters
- Detailed charts
- Comparison views
```

### Features
- CRUD operations for all entities
- Search and filtering
- Batch operations
- Audit logging (optional)
- Export data (optional)

### Test Cases
- [ ] All management pages load
- [ ] Can view records
- [ ] Can search and filter
- [ ] Can create/edit/delete
- [ ] Confirmations work
- [ ] Pagination works

---

## Ticket 7.6: Dashboard API Endpoints

### Description
Create backend endpoints to provide dashboard data.

### Requirements

#### Backend: Create `backend/routes/dashboardRoutes.js`

**GET /api/dashboard/customer** (Protected - customer)
```
Returns all data for customer dashboard
```

**GET /api/dashboard/seller** (Protected - seller)
```
Returns all data for seller dashboard
```

**GET /api/dashboard/officer** (Protected - officer)
```
Returns all data for officer dashboard
```

**GET /api/dashboard/admin** (Protected - admin)
```
Returns all data for admin dashboard
```

### Implementation
- Aggregate data from multiple collections
- Calculate statistics
- Handle pagination
- Use efficient queries
- Cache if needed

### Test Cases
- [ ] Endpoints return correct data
- [ ] Statistics calculated correctly
- [ ] Protected routes work
- [ ] Performance acceptable

---

## Sprint 7 Completion

Once all tickets 7.1-7.6 are complete:

### ✅ Sprint 7 Summary
**Completed:**
- Customer dashboard with orders and complaints tracking
- Seller dashboard with sales analytics
- Government officer dashboard with workload management
- Admin dashboard with system-wide statistics
- Admin management panels (users, sellers, products, categories, officers, complaints, notices)
- Dashboard API endpoints for all roles
- Multiple data visualizations (charts and graphs)
- Quick action buttons and navigation

**Backend Routes:** /api/dashboard/*

**Frontend Pages:** /customer/dashboard, /seller/dashboard, /government/dashboard, /admin/dashboard, /admin/users, /admin/sellers, /admin/products, /admin/categories, /admin/officers, /admin/complaints, /admin/notices, /admin/analytics

**Key Features Working:**
- Role-based dashboards
- Real-time statistics
- Data visualization
- Management interfaces
- Quick navigation
- Responsive design

**Next Sprint:** Testing, Polish, and Deployment

---

---

# SPRINT 8: Testing, Polish & Deployment

**Duration:** 4-5 days  
**Goal:** Test system, fix bugs, optimize performance, and prepare for deployment

## Ticket 8.1: Backend Testing & Validation

### Description
Comprehensive backend testing including unit tests and API testing.

### Requirements

#### Create `backend/__tests__/` directory
```
Test structure:
- __tests__/auth.test.js - Auth endpoints
- __tests__/products.test.js - Product endpoints
- __tests__/orders.test.js - Order endpoints
- __tests__/complaints.test.js - Complaint endpoints
```

#### Install testing dependencies
```bash
npm install --save-dev jest supertest
Update package.json scripts:
"test": "jest --detectOpenHandles"
```

#### Test Cases for Each Endpoint
```javascript
For each route, create tests for:
- Successful request with valid data
- Invalid data validation
- Authentication/authorization
- Duplicate entries (where applicable)
- Empty/null data
- SQL injection attempt (if applicable)
- Error handling
```

### Test Coverage
- Authentication (register, login, token validation)
- Products (CRUD, search, filters)
- Cart (add, update, remove, clear)
- Orders (create, retrieve, status)
- Complaints (submit, track, update)
- Sellers (register, profile, verification)
- Notices (create, retrieve)
- Market monitoring (price tracking)

### Test Cases
- [ ] Unit tests pass
- [ ] All API endpoints tested
- [ ] Edge cases covered
- [ ] Error handling verified

---

## Ticket 8.2: Frontend Testing & Component Validation

### Description
Frontend component testing and UI validation.

### Requirements

#### Create `frontend/__tests__/` directory
```
Test structure:
- __tests__/components/ProductCard.test.jsx
- __tests__/pages/products.test.jsx
- __tests__/hooks/useAuth.test.jsx
```

#### Test Cases
```javascript
For each component:
- Renders correctly
- Props handled properly
- User interactions work
- Error states display
- Loading states display
- Mobile responsiveness

For each page:
- Page loads correctly
- API data displays
- Filters and searches work
- Forms validate
- Navigation works
```

### Manual Testing Checklist
- [ ] All pages load without errors
- [ ] Navigation works on desktop/tablet/mobile
- [ ] Forms validate input
- [ ] API calls succeed
- [ ] Error messages display
- [ ] Loading states show
- [ ] Responsive design verified

---

## Ticket 8.3: Performance Optimization

### Description
Optimize frontend and backend performance.

### Requirements

#### Frontend Optimization
```javascript
1. Image Optimization:
   - Lazy loading for images
   - Image compression
   - Use Next.js Image component

2. Code Splitting:
   - Route-based code splitting
   - Component lazy loading
   - Tree shaking unused code

3. Bundle Size:
   - Analyze bundle with webpack-bundle-analyzer
   - Remove unused dependencies
   - Minimize dependencies

4. Rendering:
   - Memoize expensive components
   - useCallback for functions
   - useMemo for calculations
   - Avoid unnecessary re-renders

5. Database Queries:
   - Pagination implementation
   - Indexing on frequently queried fields
   - Query optimization
```

#### Backend Optimization
```javascript
1. Database:
   - Add indexes to frequently queried fields
   - Optimize complex queries
   - Connection pooling

2. API:
   - Response caching (conditional)
   - Pagination for large datasets
   - Field selection (don't return unused fields)
   - Compression

3. Server:
   - Rate limiting
   - Request validation (fail fast)
   - Error handling efficiency

4. Code:
   - Remove console logs
   - Async/await optimization
   - Promise management
```

### Test Cases
- [ ] Bundle size acceptable
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Memory usage stable
- [ ] No console errors

---

## Ticket 8.4: Security Hardening

### Description
Implement security best practices.

### Requirements

#### Backend Security
```javascript
1. Authentication:
   - JWT expiration enforced
   - Password hashing verified
   - Token refresh mechanism

2. Authorization:
   - Role-based access control (RBAC)
   - Route protection
   - Resource ownership validation

3. Input Validation:
   - Sanitize all inputs
   - Validate data types
   - Prevent SQL injection
   - Prevent XSS

4. API Security:
   - CORS configuration
   - Rate limiting
   - Request size limits
   - HTTPS only (for production)

5. Environment:
   - Secrets in .env
   - No hardcoded passwords
   - Secure defaults
```

#### Frontend Security
```javascript
1. Authentication:
   - Secure token storage
   - Token expiration handling
   - Logout on token expiration

2. Data Protection:
   - Avoid storing sensitive data in localStorage
   - XSS prevention
   - Sanitize user input in forms

3. Communication:
   - HTTPS only
   - Validate API responses
   - Error handling without sensitive info
```

### Security Checklist
- [ ] No hardcoded secrets
- [ ] Passwords properly hashed
- [ ] JWT tokens validated
- [ ] RBAC enforced
- [ ] Input validation working
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Error messages don't leak info

---

## Ticket 8.5: Documentation & Code Comments

### Description
Complete project documentation.

### Requirements

#### Create Comprehensive README
```markdown
Location: /README.md

Sections:
1. Project Overview
2. Features Summary
3. Tech Stack
4. Installation Instructions
5. Configuration (environment variables)
6. Running the Project
7. API Documentation (summary)
8. Project Structure
9. Key Features
10. Testing Instructions
11. Deployment Instructions
12. Contributing Guidelines
13. License
14. Contact/Support
```

#### API Documentation
```markdown
Create: /BACKEND_API.md

For each endpoint document:
- HTTP method
- Route
- Required headers/auth
- Request body (example)
- Response body (example)
- Status codes
- Error responses
- Validation rules
```

#### Frontend Documentation
```markdown
Create: /FRONTEND_GUIDE.md

Sections:
- Component structure
- Available hooks
- State management approach
- Styling approach
- Routing structure
- Environment variables
- Build and deployment
```

#### Code Comments
- Comment complex logic
- Document custom hooks
- Comment API calls
- Document state management
- Add JSDoc comments for functions

### Test Cases
- [ ] README complete and accurate
- [ ] API documentation complete
- [ ] Code comments clear
- [ ] No missing documentation

---

## Ticket 8.6: Bug Fixes & Final Polish

### Description
Fix identified bugs and polish the application.

### Requirements

#### Bug Fixes
```javascript
Common areas to check:
1. Form validation edge cases
2. Error handling and messages
3. Loading and empty states
4. Mobile responsiveness issues
5. Browser compatibility
6. API error responses
7. Authentication/session management
8. Data consistency
9. Navigation flow issues
10. Component prop validation
```

#### Polish
```javascript
1. UI/UX:
   - Consistent spacing
   - Proper alignment
   - Color consistency
   - Typography consistency
   - Button states (hover, active, disabled)
   - Smooth transitions
   - Loading skeletons

2. User Experience:
   - Intuitive navigation
   - Clear error messages
   - Success confirmations
   - No dead links
   - Fast page load
   - Accessibility (basic)

3. Content:
   - Spell check
   - Grammar check
   - Consistent terminology
   - Realistic mock data

4. Performance:
   - No console errors
   - No memory leaks
   - Smooth scrolling
   - Responsive layout
```

#### Testing Checklist
- [ ] No console errors
- [ ] All forms work
- [ ] All navigation works
- [ ] All features functional
- [ ] Mobile friendly
- [ ] Desktop friendly
- [ ] Tablet friendly
- [ ] No broken images
- [ ] No dead links
- [ ] Error handling works

---

## Ticket 8.7: Deployment Preparation

### Description
Prepare project for deployment.

### Requirements

#### Environment Configuration
```
Create production .env files:
- backend/.env.production
- frontend/.env.production

Configure:
- Database connection (production MongoDB)
- API endpoints
- JWT secrets
- CORS origins
- API keys (if any)
```

#### Build Process
```bash
Frontend:
npm run build

Backend:
No build needed, but run linting:
npm run lint (add script)
```

#### Database Deployment
```
1. Create production MongoDB database
2. Run migrations/seeding if needed
3. Create indexes
4. Set up backups
```

#### Deployment Options
```
Recommended for university project:
1. Frontend: Vercel, Netlify, or GitHub Pages
2. Backend: Heroku, Railway, or any Node.js hosting
3. Database: MongoDB Atlas (free tier available)

Alternative:
- Deploy both on same VPS (DigitalOcean, AWS, etc.)
```

#### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Builds complete without errors
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Monitoring set up
- [ ] Error logging configured

---

## Ticket 8.8: Final Testing & Quality Assurance

### Description
Comprehensive final testing before delivery.

### Requirements

#### User Acceptance Testing (UAT)
```javascript
Test all major workflows:

1. Customer Journey:
   - Register/login
   - Browse products
   - Add to cart
   - Checkout
   - Place order
   - Track order
   - File complaint

2. Seller Journey:
   - Register as seller
   - Add products
   - Manage inventory
   - Manage orders
   - Track verification

3. Government Journey:
   - Review complaints
   - Verify sellers
   - Publish notices
   - Monitor prices
   - Generate reports

4. Admin Journey:
   - Manage users
   - Manage sellers
   - View analytics
   - Manage system
```

#### Regression Testing
```
Re-test all previous sprints:
- Sprint 1 functionality
- Sprint 2 functionality
- Sprint 3 functionality
- ... through Sprint 7
```

#### Browser Compatibility
```
Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers
```

#### Performance Testing
```
Check:
- Page load times
- API response times
- Database query times
- Memory usage
- CPU usage
- Concurrent users handling
```

### Test Cases
- [ ] All user workflows complete
- [ ] No regressions from earlier sprints
- [ ] Browser compatibility verified
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Accessibility basic level

---

## Sprint 8 Completion & Project Delivery

Once all tickets 8.1-8.8 are complete:

### ✅ Sprint 8 Summary & Project Completion
**Completed:**
- Comprehensive backend and frontend testing
- Performance optimization implemented
- Security hardening completed
- Full project documentation
- Bug fixes and polish
- Production deployment preparation
- Final quality assurance testing

**Documentation:**
- README.md with complete setup instructions
- BACKEND_API.md with all endpoint documentation
- FRONTEND_GUIDE.md with component documentation
- DEVELOPMENT.md (this file) with sprint guide

**Testing Status:**
- All unit tests passing
- Manual testing completed
- User acceptance testing verified
- Regression testing passed
- Performance benchmarks met
- Security audit completed

**Deployment:**
- Ready for production deployment
- Environment configuration complete
- Database set up
- CI/CD pipeline ready (optional)

---

## 🎉 PROJECT COMPLETE!

### System Features Delivered:
✅ **E-Commerce:** Product browsing, cart, checkout, orders, tracking
✅ **Seller Management:** Product management, order handling, verification
✅ **E-Governance:** Complaint system, seller verification, notices, price monitoring
✅ **Dashboards:** Role-based dashboards for all user types
✅ **Security:** Authentication, authorization, input validation
✅ **UI/UX:** Responsive design, professional interface, good accessibility
✅ **Documentation:** Complete API and setup documentation
✅ **Testing:** Comprehensive testing coverage
✅ **Performance:** Optimized frontend and backend
✅ **Deployment Ready:** Production-ready application

### What You Have Built:
A complete, production-quality e-commerce and e-governance platform demonstrating:
- Full-stack development capabilities
- Database design and optimization
- API development and security
- Frontend component architecture
- State management
- Testing practices
- Deployment readiness

---

## 📝 How to Use This Development Prompt

### For Each Sprint:
1. **Read the sprint overview** to understand goals and context
2. **Work through tickets sequentially** - they build on each other
3. **Follow all requirements** specified in each ticket
4. **Test as you go** using provided test cases
5. **At sprint end**, ask the AI tool for a sprint summary

### Between Sprints:
1. **Review the sprint summary** provided by the AI tool
2. **Verify all tests pass**
3. **Test the application manually**
4. **Fix any issues found**
5. **Type "continue"** or "next sprint" to proceed

### Important Notes:
- Keep the scope realistic for a university project
- Don't add features not listed in this document
- Focus on functionality over unnecessary polish
- Use mock data initially
- Test each feature before moving on
- Document as you go

### Success Criteria:
- All sprints completed
- All tests passing
- Application deployable
- Documentation complete
- Core features working
- Responsive design working
- Security implemented

---

## 📚 Additional Resources

### Useful Libraries (Already Listed)
- Mongoose (MongoDB ORM)
- JWT (Authentication)
- bcrypt (Password hashing)
- Express Validator (Input validation)
- Recharts (Data visualization)
- Lucide React (Icons)
- Tailwind CSS (Styling)

### Learning Resources
- Express.js documentation
- MongoDB documentation
- Next.js documentation
- React documentation
- Tailwind CSS documentation

---

**End of Development Prompt**

Good luck with your project! This is a substantial, real-world application that demonstrates strong full-stack development capabilities. Follow the sprints in order, test thoroughly, and you'll have an impressive portfolio piece.
