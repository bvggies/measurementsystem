# Deployment Guide

## Quick Start Deployment to Vercel + Neon

### Step 1: Set up Neon Database

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy your connection string (it will look like: `postgresql://user:password@host/database?sslmode=require`)
4. Save this for later

### Step 2: Set up GitHub Repository

1. Create a new repository on GitHub
2. Push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 4: Configure Environment Variables

In Vercel project settings, add these environment variables:

- `DATABASE_URL`: Your Neon connection string
- `JWT_SECRET`: Generate a secure random string (e.g., `openssl rand -hex 32`)

### Step 5: Set up Database Schema

1. Go to your Neon dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL script

### Step 6: Seed the Database

You can seed the database in two ways:

**Option A: Using the seed script locally**

1. Clone your repository locally
2. Create a `.env` file with your `DATABASE_URL`
3. Run: `npm install && npm run seed`

**Option B: Using Neon SQL Editor**

1. Create an admin user manually:

```sql
INSERT INTO users (name, email, role, password_hash)
VALUES (
  'Admin User',
  'admin@example.com',
  'admin',
  '$2a$10$YourHashedPasswordHere' -- Use bcrypt to hash 'admin123'
);
```

### Step 7: Verify Deployment

1. Visit your Vercel deployment URL
2. Login with:
   - Email: `admin@example.com`
   - Password: `admin123` (or the password you set)

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon Postgres connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT signing | Random 32+ character string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | API base URL | Current origin |

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct in Vercel environment variables
- Ensure SSL mode is enabled (`?sslmode=require`)
- Check Neon project is active and not paused

### Build Failures

- Check Node.js version (should be 16+)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### API Errors

- Verify environment variables are set correctly
- Check Vercel function logs
- Ensure database schema is created

### File Upload Issues

- For production, consider using Vercel Blob Storage or Cloudinary
- Current implementation uses base64 encoding (limited to ~10MB)

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Set up database backups in Neon
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring/error tracking
- [ ] Review and update CORS settings if needed
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure rate limiting for API endpoints
- [ ] Set up file storage service for uploads
- [ ] Enable database connection pooling

## Scaling Considerations

- **Database**: Neon supports auto-scaling
- **API**: Vercel serverless functions auto-scale
- **File Storage**: Consider Vercel Blob or AWS S3 for large files
- **Caching**: Add Redis for session storage and caching
- **CDN**: Vercel provides CDN automatically

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong JWT secrets** - Generate with `openssl rand -hex 32`
3. **Enable database SSL** - Always use `sslmode=require`
4. **Regular updates** - Keep dependencies updated
5. **Rate limiting** - Implement on sensitive endpoints
6. **Input validation** - Already implemented in API
7. **SQL injection protection** - Using parameterized queries

## Monitoring

- **Vercel Analytics**: Enable in project settings
- **Database Monitoring**: Use Neon dashboard
- **Error Tracking**: Consider Sentry or similar
- **Logs**: Check Vercel function logs

## Backup Strategy

1. **Database Backups**: Neon provides automatic backups
2. **Code Backups**: GitHub repository
3. **Environment Variables**: Document in secure location
4. **Regular Exports**: Export measurement data periodically

