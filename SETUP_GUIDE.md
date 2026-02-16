# PM-Suite Setup & Installation Guide

## Architecture Overview

PM-Suite implements a clean MVC (Model-View-Controller) pattern:

```
Backend (Node.js/Express)
├── Models (Mongoose schemas)
├── Controllers (business logic)
├── Routes (API endpoints)
└── Middleware (JWT auth, error handling)

Frontend (React/Vite)
├── Components (UI components)
├── Pages (route pages)
├── Services (API client)
└── Context (state management)
```

## Database Choice: MongoDB with Mongoose

**Why MongoDB over PostgreSQL?**

For a Kanban application:
- **Nested Documents**: MongoDB's JSON-like structure perfectly maps to Kanban hierarchy (Board → Columns → Cards)
- **Flexibility**: Easy schema evolution for cards with varying attributes
- **Performance**: No complex JOINs for hierarchical data
- **Scalability**: Better horizontal scaling for growing data

## Backend: Complete Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

This installs:
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT implementation
- `bcryptjs`: Password hashing
- `cors`: Cross-origin requests
- `helmet`: Security headers
- `dotenv`: Environment variables
- `nodemon`: Development auto-reload

### Step 2: Environment Configuration
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pm-suite
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
NODE_ENV=development
```

### Step 3: MongoDB Connection
Ensure MongoDB is running:
```bash
# On Windows with MongoDB installed
mongod
```

Or use MongoDB Atlas (cloud):
```
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/pm-suite
```

### Step 4: Start Backend
```bash
npm run dev
```

Server runs on: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

## Frontend: Complete Setup

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

This installs:
- `react`: UI library
- `react-router-dom`: Client-side routing
- `axios`: HTTP client
- `tailwindcss`: Utility CSS framework
- `vite`: Build tool

### Step 2: Start Development Server
```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

## API Contract

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please login to continue."
}
```

#### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (First Login - 403):**
```json
{
  "success": false,
  "message": "First login detected. You must change your password before proceeding.",
  "requiresPasswordChange": true,
  "tempToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isFirstLogin": true
  }
}
```

**Response (Normal Login - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isFirstLogin": false
  }
}
```

#### POST /api/auth/change-password
**Headers:** `Authorization: Bearer {tempToken}`

**Request:**
```json
{
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password changed successfully. You can now access the dashboard.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isFirstLogin": false
  }
}
```

### Dashboard Endpoint

#### GET /api/dashboard
**Headers:** `Authorization: Bearer {token}`

**Response (Admin - 200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "admin@example.com", "role": "ADMIN" },
    "boards": [{ "id": "...", "title": "Project A", ... }],
    "summary": {
      "totalProjects": 5,
      "totalCards": 42,
      "role": "ADMIN",
      "progressReport": {
        "activeBoards": 5,
        "averageCardsPerBoard": "8.4"
      }
    }
  }
}
```

**Response (User - 200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "user@example.com", "role": "USER" },
    "boards": [{ "id": "...", "title": "Board 1", ... }],
    "summary": {
      "totalBoards": 2,
      "totalCards": 10,
      "role": "USER",
      "userInfo": {
        "asOwner": 1,
        "asMember": 1
      }
    }
  }
}
```

## First Login Flow Diagram

```
User Registration
      ↓
[isFirstLogin = true]
      ↓
User Login Attempt
      ↓
Backend Checks isFirstLogin
      ├─ YES → Return 403 + requiresPasswordChange: true
      │           ↓
      │     Frontend Redirect to /change-password
      │           ↓
      │     User Enters New Password
      │           ↓
      │     Backend Sets isFirstLogin = false
      │           ↓
      │     Return Access Token
      │           ↓
      │     Frontend Redirect to /dashboard
      │
      └─ NO → Return Access Token
                   ↓
            Frontend Redirect to /dashboard
```

## Role-Based Access Control

### ADMIN Role
- Can view all projects
- Can access progress report dashboard
- Endpoint: `/api/dashboard/admin/progress-report`

### USER Role
- Can view only assigned boards
- Normal dashboard view
- Endpoint: `/api/dashboard`

## Security Implementation

### Password Hashing
```javascript
// Automatic during save via Mongoose pre-hook
const salt = await bcryptjs.genSalt(10);
userSchema.pre('save', async function(next) {
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});
```

### JWT Token
```javascript
jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE } // 7 days
)
```

### Protected Routes
All dashboard routes require valid JWT:
```javascript
import { protect } from './middleware/auth.js';
router.get('/dashboard', protect, getDashboard);
```

Admin-only routes require both JWT and role check:
```javascript
import { protect, requireAdmin } from './middleware/auth.js';
router.get('/admin/report', protect, requireAdmin, getReport);
```

## Testing

### Manual Testing via cURL

#### Register:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test User"}'
```

#### Login (First Time):
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

#### Change Password:
```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {tempToken}" \
  -d '{"newPassword":"newpass456","confirmPassword":"newpass456"}'
```

#### Get Dashboard:
```bash
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer {accessToken}"
```

## Troubleshooting

### MongoDB Connection Failed
- Check if `mongod` is running
- Verify `MONGODB_URI` in .env
- For MongoDB Atlas, whitelist your IP

### JWT Errors
- Verify `JWT_SECRET` matches between registration and login
- Check token hasn't expired
- Include `Authorization: Bearer {token}` header

### CORS Errors
- Backend: Cors is enabled in server.js
- Frontend: Proxy is configured in vite.config.js

### Port Conflicts
- Change PORT in .env (backend)
- Change port in vite.config.js (frontend)

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Use MongoDB Atlas (cloud)
4. Deploy to: Heroku, Railway, Render

### Frontend
```bash
npm run build
# Deploy dist/ folder to: Vercel, Netlify, GitHub Pages
```

## File Structure Reference

See [backend/src/](backend/src/) and [frontend/src/](frontend/src/) for complete file organization.
