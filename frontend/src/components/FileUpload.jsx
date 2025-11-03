import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadFile } from '../services/jobs';

const FileUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clientNameDialogOpen, setClientNameDialogOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError('');
      setSuccess('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError('');
      setSuccess('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUploadClick = () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }
    // Open dialog to get client name
    setClientNameDialogOpen(true);
    setClientName('');
  };

  const handleDialogClose = () => {
    setClientNameDialogOpen(false);
    setClientName('');
  };

  const handleDialogSubmit = async () => {
    if (!clientName || clientName.trim() === '') {
      setError('Please enter a client name');
      return;
    }

    setClientNameDialogOpen(false);
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await uploadFile(selectedFile, clientName.trim());
      setSuccess('File uploaded successfully! Processing has started.');
      setSelectedFile(null);
      setClientName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          border: '2px dashed',
          borderColor: selectedFile ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: selectedFile ? 'action.selected' : 'background.paper',
          transition: 'all 0.3s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {selectedFile ? selectedFile.name : 'Drop file here or click to browse'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported formats: .xlsx, .xls
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Box>

      {selectedFile && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleUploadClick}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </Box>
      )}

      {/* Client Name Dialog */}
      <Dialog open={clientNameDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Enter Client Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Client Name"
            type="text"
            fullWidth
            variant="outlined"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && clientName.trim() !== '') {
                handleDialogSubmit();
              }
            }}
            sx={{ mt: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Please enter the client name for this file upload.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleDialogSubmit} 
            variant="contained"
            disabled={!clientName || clientName.trim() === ''}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;

