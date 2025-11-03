# SEO Ranking Tracker - Setup Guide

This guide will walk you through setting up both the backend and frontend of the SEO Ranking Tracker application.

## Prerequisites

Before you begin, make sure you have the following installed on your system:

1. **Node.js** (version 16 or higher) - [Download](https://nodejs.org/)
2. **npm** (comes with Node.js) or **yarn**
3. **No Database Required** - This application uses in-memory storage for jobs (temporary storage tied to jobId). Jobs are automatically cleaned up after 24 hours or when the server restarts.

---

## ⚠️ Installing Node.js (If Not Already Installed)

If you're getting an error like `npm : The term 'npm' is not recognized`, you need to install Node.js first.

### For Windows:

1. **Download Node.js:**
   - Go to [https://nodejs.org/](https://nodejs.org/)
   - Download the **LTS (Long Term Support)** version (recommended)
   - Choose the Windows Installer (.msi) for your system (64-bit or 32-bit)

2. **Install Node.js:**
   - Run the downloaded `.msi` installer
   - Click "Next" through the installation wizard
   - **IMPORTANT:** Make sure "Add to PATH" is checked during installation (it should be by default)
   - Complete the installation

3. **Verify Installation:**
   - **Close your current terminal/PowerShell window completely**
   - **Open a NEW terminal/PowerShell window**
   - Run these commands to verify:
     ```powershell
     node --version
     npm --version
     ```
   - You should see version numbers (e.g., `v18.17.0` and `9.6.7`)

4. **If it still doesn't work:**
   - Restart your computer (this ensures PATH variables are updated)
   - Or manually add Node.js to PATH:
     - Search "Environment Variables" in Windows
     - Edit "Path" in System Variables
     - Add: `C:\Program Files\nodejs\`
     - Restart your terminal

### After Installing Node.js:

Once Node.js is installed and verified, you can proceed with the setup steps below.

## Step-by-Step Setup

### Backend Setup

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the `backend` directory
   Create a new file named `.env` with the following content:
   ```
   PORT=5000
   N8N_WEBHOOK_URL=https://your-actual-n8n-webhook-url.com/webhook
   ```
   
   **Important Notes:** 
   - `N8N_WEBHOOK_URL`: (Required) The URL of your n8n webhook endpoint for processing files
     - If not set or using a placeholder, files will upload but won't be processed
     - This webhook receives the file, jobId, and clientName
   - **No authentication required** - API is open access
   - **No MongoDB needed** - Jobs are stored in-memory (temporary, tied to jobId)

---

4. **Run the backend server**
   - **Development mode** (with auto-restart):
     ```bash
     npm run dev
     ```
   - **Production mode**:
     ```bash
     npm start
     ```

   The backend server should now be running on `http://localhost:5000`

   You can verify it's working by visiting: `http://localhost:5000/health`

---

### Frontend Setup

1. **Open a new terminal window** (keep the backend running)

2. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a `.env` file** in the `frontend` directory (optional)
   Create a new file named `.env` with the following content:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
   
   **Note:** 
   - `VITE_API_URL` defaults to `http://localhost:5000/api` if not specified, so this step is optional
   - No authentication needed - API access is open

5. **Run the frontend development server**
   ```bash
   npm run dev
   ```

   The frontend should now be running on `http://localhost:3000`

   Open your browser and navigate to `http://localhost:3000`

---

## Quick Start Commands Summary

### Terminal 1 (Backend):
```bash
cd backend
npm install
# Create .env file with PORT and N8N_WEBHOOK_URL
npm run dev
```

### Terminal 2 (Frontend):
```bash
cd frontend
npm install
# Create .env file with VITE_API_URL (optional)
npm run dev
```

---

## Troubleshooting

### Backend Issues

1. **API Connection Error**
   - ✅ Ensure the backend server is running on port 5000 (or the port specified in `.env`)
   - ✅ Check that `VITE_API_URL` in frontend `.env` matches your backend URL
   - ✅ Verify CORS is enabled on the backend (already configured)

2. **Port Already in Use**
   - Change the `PORT` in the `.env` file to a different port (e.g., 5001)
   - Make sure to update the frontend proxy in `vite.config.js` if you change the port

3. **Missing Dependencies**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

### Frontend Issues

1. **Cannot Connect to Backend**
   - Make sure the backend is running on port 5000
   - Check the proxy configuration in `vite.config.js`
   - Verify the `VITE_API_URL` in your `.env` file (if you created one)

2. **Port Already in Use**
   - Vite will automatically try the next available port
   - Or change the port in `vite.config.js`

---

## Production Build

### Frontend Production Build:
```bash
cd frontend
npm run build
```
This creates an optimized production build in the `frontend/dist` directory.

### Preview Production Build:
```bash
npm run preview
```

---

## Application Structure

- **Backend:** Express.js server with in-memory job storage, running on port 5000
- **Frontend:** React + Vite application, running on port 3000
- **Authentication:** None - open access API
- **Storage:** In-memory (jobs are temporary, tied to jobId, cleared on restart or after 24 hours)

The frontend automatically proxies API requests to the backend during development.

---

## Next Steps

Once both servers are running:
1. Open `http://localhost:3000` in your browser
2. You'll be taken directly to the dashboard (no login required)
3. Upload an Excel file and track job status
4. Jobs are automatically cleaned up after 24 hours or when the server restarts

