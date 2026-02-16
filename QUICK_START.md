# PM-Suite - Quick Start Guide

## What Was Built

You now have a complete full-stack Project Management application scaffolded with Priority 1 features fully implemented:

### ✅ Backend (Node.js/Express)
- **MVC Architecture**: Controllers, Models, Routes, Middleware
- **Authentication**: JWT-based with first-login password change requirement
- **Database**: MongoDB with Mongoose
- **Security**: bcryptjs password hashing, helmet, CORS
- **Models**:
  - User (with isFirstLogin flag)
  - Board (Kanban structure)

### ✅ Frontend (React/Vite)
- **React Router**: Protected routes with role-based access
- **Auth Context**: Global authentication state management
- **Tailwind CSS**: Modern, responsive UI
- **Components**: Login, Change Password, Dashboard

### ✅ Features Implemented
1. User registration with secure password hashing
2. JWT-based login system
3. **First-login password change flow** (critical business logic)
4. Role-based dashboard (Admin vs User)
5. Protected API routes
6. Admin progress reporting

---

## 30-Second Setup

### 1. Install Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (default settings work locally)
```

### 2. Install Frontend
```bash
cd ../frontend
npm install
```

### 3. Seed Database (Optional)
```bash
cd backend
npm run seed
# Creates test users and sample data
```

### 4. Start Backend (Terminal 1)
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### 5. Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## Test the Application

### Quick Test with Demo Accounts (after npmseed)
```
Admin Login:
Email: admin@example.com
Password: password123

Regular User:
Email: user@example.com
Password: password123
```

### Test First-Login Flow
1. **Register** a new user: Use any email/password
2. **Login** with that account
3. **See the password change flow** - API returns 403 (First Login Required)
4. **Change password** page appears
5. **Enter new password** to get dashboard access

### Test Role-Based Access
- **Login as Admin** → See all projects + Progress Report
- **Login as User** → See only assigned boards

---

## Project Structure

```
KrisBan/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/ (authController, dashboardController)
│   │   ├── middleware/ (auth.js - JWT verification)
│   │   ├── models/ (User.js, Board.js)
│   │   ├── routes/ (authRoutes, dashboardRoutes)
│   │   └── server.js
│   ├── package.json
│   ├── .env.example
│   └── src/seed.js (optional: creates demo data)
│
├── frontend/
│   ├── src/
│   │   ├── components/ (PrivateRoute.jsx)
│   │   ├── context/ (AuthContext.jsx - state management)
│   │   ├── pages/ (LoginPage, ChangePasswordPage, DashboardPage)
│   │   ├── services/ (api.js - HTTP client)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── README.md (overview)
├── SETUP_GUIDE.md (detailed setup)
└── API_DOCUMENTATION.md (API reference)
```

---

## Key Files to Understand

### Backend

**[backend/src/server.js](backend/src/server.js)**
- Express app setup
- Middleware configuration (CORS, Helmet)
- Route mounting

**[backend/src/models/User.js](backend/src/models/User.js)**
- User schema with isFirstLogin flag
- Password hashing with bcryptjs
- Password comparison method

**[backend/src/controllers/authController.js](backend/src/controllers/authController.js)**
- JWT token generation
- **Critical logic**: If isFirstLogin === true, return 403 with requiresPasswordChange
- Change password endpoint sets isFirstLogin = false

**[backend/src/middleware/auth.js](backend/src/middleware/auth.js)**
- JWT verification
- Role checking (protect and requireAdmin)

### Frontend

**[frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)**
- Global auth state (user, token, requiresPasswordChange)
- Login, logout, changePassword methods
- Handles both tempToken and accessToken

**[frontend/src/pages/LoginPage.jsx](frontend/src/pages/LoginPage.jsx)**
- Login form
- Handles registration or existing user login

**[frontend/src/pages/ChangePasswordPage.jsx](frontend/src/pages/ChangePasswordPage.jsx)**
- Shown when API returns requiresPasswordChange: true
- Uses tempToken from login response
- Updates user's password and gets full access

**[frontend/src/pages/DashboardPage.jsx](frontend/src/pages/DashboardPage.jsx)**
- Role-based dashboard rendering
- Admin: Shows all projects + progress report
- User: Shows assigned boards

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login (handles first-login flow)
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard` - Dashboard data (role-based)
- `GET /api/dashboard/admin/progress-report` - Admin report only

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete details.

---

## Common Tasks

### Add More Models (e.g., Projects, Tasks)

1. **Create model** in `backend/src/models/`
```javascript
// backend/src/models/Task.js
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: String,
  // ... fields
});

export default mongoose.model('Task', taskSchema);
```

2. **Create controller** in `backend/src/controllers/`
```javascript
// backend/src/controllers/taskController.js
export const getTasks = async (req, res) => {
  // logic
};
```

3. **Create routes** in `backend/src/routes/`
```javascript
// backend/src/routes/taskRoutes.js
import { getTasks } from '../controllers/taskController.js';
router.get('/tasks', getTasks);
```

4. **Mount routes** in `server.js`
```javascript
import taskRoutes from './routes/taskRoutes.js';
app.use('/api/tasks', taskRoutes);
```

### Deploy to Production

**Backend**: Deploy to Heroku, Railway, Render, or AWS
**Frontend**: Deploy to Vercel, Netlify, or GitHub Pages

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection failed | Ensure mongod is running or check MongoDB Atlas URI |
| Port 5000 already in use | Change PORT in .env |
| Frontend can't reach API | Check vite.config.js proxy settings |
| Can't login after registration | Data should be in MongoDB; check connection |
| JWT errors | Verify JWT_SECRET in .env |

---

## Next Steps (Priority 2+ Features)

- [ ] Kanban board CRUD operations
- [ ] Drag-and-drop card functionality
- [ ] Google Drive integration
- [ ] PDF viewer and annotation
- [ ] Real-time collaboration (WebSockets)
- [ ] Email notifications
- [ ] File uploads
- [ ] Advanced filtering and search
- [ ] User role management
- [ ] Project templates

---

## Technology Stack Reference

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | UI library |
| | Vite | Build tool (fast HMR) |
| | Tailwind CSS | Styling |
| | React Router | Client routing |
| | Axios | HTTP client |
| Backend | Node.js | Runtime |
| | Express | Web framework |
| | MongoDB | Database |
| | Mongoose | ODM |
| | JWT | Authentication |
| | bcryptjs | Password hashing |
| | Helmet | HTTP security |

---

## Documentation Files

- **README.md** - Project overview
- **SETUP_GUIDE.md** - Detailed setup and architecture
- **API_DOCUMENTATION.md** - Complete API reference
- **This file** - Quick start reference

---

## Support

For questions or issues:
1. Check the documentation files above
2. Review the code comments
3. Check the console for error messages
4. Verify environment variables are set correctly

---

**You're all set! Happy coding! 🚀**
