// In-memory job storage (temporary storage tied to jobId)
// Jobs will be cleared on server restart or after a timeout period

const jobs = new Map(); // jobId -> job object

// Default job expiry time: 24 hours (in milliseconds)
const JOB_EXPIRY_TIME = 24 * 60 * 60 * 1000;

// Clean up expired jobs periodically
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    const jobAge = now - new Date(job.uploadTimestamp).getTime();
    if (jobAge > JOB_EXPIRY_TIME) {
      jobs.delete(jobId);
      console.log(`Cleaned up expired job: ${jobId}`);
    }
  }
}, 60 * 60 * 1000); // Run cleanup every hour

export const createJob = (jobData) => {
  const jobId = jobData.jobId || generateJobId();
  const job = {
    jobId,
    fileName: jobData.fileName,
    status: jobData.status || 'PENDING',
    clientName: jobData.clientName || '',
    uploadTimestamp: new Date().toISOString(),
    completedTimestamp: null,
    downloadUrl: null,
    errorMessage: null,
  };
  jobs.set(jobId, job);
  return job;
};

export const getJob = (jobId) => {
  return jobs.get(jobId) || null;
};

export const updateJob = (jobId, updates) => {
  const job = jobs.get(jobId);
  if (!job) {
    return null;
  }
  const updatedJob = { ...job, ...updates };
  jobs.set(jobId, updatedJob);
  return updatedJob;
};

export const getAllJobs = () => {
  return Array.from(jobs.values()).sort((a, b) => 
    new Date(b.uploadTimestamp) - new Date(a.uploadTimestamp)
  );
};

export const deleteJob = (jobId) => {
  return jobs.delete(jobId);
};

// Generate a unique job ID
function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export { generateJobId };

