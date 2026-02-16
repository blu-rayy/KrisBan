# PM-Suite API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in the `Authorization` header:
```
Authorization: Bearer {token}
```

---

## Authentication Endpoints

### 1. Register User
Create a new user account.

**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email (must be unique) |
| password | string | Yes | Password (min 6 chars) |
| name | string | No | User's display name |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully. Please login to continue."
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "User already exists" | "Please provide email and password"
}
```

---

### 2. Login User
Authenticate user and get JWT token.

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Parameters:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**Response (200 OK) - Successful Login:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isFirstLogin": false
  }
}
```

**Response (403 Forbidden) - First Login Required:**
```json
{
  "success": false,
  "message": "First login detected. You must change your password before proceeding.",
  "requiresPasswordChange": true,
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isFirstLogin": true
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 3. Change Password (First Login)
Change password on first login. Uses temporary token from login response.

**POST** `/auth/change-password`

**Headers:**
```
Authorization: Bearer {tempToken}
```

**Request Body:**
```json
{
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| newPassword | string | Yes | New password (min 6 chars) |
| confirmPassword | string | Yes | Must match newPassword |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully. You can now access the dashboard.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isFirstLogin": false
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Passwords do not match" | "Password must be at least 6 characters"
}
```

---

### 4. Get Current User
Get profile of authenticated user.

**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isFirstLogin": false
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

## Dashboard Endpoints

### 5. Get Dashboard (Role-Based)
Get dashboard data. Returns different data based on user role.

**GET** `/dashboard`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK) - Admin User:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "ADMIN",
      "isFirstLogin": false
    },
    "boards": [
      {
        "_id": "607f1f77bcf86cd799439012",
        "title": "Website Redesign",
        "description": "Redesigning the company website",
        "owner": {
          "_id": "507f1f77bcf86cd799439011",
          "email": "admin@example.com",
          "name": "Admin User"
        },
        "members": [
          { "_id": "507f1f77bcf86cd799439013", "email": "user@example.com", "name": "John Doe" }
        ],
        "columns": [
          {
            "id": "col-1",
            "title": "To Do",
            "cards": [
              {
                "id": "card-1",
                "title": "Design mockups",
                "description": "Create Figma mockups",
                "priority": "HIGH",
                "assignee": "507f1f77bcf86cd799439013"
              }
            ]
          }
        ]
      }
    ],
    "summary": {
      "totalProjects": 3,
      "totalCards": 15,
      "role": "ADMIN",
      "progressReport": {
        "activeBoards": 3,
        "averageCardsPerBoard": "5.0"
      }
    }
  }
}
```

**Response (200 OK) - Regular User:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439013",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "isFirstLogin": false
    },
    "boards": [
      {
        "_id": "607f1f77bcf86cd799439012",
        "title": "Website Redesign",
        "description": "Redesigning the company website",
        "owner": { "_id": "507f1f77bcf86cd799439011", "email": "admin@example.com", "name": "Admin User" },
        "members": [{ "_id": "507f1f77bcf86cd799439013", "email": "user@example.com", "name": "John Doe" }],
        "columns": [...]
      }
    ],
    "summary": {
      "totalBoards": 2,
      "totalCards": 8,
      "role": "USER",
      "userInfo": {
        "asOwner": 1,
        "asMember": 1
      }
    }
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

### 6. Get Progress Report (Admin Only)
Detailed progress metrics for all projects. **Admin role required.**

**GET** `/dashboard/admin/progress-report`

**Headers:**
```
Authorization: Bearer {adminToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalBoards": 3,
    "boardsList": [
      {
        "id": "607f1f77bcf86cd799439012",
        "title": "Website Redesign",
        "owner": "admin@example.com",
        "memberCount": 2,
        "cardCount": 5,
        "columnCount": 3
      }
    ],
    "cardsByPriority": {
      "HIGH": 5,
      "MEDIUM": 7,
      "LOW": 3
    },
    "timestamp": "2024-02-16T10:30:00.000Z"
  }
}
```

**Error (403):**
```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

## Health Check Endpoint

### 7. Health Check
Check if the API is running.

**GET** `/health`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "PM-Suite Backend is running",
  "timestamp": "2024-02-16T10:30:00.000Z"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - User doesn't have permission / First login required |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

---

## Request Examples

### Example 1: Complete Login Flow (First Time)
```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "initial123",
    "name": "New User"
  }'

# 2. Login (First time - gets requiresPasswordChange)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "initial123"
  }'
# Response includes: tempToken, requiresPasswordChange: true

# 3. Change Password (using tempToken)
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {tempToken}" \
  -d '{
    "newPassword": "newsecure456",
    "confirmPassword": "newsecure456"
  }'
# Response includes: accessToken for dashboard
```

### Example 2: Normal Login Flow
```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
# Response includes: token (accessToken)

# 2. Access Dashboard
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer {token}"
```

### Example 3: Admin Progress Report
```bash
curl -X GET http://localhost:5000/api/dashboard/admin/progress-report \
  -H "Authorization: Bearer {adminToken}"
```

---

## Authentication Flow Diagram

```
┌─ Registration ──┐
│                 ↓
│ Create Account (isFirstLogin: true)
│                 ↓
└─ Login –────────┐
                  ↓
          Check isFirstLogin
                  ├─ YES ──────────────────┐
                  │                        ↓
                  │                Change Password Flow
                  │                (uses tempToken)
                  │                        ↓
                  │         Set isFirstLogin = false
                  │                        ↓
                  │       Get Access Token + Redirect
                  │
                  └─ NO ──□ Get Access Token
                          ↓
                    Access Dashboard
```

---

## Rate Limiting
Currently not implemented. Plan for future versions.

## CORS
CORS is enabled for all origins in development.
For production, configure specific origins.

## Versioning
Current API version: v1.0.0

---

For more information, see [SETUP_GUIDE.md](../SETUP_GUIDE.md)
