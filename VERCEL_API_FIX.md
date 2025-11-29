# Vercel API Routes Fix

## The 404 Error Issue

The 404 error for `/api/auth/login` happens because Vercel needs to recognize the API routes. Here's how to fix it:

## Solution 1: Ensure API Routes are Detected

Vercel automatically detects serverless functions in the `api/` directory. Make sure:

1. **File Structure is Correct:**
   ```
   api/
     auth/
       login.ts  ✅
   ```

2. **Files Export Default Handler:**
   ```typescript
   export default async function handler(req, res) {
     // ...
   }
   ```

3. **Vercel Detects TypeScript:**
   - Vercel automatically compiles TypeScript files in `api/`
   - No build step needed for API routes

## Solution 2: Check Vercel Deployment Settings

In Vercel Dashboard:

1. Go to **Settings** → **General**
2. Under **Build & Development Settings**:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

3. **Root Directory**: Leave empty (or set to `./`)

## Solution 3: Verify API Routes are Deployed

After deployment:

1. Go to **Deployments** tab
2. Click on your latest deployment
3. Go to **Functions** tab
4. You should see:
   - `/api/auth/login`
   - `/api/measurements`
   - etc.

If functions are missing, the API routes aren't being detected.

## Solution 4: Test API Route Directly

Test if the API route is accessible:

```bash
# Replace with your Vercel URL
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Or in browser console:
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Common Issues

### Issue: API routes return 404
**Cause**: Vercel not detecting API routes
**Fix**: 
- Ensure files are in `api/` directory
- Files must export default handler
- Redeploy after changes

### Issue: "Cannot find module" errors
**Cause**: Dependencies not installed
**Fix**: 
- Ensure `package.json` has all dependencies
- Vercel installs dependencies automatically

### Issue: Database connection errors
**Cause**: DATABASE_URL not set
**Fix**: 
- Set `DATABASE_URL` in Vercel environment variables
- Redeploy after adding variables

## Manual Test

1. Deploy to Vercel
2. Check Functions tab in deployment
3. If `/api/auth/login` appears, it should work
4. If not, check file structure and exports

## Alternative: Use Vercel CLI

Test locally with Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

This will run your app locally and show if API routes are detected.

