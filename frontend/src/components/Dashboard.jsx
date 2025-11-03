import React, { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Paper,
} from '@mui/material';
import FileUpload from './FileUpload';
import JobTable from './JobTable';

const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { getJobs } = await import('../services/jobs');
        const jobsData = await getJobs();
        setJobs(jobsData);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      }
    };

    fetchJobs();

    // Poll every 5 seconds
    const interval = setInterval(fetchJobs, 5000);

    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const handleFileUploaded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SEO Rank Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Upload File
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload an XLSX file with Keyword and Location columns. The file will be processed and you can download the results when ready.
          </Typography>
          <FileUpload onUploadSuccess={handleFileUploaded} />
        </Paper>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Your Jobs
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Track the status of your uploaded files. Status updates automatically every 5 seconds.
          </Typography>
          <JobTable jobs={jobs} />
        </Paper>
      </Container>
    </>
  );
};

export default Dashboard;

