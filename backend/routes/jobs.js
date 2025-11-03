import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { upload } from '../middleware/upload.js';
import { createJob, getJob, updateJob, getAllJobs, generateJobId } from '../storage/jobStorage.js';

const router = express.Router();

// Upload file and create job
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get client name from request (multipart form data)
    const clientName = req.body?.clientName || '';

    // Create job entry with generated jobId
    const jobId = generateJobId();
    const job = createJob({
      jobId,
      fileName: req.file.originalname,
      status: 'PENDING',
      clientName: clientName
    });
    
    // Send file to n8n webhook
    const formData = new FormData();
    const fileStream = fs.createReadStream(req.file.path);
    
    formData.append('file', fileStream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    formData.append('jobId', jobId);
    formData.append('clientName', clientName);

    // Get webhook URL
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    
    console.log('🔍 Checking N8N_WEBHOOK_URL:', n8nWebhookUrl ? `"${n8nWebhookUrl}"` : 'NOT SET');
    
    // Check if main webhook URL is placeholder or empty
    const isPlaceholder = !n8nWebhookUrl || 
        n8nWebhookUrl.includes('your-n8n') || 
        n8nWebhookUrl.includes('example.com') ||
        n8nWebhookUrl.includes('your-actual') ||
        n8nWebhookUrl === 'https://your-n8n-instance.com/webhook/upload' ||
        n8nWebhookUrl === 'https://your-n8n-webhook-url.com/webhook' ||
        n8nWebhookUrl.trim() === '' ||
        n8nWebhookUrl.trim().length < 10;
    
    if (isPlaceholder) {
      console.warn('⚠️  N8N_WEBHOOK_URL not configured or using placeholder. Skipping webhook call.');
      console.warn('⚠️  Current URL value:', JSON.stringify(n8nWebhookUrl));
      // Still create the job but mark it as PENDING (will not be processed)
      updateJob(jobId, { status: 'PENDING' });
      
      // Clean up uploaded file
      setTimeout(() => {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }, 5000);
      
      return res.status(200).json({
        message: 'File uploaded successfully. Note: N8N webhook not configured - job will not be processed.',
        job: {
          jobId: job.jobId,
          fileName: job.fileName,
          status: 'PENDING',
          uploadTimestamp: job.uploadTimestamp
        },
        warning: 'N8N_WEBHOOK_URL is not configured. Please set it in your .env file to process files.'
      });
    }

    // Send to n8n and wait for response (which should contain the processed file or Google Sheets URL)
    console.log('🚀 Attempting to trigger N8N file processing webhook:', n8nWebhookUrl);
    console.log('📤 Sending file:', req.file.originalname, 'with jobId:', jobId, 'clientName:', clientName);
    
    // Update job status to PROCESSING immediately
    updateJob(jobId, { status: 'PROCESSING' });

    // Set a timeout to mark job as failed after 30 minutes if no response
    const timeoutDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
    const timeoutId = setTimeout(() => {
      const currentJob = getJob(jobId);
      // Only mark as failed if still in PROCESSING state (not already completed/failed)
      if (currentJob && currentJob.status === 'PROCESSING') {
        console.warn(`⏱️  Job ${jobId} timed out after 30 minutes - marking as failed`);
        updateJob(jobId, {
          status: 'FAILED',
          errorMessage: 'Processing timeout: No response from n8n workflow within 30 minutes. Please check n8n execution history.'
        });
      }
    }, timeoutDuration);

    // Send to n8n and wait for JSON response containing Google Sheets URL
    /*
     * WEBHOOK RESPONSE FIELDS BEING EXTRACTED:
     * 
     * JSON Response - Checks for Google Sheets URL in these fields (in order):
     *    * jsonData.sheetUrl
     *    * jsonData.url
     *    * jsonData.sheet_url
     *    * jsonData.googleSheetsUrl
     *    * jsonData.spreadsheetUrl
     * 
     * If a Google Sheets URL is found, job is marked COMPLETED with sheetUrl stored.
     * Users can then click "View" button to open the sheet directly.
     */
    axios.post(n8nWebhookUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: timeoutDuration, // 30 minute timeout
      responseType: 'json', // Only expecting JSON response with sheetUrl
    })
    .then(async (response) => {
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      console.log('✅ N8N webhook returned response. Status:', response.status);
      console.log('📄 Response content-type:', response.headers['content-type']);
      
      try {
        // Parse JSON response (axios should handle this automatically with responseType: 'json')
        const jsonData = response.data;
        console.log('📄 N8N returned JSON response:', JSON.stringify(jsonData, null, 2));

        // Helper function to extract sheet URL from an object
        const extractSheetUrl = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          return obj.sheetUrl || obj.url || obj.sheet_url || obj.googleSheetsUrl || obj.spreadsheetUrl || null;
        };

        let sheetUrl = null;

        // Handle array response (n8n can return arrays)
        if (Array.isArray(jsonData)) {
          console.log('📋 Response is an array, searching for sheet URL...');
          // Search through array items for sheet URL
          for (const item of jsonData) {
            const foundUrl = extractSheetUrl(item);
            if (foundUrl && typeof foundUrl === 'string' && foundUrl.includes('docs.google.com')) {
              sheetUrl = foundUrl;
              console.log('✅ Found Google Sheets URL in array item:', sheetUrl);
              break; // Use first valid URL found
            }
          }
        } else if (jsonData && typeof jsonData === 'object') {
          // Handle object response
          sheetUrl = extractSheetUrl(jsonData);
        }
        
        if (sheetUrl && typeof sheetUrl === 'string' && sheetUrl.includes('docs.google.com')) {
          console.log('✅ Found Google Sheets URL:', sheetUrl);
          
          // Update job with sheet URL
          updateJob(jobId, {
            status: 'COMPLETED',
            sheetUrl: sheetUrl, // Store the sheet URL for viewing
            completedTimestamp: new Date().toISOString()
          });

          console.log('🎉 Job marked as COMPLETED with Google Sheets URL:', jobId);
        } else {
          console.warn('⚠️  JSON response does not contain a valid Google Sheets URL');
          console.warn('⚠️  Response data:', JSON.stringify(jsonData, null, 2));
          
          // Provide helpful error message based on response structure
          let errorMessage = 'N8N response does not contain a valid Google Sheets URL. ';
          
          if (Array.isArray(jsonData)) {
            errorMessage += `Response is an array with ${jsonData.length} items, but none contain a spreadsheetUrl field. `;
            errorMessage += 'Please ensure your n8n workflow includes the spreadsheetUrl in the response.';
          } else if (jsonData && typeof jsonData === 'object') {
            const keys = Object.keys(jsonData);
            errorMessage += `Response object contains fields: ${keys.join(', ')}. `;
            errorMessage += 'Expected one of: sheetUrl, url, sheet_url, googleSheetsUrl, or spreadsheetUrl. ';
            errorMessage += 'Please configure your n8n "Respond to Webhook" node to include the spreadsheetUrl in the response.';
          }
          
          console.error('❌ Error details:', errorMessage);
          updateJob(jobId, {
            status: 'FAILED',
            errorMessage: errorMessage
          });
        }
      } catch (jsonError) {
        console.error('❌ Failed to process JSON response:', jsonError.message);
        updateJob(jobId, {
          status: 'FAILED',
          errorMessage: 'Failed to process n8n response: ' + jsonError.message
        });
      }
    })
    .catch((n8nError) => {
      // Clear the timeout since we got an error (even if it's a timeout)
      clearTimeout(timeoutId);
      
      console.error('N8N webhook error:', n8nError.message || n8nError);
      console.error('Error details:', {
        code: n8nError.code,
        status: n8nError.response?.status,
        statusText: n8nError.response?.statusText,
        url: n8nWebhookUrl
      });
      
      // Handle timeout errors - mark as failed after 30 minutes
      if (n8nError.code === 'ECONNABORTED') {
        console.warn('⚠️  N8N webhook timeout after 30 minutes - marking job as failed');
        updateJob(jobId, {
          status: 'FAILED',
          errorMessage: 'Processing timeout: No response from n8n workflow within 30 minutes. Please check n8n execution history.'
        });
      } else if (n8nError.response && n8nError.response.status !== 200) {
        // Mark as failed for actual errors (not timeouts)
        let errorMessage = 'Failed to send file to processing workflow';
        const status = n8nError.response.status;
        if (status === 404) {
          errorMessage = `N8N webhook returned 404 (Not Found)`;
        } else {
          errorMessage = `N8N webhook returned error: ${status} ${n8nError.response.statusText}`;
        }
        
        updateJob(jobId, {
          status: 'FAILED',
          errorMessage: errorMessage
        });
      } else {
        // Other errors
        updateJob(jobId, {
          status: 'FAILED',
          errorMessage: n8nError.message || 'Failed to communicate with n8n workflow'
        });
      }
      
      // Still return success to user - error is logged and job marked as failed
      // User will see the failed status in the frontend
    });

    // Clean up uploaded file after sending to n8n
    setTimeout(() => {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }, 5000);

    // Return success immediately - processing happens in background
    // Status will update automatically when n8n responds
    res.status(200).json({
      message: 'File uploaded successfully and job created. Processing started.',
      job: {
        jobId: job.jobId,
        fileName: job.fileName,
        status: 'PROCESSING',
        clientName: job.clientName,
        uploadTimestamp: job.uploadTimestamp
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get all jobs (no user filtering - temporary storage)
router.get('/status', async (req, res) => {
  try {
    const jobs = getAllJobs();

    res.json({
      jobs: jobs.map(job => ({
        jobId: job.jobId,
        fileName: job.fileName,
        status: job.status,
        clientName: job.clientName || '',
        uploadTimestamp: job.uploadTimestamp,
        completedTimestamp: job.completedTimestamp,
        errorMessage: job.errorMessage,
        sheetUrl: job.sheetUrl || null // Include sheetUrl for viewing
      }))
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Download completed file
router.get('/download/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Find job
    const job = getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Job is not completed yet' });
    }

    // Check if we have a Google Sheets URL (download on-demand)
    if (job.sheetUrl) {
      try {
        console.log('📥 Downloading from Google Sheets URL:', job.sheetUrl);
        
        // Convert Google Sheets view URL to export URL
        // Example: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
        // To: https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx&gid=0
        let exportUrl = job.sheetUrl;
        
        // If it's a view/edit URL, convert to export URL
        if (exportUrl.includes('/edit') || exportUrl.includes('/view')) {
          // Extract sheet ID from URL
          const sheetIdMatch = exportUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
          if (sheetIdMatch && sheetIdMatch[1]) {
            const sheetId = sheetIdMatch[1];
            exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&gid=0`;
            console.log('📥 Converted to export URL:', exportUrl);
          }
        } else if (!exportUrl.includes('/export')) {
          // If URL doesn't have /export, try to add it
          const sheetIdMatch = exportUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
          if (sheetIdMatch && sheetIdMatch[1]) {
            const sheetId = sheetIdMatch[1];
            exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&gid=0`;
          }
        }

        // Download the file from Google Sheets
        const fileResponse = await axios.get(exportUrl, {
          responseType: 'arraybuffer',
          timeout: 60000, // 60 second timeout
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        const fileBuffer = Buffer.from(fileResponse.data);
        console.log('✅ Downloaded file from Google Sheets. Size:', fileBuffer.length, 'bytes');

        // Determine file name
        const baseFileName = path.basename(job.fileName, path.extname(job.fileName));
        const downloadFileName = `${baseFileName}_processed.xlsx`;
        const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        // Stream file to client
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
        res.setHeader('Content-Length', fileBuffer.length);
        
        res.send(fileBuffer);
        console.log('📥 File sent to client successfully');
        return;
      } catch (sheetError) {
        console.error('❌ Error downloading from Google Sheets:', sheetError.message);
        return res.status(500).json({ 
          error: 'Failed to download file from Google Sheets', 
          details: sheetError.message 
        });
      }
    }

    // Fallback to local file if available
    if (!job.downloadUrl) {
      return res.status(404).json({ error: 'File not available for download' });
    }

    // Check if file exists
    const filePath = job.downloadUrl;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Determine file extension and MIME type
    // Use stored MIME type and extension from job, or detect from file path
    const fileExtension = job.downloadExtension || path.extname(filePath) || path.extname(job.fileName) || '.xlsx';
    const mimeType = job.downloadMimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    const baseFileName = path.basename(job.fileName, path.extname(job.fileName));
    const downloadFileName = `${baseFileName}_processed${fileExtension}`;

    console.log('📥 Downloading file:', filePath);
    console.log('📄 MIME type:', mimeType);
    console.log('📁 Extension:', fileExtension);
    console.log('💾 File size:', fs.statSync(filePath).size, 'bytes');

    // Stream file to client with correct MIME type
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;

