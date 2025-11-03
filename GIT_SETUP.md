# Git Setup and Push Instructions

## Step 1: Install Git for Windows

### Download Git

1. Visit: https://git-scm.com/download/win
2. Download the latest Git for Windows installer
3. Run the installer and follow the installation wizard
4. **Important**: During installation, make sure to select "Add Git to PATH" or choose "Git from the command line and also from 3rd-party software"

### Verify Installation

After installation, restart your terminal/command prompt and run:
```bash
git --version
```

If it shows a version number (e.g., `git version 2.43.0`), Git is installed correctly.

---

## Step 2: Push Code to GitHub

Once Git is installed, run these commands in your terminal (Command Prompt, PowerShell, or Git Bash):

```bash
# Navigate to your project directory
cd "D:\SEO Ranking"

# Initialize git repository
git init

# Add the remote repository
git remote add origin https://github.com/harshreinvent/SEORanking.git

# Check status (optional - to see what will be committed)
git status

# Add all files to staging
git add .

# Commit the files
git commit -m "Initial commit: SEO Ranking application with n8n integration"

# Push to GitHub
# Note: If this is the first push, you might need to set the branch
git branch -M main
git push -u origin main
```

### If You Get Authentication Errors

GitHub requires authentication. You have two options:

#### Option A: Use GitHub Desktop (Easier)

1. Download and install [GitHub Desktop](https://desktop.github.com/)
2. Sign in with your GitHub account
3. Click "File" → "Add Local Repository"
4. Select `D:\SEO Ranking`
5. Write a commit message
6. Click "Commit to main"
7. Click "Publish repository" (or "Push origin" if already published)

#### Option B: Use Personal Access Token (Command Line)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `repo` permissions
3. When pushing, use your token as the password:
   ```bash
   git push -u origin main
   # Username: your-github-username
   # Password: your-personal-access-token
   ```

---

## Alternative: Manual Upload via GitHub Web Interface

If you prefer not to install Git:

1. Go to https://github.com/harshreinvent/SEORanking
2. Click "Add file" → "Upload files"
3. Drag and drop all files from `D:\SEO Ranking` (except `node_modules` folders)
4. Scroll down and click "Commit changes"

**Note**: This method doesn't include git history, but it works for initial upload.

