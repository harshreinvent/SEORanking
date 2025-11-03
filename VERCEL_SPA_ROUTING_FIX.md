# Fixing 404 on Reload (SPA Routing Issue)

## Problem
When you reload a page like `/dashboard`, you get a 404 error. This happens because:
- Browser requests `/dashboard` from the server
- Vercel looks for a file at that path
- File doesn't exist (React Router handles routes client-side)
- Result: 404 error

## Solution: Configure Vercel Rewrites

The `vercel.json` has rewrites, but you also need to configure it in Vercel Dashboard.

## Step-by-Step Fix

### Option 1: Verify Vercel Project Settings (Recommended)

1. **Go to Vercel Dashboard** → Your Project
2. **Settings** → **General**
3. **Root Directory**: Should be `frontend` (or empty if repo root)
4. **Settings** → **Build & Development Settings**:
   - **Framework Preset**: `Vite` (or `Other`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Option 2: Ensure Rewrites Are Applied

The `vercel.json` I created has the correct rewrites. Make sure:

1. The file is in the **repository root** (not in `frontend/`)
2. After pushing, Vercel should use it automatically

### Option 3: Manual Rewrite in Vercel Dashboard

If `vercel.json` isn't working:

1. **Go to Vercel Dashboard** → Your Project
2. **Settings** → **Deployment**
3. Look for **Redirects/Rewrites** section
4. Add rewrite rule:
   - **Source**: `/(.*)`
   - **Destination**: `/index.html`
   - **Permanent**: No (302 redirect)

## What the Rewrite Does

The rewrite rule:
```json
{
  "source": "/(.*)",
  "destination": "/index.html"
}
```

This tells Vercel: "For any path that doesn't match a file, serve `index.html` instead."

This allows React Router to handle the routing on the client side.

## Testing

After applying the fix:

1. **Deploy/Redeploy** on Vercel
2. Visit: `https://seo-ranking-psi.vercel.app/dashboard`
3. **Reload the page** (Ctrl+R or F5)
4. Should **NOT** get 404 - React Router handles it

## Alternative: Use Hash Router (Not Recommended)

If rewrites still don't work, you could switch to HashRouter:

**frontend/src/main.jsx:**
```javascript
import { HashRouter } from 'react-router-dom'; // Instead of BrowserRouter
```

But this makes URLs look like: `/dashboard#/` which is ugly.

## Common Issues

### Issue 1: Rewrites Not Applied
**Solution**: Make sure `vercel.json` is in the root and pushed to GitHub

### Issue 2: Wrong Root Directory
**Solution**: If Root Directory is set to `frontend`, the rewrites in root `vercel.json` might not work. Either:
- Remove Root Directory setting (use repo root)
- OR create `frontend/vercel.json` with rewrites

### Issue 3: Build Output Wrong
**Solution**: Verify `dist` folder contains `index.html` after build

## Verify It's Working

1. Build locally: `cd frontend && npm run build`
2. Check `frontend/dist/index.html` exists
3. Push to GitHub
4. Vercel should auto-deploy
5. Test reloading `/dashboard` - should work!

