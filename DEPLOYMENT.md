# Deployment Guide

## Option 1: Render (Recommended - Easiest)

### Prerequisites
1. GitHub account with your code pushed
2. Google Gemini API key
3. Render account (free): https://render.com

### Steps:

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create Render account and connect GitHub**
   - Go to https://dashboard.render.com
   - Sign up/Login
   - Connect your GitHub repository

3. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `plant-app-db`
   - Region: Choose closest to your users
   - Plan: Free
   - Create Database
   - Save the Internal Database URL

4. **Deploy Python RAG Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Name: `plant-app-rag`
   - Root Directory: `backend_app`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - Plan: Free
   - Environment Variables:
     - `GEMINI_API_KEY`: your_gemini_key
     - `DB_HOST`: (from PostgreSQL internal hostname)
     - `DB_PORT`: 5432
     - `DB_NAME`: plant_chatbot
     - `DB_USER`: (from PostgreSQL credentials)
     - `DB_PASSWORD`: (from PostgreSQL credentials)
   - Create Web Service

5. **Deploy Node.js Backend**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Name: `plant-app-backend`
   - Root Directory: `backend_app`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
   - Environment Variables:
     - `PORT`: 5000
     - `JWT_SECRET`: (generate random string)
     - `DB_HOST`: (from PostgreSQL internal hostname)
     - `DB_PORT`: 5432
     - `DB_NAME`: plant_chatbot
     - `DB_USER`: (from PostgreSQL credentials)
     - `DB_PASSWORD`: (from PostgreSQL credentials)
     - `PYTHON_RAG_URL`: (URL of your RAG service)
   - Create Web Service

6. **Deploy React Frontend**
   - Click "New +" → "Static Site"
   - Connect your repository
   - Name: `plant-app-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment Variables:
     - `VITE_API_URL`: (URL of your Node backend)
   - Create Static Site

7. **Update CORS in backend**
   - Update `backend_app/server.js` CORS origin to your frontend URL
   - Push changes and Render will auto-deploy

### Cost: FREE (with limitations)
- 750 hours/month free tier
- Services sleep after 15 min inactivity
- 100GB bandwidth/month

---

## Option 2: Railway

### Steps:
1. Go to https://railway.app
2. Connect GitHub repository
3. Add services:
   - PostgreSQL (from Railway templates)
   - Python RAG service
   - Node.js backend
   - Deploy frontend separately on Vercel/Netlify
4. Configure environment variables
5. Deploy

### Cost: $5/month credit (then pay-as-you-go)

---

## Option 3: Vercel (Frontend) + Render/Railway (Backend)

### Frontend on Vercel:
1. Go to https://vercel.com
2. Import GitHub repository
3. Framework: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables: `VITE_API_URL`
7. Deploy

### Backend: Use Render or Railway as described above

---

## Option 4: Heroku

### Steps:
1. Create Heroku account
2. Install Heroku CLI
3. Create apps:
   ```bash
   heroku create plant-app-backend
   heroku create plant-app-rag
   ```
4. Add PostgreSQL addon:
   ```bash
   heroku addons:create heroku-postgresql:mini -a plant-app-backend
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```
6. Deploy frontend to Vercel/Netlify

### Cost: $5-7/month per dyno

---

## Option 5: DigitalOcean App Platform

### Steps:
1. Create DigitalOcean account
2. Go to App Platform
3. Connect GitHub repository
4. Configure components:
   - Frontend (Static Site)
   - Backend (Web Service)
   - RAG Service (Web Service)
   - Database (Managed PostgreSQL)
5. Set environment variables
6. Deploy

### Cost: $5-12/month

---

## Option 6: VPS (Full Control) - DigitalOcean/Linode/AWS EC2

### Requirements:
- VPS with 2GB+ RAM
- Ubuntu 22.04 LTS
- Domain name (optional)

### Steps:
1. Set up VPS
2. Install dependencies:
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm postgresql python3 python3-pip nginx
   ```
3. Clone repository
4. Set up PostgreSQL database
5. Configure environment variables
6. Build frontend
7. Configure Nginx as reverse proxy
8. Set up PM2 for process management
9. Configure SSL with Let's Encrypt

### Cost: $6-12/month

---

## Recommended Configuration

**For beginners/quick deployment:**
- **Frontend**: Vercel (free, auto-deploy from git)
- **Backend + RAG**: Render (free tier)
- **Database**: Render PostgreSQL (free tier)

**For production:**
- **All services**: DigitalOcean App Platform or Railway
- **Database**: Managed PostgreSQL
- **Monitoring**: Built-in service monitoring

---

## Environment Variables Needed

### Backend (.env):
```
DB_HOST=
DB_PORT=5432
DB_NAME=plant_chatbot
DB_USER=
DB_PASSWORD=
JWT_SECRET=
PORT=5000
PYTHON_RAG_URL=
```

### Python RAG (.env):
```
DB_HOST=
DB_PORT=5432
DB_NAME=plant_chatbot
DB_USER=
DB_PASSWORD=
GEMINI_API_KEY=
```

### Frontend:
```
VITE_API_URL=https://your-backend-url.com
```

---

## Post-Deployment Checklist

- [ ] Database initialized with tables
- [ ] Backend health check responds: `/api/health`
- [ ] RAG service accessible
- [ ] Frontend can communicate with backend
- [ ] Authentication works (register/login)
- [ ] Chat functionality works
- [ ] Image uploads work
- [ ] Collection features work
- [ ] CORS configured correctly
- [ ] Environment variables secure (not in code)
- [ ] SSL/HTTPS enabled
- [ ] Monitor service health

---

## Troubleshooting

### Services won't start:
- Check environment variables
- Check logs in deployment platform
- Verify database connection

### CORS errors:
- Update CORS origin in `backend_app/server.js`
- Match frontend URL exactly

### Database connection fails:
- Verify DB credentials
- Check if DB is running
- Ensure DB_HOST uses internal hostname

### Frontend can't reach backend:
- Update VITE_API_URL
- Rebuild frontend after env change
- Check network/firewall rules
