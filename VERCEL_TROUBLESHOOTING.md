# Vercel 404 Error Troubleshooting Guide

## Current Issue: 404 NOT_FOUND for `/api/auth/login`

## Step-by-Step Fix

### 1. Verify Vercel Project Settings

In Vercel Dashboard → Your Project → Settings → General:

- **Framework Preset**: `Other` or `Create React App`
- **Root Directory**: Leave empty (or `./`)
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 2. Check Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

Ensure these are set:
- `DATABASE_URL` - Your Neon Postgres connection string
- `JWT_SECRET` - A secret key for JWT tokens

**Important**: After adding/changing environment variables, you MUST redeploy!

### 3. Verify API Route Structure

Your API routes should be in:
```
api/
  auth/
    login.js  ✅ (JavaScript file)
  utils/
    db.js
    auth.js
```

### 4. Check Deployment Logs

1. Go to Vercel Dashboard → Deployments
2. Click on your latest deployment
3. Check the **Build Logs** for any errors
4. Check the **Functions** tab - you should see `/api/auth/login` listed

If `/api/auth/login` is NOT in the Functions tab, Vercel isn't detecting it.

### 5. Test API Route Directly

After deployment, test the route:

```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Or in browser console on your deployed site:
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
})
.then(r => r.json())
.then(console.log)
.catch(err => console.error('Error:', err));
```

### 6. If Still 404: Force Redeploy

1. In Vercel Dashboard → Deployments
2. Click the three dots (⋯) on your latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete
5. Check Functions tab again

### 7. Alternative: Use Vercel CLI to Test Locally

```bash
npm install -g vercel
vercel dev
```

This will:
- Run your app locally
- Show which API routes are detected
- Help debug routing issues

### 8. Check vercel.json

Current `vercel.json`:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": null,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This should work, but if it doesn't, try this minimal version:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Vercel should auto-detect API routes without explicit rewrites.

### 9. Verify API Route Export

The `api/auth/login.js` file should export a default handler:

```javascript
module.exports = async (req, res) => {
  // handler code
};
```

This is correct ✅

### 10. Common Causes of 404

1. **API route not in `api/` directory** - Must be exactly `api/`
2. **Wrong export format** - Must be `module.exports` or `export default`
3. **Missing dependencies** - Check build logs for errors
4. **Environment variables not set** - Check Vercel dashboard
5. **Deployment didn't include API files** - Check Functions tab
6. **Caching issues** - Try hard refresh or incognito mode

### 11. Nuclear Option: Recreate Project

If nothing works:

1. In Vercel Dashboard → Settings → General
2. Scroll to bottom → **Delete Project**
3. Reconnect your GitHub repo
4. Set environment variables again
5. Deploy fresh

## Expected Behavior

After successful deployment:
- ✅ Functions tab shows `/api/auth/login`
- ✅ Direct API call returns JSON (not 404)
- ✅ Login form works in the app

## Still Having Issues?

Check:
1. Vercel deployment logs for errors
2. Browser console for network errors
3. Vercel Functions tab for detected routes
4. GitHub repo to ensure files are committed

