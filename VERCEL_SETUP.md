# Vercel Environment Variables Setup Guide

## Quick Fix for "DATABASE_URL references Secret" Error

The error occurs because `vercel.json` was trying to reference secrets that don't exist. I've removed those references. Now you need to set environment variables directly in Vercel.

## Step-by-Step Instructions

### 1. Go to Vercel Dashboard

1. Visit [vercel.com](https://vercel.com) and sign in
2. Select your project (measurementsystem)
3. Go to **Settings** → **Environment Variables**

### 2. Add Environment Variables

Click **Add New** and add these variables:

#### Required Variables:

**DATABASE_URL**
- **Key**: `DATABASE_URL`
- **Value**: Your Neon connection string
  ```
  postgresql://neondb_owner:npg_RmuGETi0g3wU@ep-sweet-wind-ahq3i2eq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
  ```
- **Environment**: Select all (Production, Preview, Development)

**JWT_SECRET**
- **Key**: `JWT_SECRET`
- **Value**: Generate a secure random string
  - On Windows PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`
  - On Mac/Linux: `openssl rand -hex 32`
  - Or use an online generator: https://randomkeygen.com/
- **Environment**: Select all (Production, Preview, Development)

#### Optional Variables:

**REACT_APP_API_URL** (if needed)
- **Key**: `REACT_APP_API_URL`
- **Value**: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- **Environment**: Select all

### 3. Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

### 4. Verify

1. Check the deployment logs to ensure it builds successfully
2. Visit your app URL
3. Try logging in with your admin credentials

## Alternative: Using Vercel CLI

If you prefer using the command line:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Add environment variables
vercel env add DATABASE_URL
# Paste your connection string when prompted
# Select all environments (Production, Preview, Development)

vercel env add JWT_SECRET
# Paste your JWT secret when prompted
# Select all environments

# Redeploy
vercel --prod
```

## Troubleshooting

### If variables still don't work:

1. **Check variable names**: They must be exactly `DATABASE_URL` and `JWT_SECRET` (case-sensitive)
2. **Check environments**: Make sure you selected the correct environments (Production, Preview, Development)
3. **Redeploy**: Environment variables only apply to new deployments
4. **Check logs**: Go to your deployment → Functions → View logs to see if variables are being read

### Common Issues:

**"DATABASE_URL is undefined"**
- Make sure the variable is set in Vercel dashboard
- Redeploy after adding variables
- Check that variable name matches exactly

**"Connection refused"**
- Verify your Neon connection string is correct
- Check that `?sslmode=require` is included
- Ensure Neon project is not paused

**"JWT_SECRET is missing"**
- Add JWT_SECRET in Vercel dashboard
- Use a strong random string (at least 32 characters)
- Redeploy after adding

## Your Current Database Connection

Based on your earlier setup, your DATABASE_URL should be:
```
postgresql://neondb_owner:npg_RmuGETi0g3wU@ep-sweet-wind-ahq3i2eq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Make sure to copy this exactly when adding it to Vercel.

## Security Note

⚠️ **Never commit environment variables to Git!** They should only be set in Vercel dashboard or using Vercel CLI. The `.env` file is already in `.gitignore` to prevent accidental commits.

