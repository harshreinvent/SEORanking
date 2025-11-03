import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getJob, updateJob } from '../storage/jobStorage.js';

const router = express.Router();

// Log all incoming requests to n8n routes for debugging
router.use((req, res, next) => {
  console.log('📥 N8N route accessed:', req.method, req.path);
  next();
});

// Configure multer for receiving processed files from n8n
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const completedDir = './completed';
    if (!fs.existsSync(completedDir)) {
      fs.mkdirSync(completedDir, { recursive: true });
    }
    cb(null, completedDir);
  },
  filename: (req, file, cb) => {
    const jobId = req.params.jobId;
    cb(null, `${jobId}-${Date.now()}.xlsx`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for processed files
  }
});

// Webhook endpoint for n8n to send completed files
// NOTE: In production, you should add authentication/validation here
// For example, check a secret token or API key
router.post('/complete/:jobId', upload.single('file'), async (req, res) => {
  try {
    const { jobId } = req.params;

    console.log('📥 Received completion request for job:', jobId);
    console.log('📄 File received:', req.file ? req.file.originalname : 'NO FILE');

    if (!req.file) {
      console.error('❌ No file received from n8n');
      return res.status(400).json({ error: 'No file received from n8n' });
    }

    // Find job
    const job = getJob(jobId);
    if (!job) {
      console.error('❌ Job not found:', jobId);
      return res.status(404).json({ error: 'Job not found' });
    }

    console.log('✅ Job found, updating status to COMPLETED');
    
    // Update job status and save file path
    updateJob(jobId, {
      status: 'COMPLETED',
      downloadUrl: req.file.path,
      completedTimestamp: new Date().toISOString()
    });

    console.log('🎉 Job marked as COMPLETED:', jobId);
    console.log('📁 File saved at:', req.file.path);

    res.json({
      message: 'Job completed successfully',
      jobId: jobId,
      status: 'COMPLETED'
    });
  } catch (error) {
    console.error('N8N completion error:', error);
    
    // Try to update job status to FAILED if possible
    try {
      const job = getJob(req.params.jobId);
      if (job) {
        updateJob(req.params.jobId, {
          status: 'FAILED',
          errorMessage: 'Error processing completed file'
        });
      }
    } catch (updateError) {
      console.error('Failed to update job status:', updateError);
    }

    res.status(500).json({ error: 'Failed to process completed job' });
  }
});

export default router;

