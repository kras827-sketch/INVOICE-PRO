# Render.com Backend Deployment

## Quick Start

1. Go to [Render.com](https://render.com) and sign up/login
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repo: `kras827-sketch/INVOICE-PRO`
4. Configure:
   - **Name**: invoice-pro-api
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. Add Environment Variables (from your backend/.env):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `FRONTEND_URL` = `https://invoice-api-78823.web.app`
   - `NODE_ENV` = `production`

6. Click **"Create Web Service"**

Your backend will be at: `https://invoice-pro-api.onrender.com`

## Then Update Frontend

After Render deploys, update `frontend/.env.production`:
```
VITE_API_URL=https://invoice-pro-api.onrender.com
```

Then rebuild and redeploy:
```bash
cd frontend && npm run build && cd .. && firebase deploy --only hosting
```
