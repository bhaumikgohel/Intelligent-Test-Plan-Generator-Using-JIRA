# 🚀 Vercel Deployment Guide

## ⚠️ Important Limitations

Vercel is **serverless** and has these constraints:
- ❌ **No persistent SQLite** (database resets on each deploy)
- ❌ **File system is read-only** (uploaded PDFs won't persist)
- ✅ **Frontend works perfectly**
- ✅ **API routes work** but with limitations

## 🎯 Deployment Options

### Option 1: Frontend Only to Vercel + Local Backend (RECOMMENDED)

Deploy just the React frontend to Vercel. Backend runs on your local machine.

**Best for**: Personal use, development, demos

#### Steps:

1. **Update API URL** in `frontend/src/services/api.ts`:
   ```typescript
   const API_BASE = 'http://YOUR_LOCAL_IP:3001/api'; // Your local backend
   ```

2. **Start backend locally**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Deploy frontend**:
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Access app**:
   - Frontend: `https://your-app.vercel.app`
   - Backend: Running on your local machine

⚠️ **Note**: Your computer must be on for backend to work.

---

### Option 2: Full App to Vercel + Supabase (For Production)

Replace SQLite with Supabase PostgreSQL for full cloud deployment.

**Best for**: Production use, sharing with team

#### Required Changes:

1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Replace SQLite with PostgreSQL** (I can help code this)
3. **Use Supabase Storage** for PDF uploads

**Want me to implement this?** Let me know!

---

### Option 3: Deploy Everything to Render Instead

Render supports persistent SQLite and is free.

**Best for**: Easy full-stack deployment without code changes

Already configured! See [README.md](README.md) for Render deployment.

---

## 🔧 Quick Vercel Setup (Option 1)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Update API URL
Edit `frontend/src/services/api.ts`:
```typescript
// Change this line
const API_BASE = 'http://YOUR_LOCAL_IP:3001/api';
// Example: 'http://192.168.1.100:3001/api'
```

Find your IP:
- Windows: `ipconfig`
- Mac/Linux: `ifconfig` or `ip addr`

### Step 4: Deploy Frontend
```bash
cd frontend
vercel --prod
```

### Step 5: Start Backend Locally
```bash
cd backend
npm run dev
```

---

## 📊 Comparison

| Platform | SQLite | File Uploads | Free Tier | Setup Complexity |
|----------|--------|--------------|-----------|------------------|
| **Vercel** | ❌ (resets) | ❌ (temp only) | ✅ Generous | Medium |
| **Render** | ✅ Persistent | ✅ Persistent | ✅ Good | Easy |
| **Railway** | ✅ Persistent | ✅ Persistent | ✅ Good | Easy |

---

## 🆘 Need Help?

If you want **full cloud deployment without local backend**, I recommend **Render** (already configured) or I can help you switch to **Supabase** for Vercel.

**Which option do you prefer?**
1. Vercel frontend + local backend (quick setup)
2. Vercel + Supabase (full cloud, requires coding changes)
3. Render (full stack, easiest, already configured)
