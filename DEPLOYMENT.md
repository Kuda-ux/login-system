# Deployment Guide - Building Management System

This guide explains how to deploy the full-stack application with:
- **Frontend** → Vercel (already deployed)
- **Backend** → Render (free tier)

---

## 🚀 Step 1: Deploy Backend to Render

### Option A: One-Click Deploy (Recommended)

1. Go to [render.com](https://render.com) and sign up/login with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Kuda-ux/login-system`
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `building-management-api` |
| **Region** | Oregon (US West) or closest to you |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server/index.js` |
| **Plan** | Free |

5. Add Environment Variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Generate a random 32+ character string |
| `ENCRYPTION_KEY` | Generate a random 32 character string |
| `FRONTEND_URL` | Your Vercel URL (e.g., `https://login-system.vercel.app`) |

6. Click **"Create Web Service"**

7. Wait for deployment (takes 2-5 minutes)

8. Copy your Render URL (e.g., `https://building-management-api.onrender.com`)

---

## 🌐 Step 2: Connect Frontend to Backend

### Update Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://your-render-url.onrender.com/api` |

4. **Redeploy** your Vercel project for changes to take effect:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **"Redeploy"**

---

## 🔧 Step 3: Verify Deployment

### Test the Backend API

Open your browser and visit:
```
https://your-render-url.onrender.com/api/auth/health
```

You should see a response (or the server should be running).

### Test the Frontend

1. Open your Vercel URL
2. Try logging in with the administrator credentials provided to you
3. If login works, the connection is successful!

---

## ⚠️ Important Notes

### Render Free Tier Limitations

- **Cold Starts**: Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- After waking, subsequent requests are fast

### To Keep Backend Awake (Optional)

Use a free service like [UptimeRobot](https://uptimerobot.com) to ping your backend every 14 minutes.

1. Sign up at uptimerobot.com
2. Add a new monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://your-render-url.onrender.com/api/auth/health`
   - Monitoring Interval: 5 minutes

---

## 🔐 Security Checklist

- [ ] Change default admin password after first login
- [ ] Use strong, unique values for `JWT_SECRET` and `ENCRYPTION_KEY`
- [ ] Keep your `.env` files out of version control
- [ ] Enable HTTPS (automatic on both Vercel and Render)

---

## 📱 Final URLs

After deployment, your system will be available at:

| Component | URL |
|-----------|-----|
| **Frontend** | `https://your-app.vercel.app` |
| **Backend API** | `https://your-api.onrender.com/api` |
| **Admin Login** | `https://your-app.vercel.app/admin/login` |
| **Security Portal** | `https://your-app.vercel.app/security/login` |
| **Staff Portal** | `https://your-app.vercel.app/staff/login` |

---

## 🆘 Troubleshooting

### "Network Error" or "Failed to fetch"
- Check if backend is running on Render
- Verify `REACT_APP_API_URL` is set correctly in Vercel
- Make sure the URL ends with `/api`

### "CORS Error"
- Backend should automatically allow Vercel URLs
- Check Render logs for errors

### Login Not Working
- Wait 30-60 seconds for backend to wake up (free tier)
- Check browser console for specific errors
- Verify database was initialized (check Render logs)

---

## 🔄 Updating the Application

Any push to the `main` branch will automatically:
1. Trigger a new Vercel deployment (frontend)
2. Trigger a new Render deployment (backend)

No manual action needed!

---

*Cherubim Security Management System - Deployment Guide*
