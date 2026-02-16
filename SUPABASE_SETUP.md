# Supabase Setup Guide

This project has been refactored to use **Supabase** (PostgreSQL) instead of MongoDB.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project" and create a new project
3. Choose your region and set a strong database password
4. Wait for the project to be created (typically 2-3 minutes)

## 2. Get Your Credentials

1. In Supabase dashboard, go to **Settings → API**
2. Under "Project API keys", copy:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Key** (public) → `SUPABASE_ANON_KEY`

3. (Optional) For server-side operations, you can also use the **Service Role Key** for elevated permissions

## 3. Create Database Tables

Run the following SQL in your Supabase SQL Editor (go to **SQL** section):

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) DEFAULT '',
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
  is_first_login BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Create boards table
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  owner UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  members UUID[] DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on owner for faster lookups
CREATE INDEX idx_boards_owner ON boards(owner);

-- Create index on status for filtering
CREATE INDEX idx_boards_status ON boards(status);
```

## 4. Update Environment Variables

Update your `.env` file in the `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Existing variables (keep these)
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
NODE_ENV=development
PORT=5000
```

## 5. Install Dependencies

```bash
cd backend
npm install
```

This will install `@supabase/supabase-js` and other required packages.

## 6. Seed the Database (Optional)

To populate test data:

```bash
cd backend
npm run seed
```

This will create:
- **Admin User**: admin@example.com / password123
- **Regular Users**: user@example.com, alice@example.com / password123
- **Sample Boards** with test data

## 7. Start the Server

```bash
npm run dev
```

## Important Data Structure Changes

### Users Table
- `id` (UUID): Primary key
- `email` (VARCHAR): User email
- `password` (VARCHAR): Hashed password
- `name` (VARCHAR): User name
- `role` (VARCHAR): 'ADMIN' or 'USER'
- `is_first_login` (BOOLEAN): Tracks first login
- `is_active` (BOOLEAN): Account status
- `created_at`, `updated_at`: Timestamps

### Boards Table
- `id` (UUID): Primary key
- `title` (VARCHAR): Board title
- `description` (TEXT): Board description
- `owner` (UUID): Foreign key to users
- `members` (UUID[]): Array of user IDs
- `columns` (JSONB): Stores columns and cards data (nested structure)
- `status` (VARCHAR): 'ACTIVE' or 'ARCHIVED'
- `created_at`, `updated_at`: Timestamps

**Note**: The `columns` field uses **JSONB** to maintain the nested structure of columns and cards, preserving the original data model.

## Troubleshooting

### Connection Errors
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active
- Ensure firewall allows connections to Supabase

### Table Creation Issues
- Run each SQL statement individually if batch create fails
- Check Supabase SQL Editor for error messages
- Verify you have database access permissions

### Authentication Issues
- Clear JWT tokens after password changes
- Verify JWT_SECRET matches between login and token verification
- Check token expiration times

## API Endpoints (Unchanged)

All API endpoints remain the same:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/admin/progress-report` - Admin progress report

## Frontend Configuration

The frontend API client (`.env` in `frontend/`) should remain unchanged:

```env
VITE_API_URL=http://localhost:5000
```

## Next Steps

1. Update any custom queries or filters for Supabase syntax
2. Test all CRUD operations
3. Set up Row Level Security (RLS) policies if needed
4. Configure backups in Supabase dashboard
5. Review and adjust indexes for query performance if needed

For more information, visit [Supabase Documentation](https://supabase.com/docs)
