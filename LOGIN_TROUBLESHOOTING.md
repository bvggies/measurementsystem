# Login Troubleshooting Guide

## Common Login Issues

### 1. "[object Object]" Error (FIXED)
✅ This has been fixed. You should now see proper error messages.

### 2. "Unable to connect to server"
**Possible causes:**
- API endpoint not accessible
- Network/CORS issues
- Vercel deployment not complete

**Solutions:**
- Check browser console for detailed errors
- Verify API routes are deployed on Vercel
- Check network tab in browser DevTools

### 3. "Invalid credentials"
**Possible causes:**
- User doesn't exist in database
- Password is incorrect
- Password hash mismatch

**Solutions:**
- Verify user exists in database:
  ```sql
  SELECT email, role FROM users WHERE email = 'admin@example.com';
  ```
- Reset password hash:
  ```sql
  -- Generate new hash for 'admin123'
  -- Use Node.js: const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(console.log);
  UPDATE users SET password_hash = '$2a$10$YOUR_HASH_HERE' WHERE email = 'admin@example.com';
  ```

### 4. "Internal server error"
**Possible causes:**
- Database connection failed
- DATABASE_URL not set in Vercel
- Database schema not created

**Solutions:**
1. **Check Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify `DATABASE_URL` is set correctly
   - Format: `postgresql://user:password@host/database?sslmode=require`

2. **Check Database Connection:**
   - Test connection in Neon dashboard
   - Verify database is not paused
   - Check connection string is correct

3. **Verify Database Schema:**
   - Run `database/schema.sql` in Neon SQL Editor
   - Verify `users` table exists:
     ```sql
     SELECT * FROM users LIMIT 1;
     ```

4. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on latest deployment → Functions tab
   - Check logs for `/api/auth/login` function

### 5. Create Admin User Manually

If you need to create an admin user:

**Option A: Using Node.js (Local)**
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"
```

Then in Neon SQL Editor:
```sql
INSERT INTO users (name, email, role, password_hash)
VALUES (
  'Admin User',
  'admin@example.com',
  'admin',
  'PASTE_HASH_HERE'
);
```

**Option B: Using Seed Script**
```bash
# Make sure DATABASE_URL is set in .env
npm run seed
```

### 6. Test Login API Directly

You can test the login API directly:

```bash
# Using curl
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Or using browser console
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
}).then(r => r.json()).then(console.log).catch(console.error);
```

## Debugging Steps

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for error messages
   - Check Network tab for failed requests

2. **Check Vercel Logs:**
   - Vercel Dashboard → Project → Deployments
   - Click on deployment → Functions
   - View logs for `/api/auth/login`

3. **Verify Environment Variables:**
   - DATABASE_URL is set
   - JWT_SECRET is set
   - Both are set for Production, Preview, and Development

4. **Test Database Connection:**
   ```sql
   -- In Neon SQL Editor
   SELECT COUNT(*) FROM users;
   SELECT email, role FROM users;
   ```

## Default Credentials

After running the seed script:
- **Email:** `admin@example.com`
- **Password:** `admin123`

## Still Having Issues?

1. Check Vercel function logs for detailed error messages
2. Verify database is accessible from Vercel
3. Ensure all environment variables are set
4. Try creating a new user manually in the database
5. Check that the database schema is fully created

