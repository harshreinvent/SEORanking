# n8n Workflow Setup Guide

## Problem: Job Status Stays "PROCESSING"

If your n8n workflow executes successfully but the frontend still shows "PROCESSING", it means the workflow is not calling the completion endpoint.

## Solution: Add HTTP Request Node to Update Job Status

Your n8n workflow needs to call the backend completion endpoint **AFTER** processing is complete.

### Step 1: Get the Job ID

When your backend sends the file to n8n, it includes the `jobId` in the form data. Make sure you can access it in your workflow:
- Use `{{ $json.body.jobId }}` or `{{ $json.jobId }}` to get the jobId

### Step 2: Add HTTP Request Node

**After your "Download file" node and BEFORE "Respond to Webhook":**

1. **Add an "HTTP Request" node** in your n8n workflow
2. **Configure it:**
   - **Method:** `POST`
   - **URL:** `http://localhost:5000/api/n8n/complete/{{ $json.jobId }}`
     - Replace `jobId` with how you're storing it in your workflow
     - If running n8n on a different machine, use your backend server's IP/domain
   - **Body Content Type:** `Multipart-Form-Data`
   - **Add a field:**
     - **Name:** `file`
     - **Type:** `File`
     - **Value:** The processed file from your workflow (from "Download file" node)
       - Use `{{ $binary.data }}` or the binary data reference

### Step 3: Keep "Respond to Webhook" Node

Keep your "Respond to Webhook" node at the end - this is fine and doesn't interfere.

### Complete Workflow Structure:

```
Webhook (POST)
  ↓
Extract from File
  ↓
Create spreadsheet
  ↓
Edit Fields
  ↓
Loop Over Items
  ↓
HTTP Request (Search API)
  ↓
AI Agent
  ↓
Append to sheet
  ↓
Wait
  ↓
Download file
  ↓
HTTP Request (POST to /api/n8n/complete/:jobId) ← ADD THIS
  ↓
Respond to Webhook (optional)
```

## Important Notes:

1. **Localhost vs Server:** 
   - If n8n runs on the same machine as backend: use `http://localhost:5000`
   - If n8n runs on different machine: use `http://YOUR_BACKEND_IP:5000` or your backend domain

2. **File Format:**
   - Send the processed file as `multipart/form-data`
   - Field name must be `file`

3. **Job ID:**
   - Make sure to pass the `jobId` from the initial webhook request through your workflow
   - Use it in the URL: `/api/n8n/complete/{{ jobId }}`

## Testing:

After adding the HTTP Request node:
1. Upload a file from the frontend
2. Check backend console - you should see:
   ```
   📥 Received completion request for job: job_xxx...
   📄 File received: filename.xlsx
   ✅ Job found, updating status to COMPLETED
   🎉 Job marked as COMPLETED
   ```
3. Frontend should automatically update to show "COMPLETED" status
4. Download button should appear

## Alternative: If you can't use localhost

If n8n can't reach `localhost:5000`, you can:
1. Use your computer's local IP address (e.g., `http://192.168.1.100:5000`)
2. Or expose your backend using ngrok or similar service

---

## Problem: Response Missing spreadsheetUrl

If your n8n workflow is returning data but the backend shows "Response does not contain a valid Google Sheets URL", it means the `spreadsheetUrl` is not included in the "Respond to Webhook" response.

### Solution: Include spreadsheetUrl in Respond to Webhook

Your n8n "Respond to Webhook" node needs to include the `spreadsheetUrl` field in its response. Here are the options:

### Option 1: Merge Data Before Responding (Recommended)

1. **Add a "Code" node** before your "Respond to Webhook" node
2. **Merge the spreadsheetUrl** into your data:

```javascript
// Get the spreadsheetUrl from wherever it's stored in your workflow
// (e.g., from "Create spreadsheet" node or previous merge)
const spreadsheetUrl = $input.item.json.spreadsheetUrl || $('Create spreadsheet').item.json.spreadsheetUrl;

// Merge it with the current item data
return {
  ...$input.item.json,
  spreadsheetUrl: spreadsheetUrl
};
```

3. **Connect this Code node** to "Respond to Webhook"
4. **Set "Respond to Webhook"** to "First Incoming Item"

### Option 2: Use "All Incoming Items"

1. In your **"Respond to Webhook" node**, change **"Respond With"** to **"All Incoming Items"**
2. This will send the entire array, and the backend will search for the spreadsheetUrl in any item

### Option 3: Use Set Node to Add Field

1. Add a **"Set" node** before "Respond to Webhook"
2. Add a field:
   - **Name:** `spreadsheetUrl`
   - **Value:** `{{ $('Create spreadsheet').item.json.spreadsheetUrl }}` (adjust based on your workflow)
3. Connect Set node to Respond to Webhook

### Expected Response Format

The backend expects one of these formats:

**Single Object:**
```json
{
  "Keyword": "elite dental studio",
  "Location": "Kozhikode",
  "Rank": "1",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/..."
}
```

**Array (will search all items):**
```json
[
  {
    "Keyword": "elite dental studio",
    "Location": "Kozhikode",
    "Rank": "1"
  },
  {
    "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/..."
  }
]
```

The backend will look for the URL in these fields (in order):
- `spreadsheetUrl`
- `sheetUrl`
- `url`
- `sheet_url`
- `googleSheetsUrl`

