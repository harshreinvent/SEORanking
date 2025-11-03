import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Box,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

const getStatusColor = (status) => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'PROCESSING':
      return 'info';
    case 'PENDING':
      return 'warning';
    case 'FAILED':
      return 'error';
    default:
      return 'default';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString();
};

const JobTable = ({ jobs }) => {
  const handleView = (sheetUrl) => {
    if (sheetUrl) {
      window.open(sheetUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Sheet URL not available');
    }
  };

  if (jobs.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No jobs yet. Upload a file to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Job ID</strong></TableCell>
            <TableCell><strong>File Name</strong></TableCell>
            <TableCell><strong>Client Name</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Uploaded</strong></TableCell>
            <TableCell><strong>Completed</strong></TableCell>
            <TableCell align="center"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.jobId} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {job.jobId.substring(0, 8)}...
                </Typography>
              </TableCell>
              <TableCell>{job.fileName}</TableCell>
              <TableCell>
                {job.clientName ? (
                  <Typography variant="body2">{job.clientName}</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">-</Typography>
                )}
              </TableCell>
              <TableCell>
                <Chip
                  label={job.status}
                  color={getStatusColor(job.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>{formatDate(job.uploadTimestamp)}</TableCell>
              <TableCell>
                {job.completedTimestamp
                  ? formatDate(job.completedTimestamp)
                  : 'N/A'}
              </TableCell>
              <TableCell align="center">
                {job.status === 'COMPLETED' && job.sheetUrl ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleView(job.sheetUrl)}
                    sx={{
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: 2,
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    View Sheet
                  </Button>
                ) : job.status === 'PROCESSING' ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Processing...
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default JobTable;

