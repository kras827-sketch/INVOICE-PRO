# 🚀 InvoicePro — Production Deployment Guide

A step-by-step guide to deploying InvoicePro for investor testing.

## Architecture

```
┌──────────────────┐     HTTPS      ┌────────────────────┐     MongoDB     ┌────────────────┐
│   Vercel          │◄──────────────►│   Render             │◄─────────────►│ MongoDB Atlas    │
│   (React SPA)     │  API calls +   │   (Node/Express)     │               │ (Database)       │
│                   │  Firebase token│                      │               │                  │
└────────┬─────────┘               └──────────┬───────────┘               └────────────────┘
         │                                     │
         │   Firebase Auth (Login/Signup)       │  Firebase Admin SDK
         └──────────┬──────────────────────────┘  (Token verification)
                    ▼
            ┌───────────────┐
            │ Firebase Auth  │
            └───────────────┘
```

| Component       | Service        | URL Pattern                              |
|----------------|----------------|------------------------------------------|
| Frontend       | Vercel         | `https://invoicepro.vercel.app`          |
| Backend API    | Render         | `https://invoicepro-api.onrender.com`    |
| Database       | MongoDB Atlas  | `mongodb+srv://...`                      |
| Authentication | Firebase Auth  | Managed by Google                        |

---

## 1. MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a cluster (free M0 tier is fine for MVP)
3. **Database Access** → Create a user with read/write access
4. **Network Access** → Add `0.0.0.0/0` to allow connections from Render
   > ⚠️ For production, restrict IPs to Render's static outbound IPs once available
5. **Connect** → Choose "Connect your application" → Copy the connection string
6. Replace `<password>` in the string with your DB user password

Your `MONGODB_URI` will look like:
```
mongodb+srv://invoiceUser:YourPassword@cluster0.xxxxx.mongodb.net/invoicepro?retryWrites=true&w=majority
```

---

## 2. Firebase Setup

### Client SDK (Frontend)
Your Firebase client config is already in `frontend/.env.production`. These keys are **public** (safe to commit).

### Admin SDK (Backend)
1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → **Service Accounts**
2. Click **Generate New Private Key** → Download the JSON file
3. Extract these values for the backend env vars:

| JSON Field       | Env Variable             |
|-----------------|--------------------------|
| `project_id`    | `FIREBASE_PROJECT_ID`    |
| `private_key`   | `FIREBASE_PRIVATE_KEY`   |
| `client_email`  | `FIREBASE_CLIENT_EMAIL`  |

> ⚠️ **FIREBASE_PRIVATE_KEY** contains newlines. On Render, paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. The backend code handles newline escaping automatically.

---

## 3. Deploy Backend on Render

### Option A: One-Click Blueprint (Recommended)
1. Push your code to GitHub
2. Go to [render.com/deploy](https://render.com/deploy)
3. Connect your GitHub repo
4. Render detects `backend/render.yaml` and creates the service
5. Set the environment variables in the dashboard (see table below)

### Option B: Manual Setup
1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Configure:

| Setting         | Value                    |
|----------------|--------------------------|
| **Name**       | `invoicepro-api`         |
| **Root Directory** | `backend`            |
| **Runtime**    | Node                     |
| **Build Command** | `npm install`         |
| **Start Command** | `node server.js`      |
| **Plan**       | Starter ($7/mo) — no cold starts |

4. Add environment variables (see next section)
5. Click **Create Web Service**
6. Wait for the first deploy to complete (~2-4 minutes)
7. Your API URL will be: `https://invoicepro-api.onrender.com`

### Backend Environment Variables (Render Dashboard)

| Variable               | Value                                             |
|------------------------|---------------------------------------------------|
| `NODE_ENV`             | `production`                                      |
| `PORT`                 | `10000` (Render default)                          |
| `MONGODB_URI`          | Your MongoDB Atlas connection string              |
| `JWT_SECRET`           | A random 32+ character string                     |
| `FIREBASE_PROJECT_ID`  | From Firebase service account JSON                |
| `FIREBASE_PRIVATE_KEY` | From Firebase service account JSON (full key)     |
| `FIREBASE_CLIENT_EMAIL`| From Firebase service account JSON                |
| `FRONTEND_URL`         | `https://invoicepro.vercel.app` (your Vercel URL) |
| `EMAIL_SERVICE`        | `gmail`                                           |
| `EMAIL_USER`           | Your Gmail address                                |
| `EMAIL_PASS`           | Gmail app password (16 chars)                     |
| `EMAIL_FROM`           | `noreply@invoicepro.com`                          |
| `SKIP_SMTP_VERIFY`     | `true`                                            |

> 💡 Generate a JWT_SECRET: run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in your terminal.

### Verify Backend
Visit `https://invoicepro-api.onrender.com/api/health` — you should see:
```json
{"status":"ok","message":"InvoicePro API is running","timestamp":"..."}
```

---

## 4. Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Import Project**
2. Connect your GitHub repo
3. **IMPORTANT: Set Root Directory to `frontend`**
4. Vercel auto-detects Vite — settings should be:

| Setting             | Value           |
|--------------------|-----------------|
| **Framework**      | Vite            |
| **Root Directory** | `frontend`      |
| **Build Command**  | `npm run build` |
| **Output Directory** | `dist`        |

5. Add environment variables (same as `frontend/.env.production`):

| Variable                             | Value                                         |
|--------------------------------------|-----------------------------------------------|
| `VITE_API_URL`                       | `https://invoicepro-api.onrender.com`         |
| `VITE_FIREBASE_API_KEY`             | Your Firebase API key                         |
| `VITE_FIREBASE_PROJECT_ID`          | Your Firebase project ID                      |
| `VITE_FIREBASE_APP_ID`             | Your Firebase app ID                          |
| `VITE_FIREBASE_AUTH_DOMAIN`        | `your-project.firebaseapp.com`                |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Your sender ID                                |
| `VITE_FIREBASE_STORAGE_BUCKET`     | `your-project.firebasestorage.app`            |

6. Click **Deploy**
7. Your frontend will be at: `https://invoicepro.vercel.app`

### Update Backend CORS
After deploying, copy your actual Vercel URL and set `FRONTEND_URL` in Render's environment variables.

---

## 5. How Frontend Communicates with Backend

The frontend uses **Axios** to make API calls. Every authenticated request includes the Firebase ID token:

```js
// Example: how the frontend makes API calls
import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // https://invoicepro-api.onrender.com
});

// Attach Firebase token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Example API calls:
const invoices = await api.get('/api/invoices');          // Fetch invoices
const newInvoice = await api.post('/api/invoices', data);  // Create invoice
const profile = await api.get('/api/users/profile');       // Fetch profile
```

The backend `authMiddleware.js` verifies the Firebase token using `admin.auth().verifyIdToken(token)`.

---

## 6. Production Security Checklist

### ✅ Authentication & Authorization
- [x] Firebase token verification on every protected route (`authMiddleware.js`)
- [x] Fallback to JWT verification if Firebase token fails
- [x] Auto-create user in MongoDB on first Firebase login
- [x] Token expiry enforced (Firebase tokens expire in 1 hour, auto-refresh on client)

### ✅ Security Headers
- [x] `helmet` middleware — sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc.
- [x] CORS restricted to `FRONTEND_URL` only (no wildcard `*`)
- [x] Explicit `methods` and `allowedHeaders` in CORS config

### ✅ Rate Limiting
- [x] 100 requests per 15 minutes per IP on all `/api/` routes
- [x] Returns JSON error when exceeded

### ✅ Environment Variable Protection
- [x] All secrets (`MONGODB_URI`, `JWT_SECRET`, `FIREBASE_PRIVATE_KEY`, `EMAIL_PASS`) stored in Render's encrypted environment variables
- [x] `.env` files in `.gitignore` — never committed
- [x] Firebase client-side keys are safe to be public (they're restricted by Firebase Security Rules)

### ✅ API Input Validation
- [x] `express-validator` used for request body validation
- [x] Body size limited to 10MB (prevents payload abuse)
- [x] `express.json()` and `express.urlencoded()` with limits configured

### 🔒 Recommended Additional Steps
- [ ] Enable Firebase Security Rules to restrict database access
- [ ] Set up MongoDB Atlas IP allowlist (restrict to Render IPs instead of `0.0.0.0/0`)
- [ ] Add HTTPS-only cookie flags if using cookies in the future
- [ ] Consider adding request logging to a service like Datadog or LogRocket

---

## 7. Deployment Checklist

Run through this before sharing the URL with investors:

### Authentication
- [ ] Sign up with a new email → verify account is created
- [ ] Log in with existing account → dashboard loads
- [ ] Log out and log back in → session persists correctly
- [ ] Try with Google OAuth (if enabled) → works

### API Functionality
- [ ] Create a new invoice → appears in invoice list
- [ ] Edit an existing invoice → changes persist
- [ ] Fetch all invoices → list renders correctly
- [ ] Generate PDF → downloads successfully
- [ ] Send invoice email → email is received
- [ ] Mark invoice as paid → receipt generation works
- [ ] View analytics dashboard → data renders

### CORS & Network
- [ ] Open browser DevTools → Network tab → no CORS errors on API calls
- [ ] All API calls go to `https://invoicepro-api.onrender.com` (not `localhost`)
- [ ] No mixed content warnings (HTTP/HTTPS)

### Mobile Testing
- [ ] Open on iPhone Safari → all pages render correctly
- [ ] Open on Android Chrome → all pages render correctly
- [ ] Test login flow on mobile → keyboard doesn't cover inputs
- [ ] Create an invoice on mobile → form is usable
- [ ] Test PDF download on mobile → file opens

### Performance
- [ ] Backend responds within 2 seconds on first load (check cold start if on free tier)
- [ ] Frontend loads within 3 seconds on 4G
- [ ] No blank screens or loading spinners that never resolve

---

## 8. Troubleshooting

### CORS Errors
```
Access to XMLHttpRequest at 'https://invoicepro-api.onrender.com/api/...' 
from origin 'https://invoicepro.vercel.app' has been blocked by CORS policy
```
**Fix**: Ensure `FRONTEND_URL` in Render env vars is set to your exact Vercel URL (no trailing slash).

### Firebase Token Errors
```
Firebase verification failed: Firebase ID token has expired
```
**Fix**: The frontend should auto-refresh tokens. Check that `getIdToken(true)` is called on auth state change.

### MongoDB Connection Issues
```
MongoDB connection error: queryTxt ETIMEOUT
```
**Fix**: Ensure `0.0.0.0/0` is in MongoDB Atlas Network Access. Check the connection string has the correct password.

### Render Cold Starts (Free Tier)
The free tier spins down after 15 min. First request takes 30–60s.
**Fix**: Upgrade to Starter ($7/mo) or set up a cron ping to keep it alive.

---

## Quick References

| What                | Where                                         |
|--------------------|-------------------------------------------------|
| Render Dashboard   | [dashboard.render.com](https://dashboard.render.com) |
| Vercel Dashboard   | [vercel.com/dashboard](https://vercel.com/dashboard) |
| MongoDB Atlas      | [cloud.mongodb.com](https://cloud.mongodb.com)      |
| Firebase Console   | [console.firebase.google.com](https://console.firebase.google.com) |
| Backend Health     | `https://<your-render-url>/api/health`               |
| Email Health       | `https://<your-render-url>/api/health/email`         |
