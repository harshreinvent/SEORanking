# SEO Ranking Application

A full-stack application for tracking SEO rankings with n8n workflow integration.

## Features

- File upload and processing
- Google Sheets integration via n8n workflows
- Real-time job status tracking
- View processed sheets directly in Google Sheets

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React, Material-UI, Vite
- **Integration**: n8n workflows for file processing

## Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
   ```

4. Start the server:
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## n8n Workflow Configuration

See [N8N_SETUP.md](./N8N_SETUP.md) for detailed instructions on configuring your n8n workflow.

The key requirement is that your n8n "Respond to Webhook" node must include the `spreadsheetUrl` field in its response.

## API Endpoints

### Backend API

- `POST /api/jobs/upload` - Upload a file for processing
- `GET /api/jobs/status` - Get all job statuses
- `GET /api/jobs/download/:jobId` - Download processed file (if available)

### n8n Integration

- `POST /api/n8n/complete/:jobId` - n8n workflow completion endpoint

## Project Structure

```
SEO Ranking/
├── backend/
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── storage/         # Job storage
│   └── server.js        # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   └── context/     # React context
│   └── vite.config.js
├── N8N_SETUP.md         # n8n configuration guide
└── SETUP.md             # Setup instructions
```

## License

MIT

