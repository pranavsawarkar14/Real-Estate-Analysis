import React, { useState, useRef } from 'react';
import { Card, Button, Alert, ProgressBar } from 'react-bootstrap';
import { uploadFile, downloadSampleDataset } from '../services/api';
import NotificationToast from './NotificationToast';

const FileUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState({});
  const fileInputRef = useRef();

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setMessage('Please select a valid Excel file (.xlsx or .xls)');
      setMessageType('danger');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('File size must be less than 10MB');
      setMessageType('danger');
      return;
    }

    uploadFileToServer(file);
  };

  const uploadFileToServer = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    setMessage('');

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Success notification with detailed information
      const areasCount = response.data.areas?.length || 0;
      
      setToastConfig({
        variant: 'success',
        title: '✅ Upload Successful!',
        message: `📊 File processed successfully • 📍 Loaded ${areasCount} area${areasCount !== 1 ? 's' : ''} • 🔄 Data ready for analysis`
      });
      setShowToast(true);
      
      setMessage(`File uploaded successfully! Loaded data for ${areasCount} areas.`);
      setMessageType('success');

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      
      const errorMessage = error.response?.data?.error || 'Upload failed. Please try again.';
      
      setToastConfig({
        variant: 'danger',
        title: '❌ Upload Failed!',
        message: `⚠️ ${errorMessage} • 💡 Check: File format (.xlsx/.xls), Required columns, File size (max 10MB)`
      });
      setShowToast(true);
      
      setMessage(errorMessage);
      setMessageType('danger');
    } finally {
      setUploading(false);
      
      // Clear message after 8 seconds for better visibility
      setTimeout(() => {
        setMessage('');
        setUploadProgress(0);
      }, 8000);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadSample = async () => {
    try {
      setMessage('Downloading sample dataset...');
      setMessageType('info');

      const response = await downloadSampleDataset();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Sample_Dataset.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToastConfig({
        variant: 'success',
        title: '📥 Download Complete!',
        message: '📊 Sample dataset downloaded successfully • Use this as a reference for your data format'
      });
      setShowToast(true);

      setMessage('Sample dataset downloaded successfully!');
      setMessageType('success');

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Download failed:', error);
      
      setToastConfig({
        variant: 'danger',
        title: '❌ Download Failed!',
        message: '⚠️ Failed to download sample dataset • Please check your connection and try again'
      });
      setShowToast(true);
      
      setMessage('Failed to download sample dataset. Please try again.');
      setMessageType('danger');
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage('');
      }, 5000);
    }
  };

  return (
    <>
      <NotificationToast
        show={showToast}
        onClose={() => setShowToast(false)}
        variant={toastConfig.variant}
        title={toastConfig.title}
        message={toastConfig.message}
        delay={6000}
      />
      
      <Card className="mb-4">
        <Card.Header className="d-flex align-items-center bg-primary text-white">
          <i className="bi bi-cloud-upload me-2"></i>
          Upload Dataset
        </Card.Header>
      <Card.Body>
        {message && (
          <Alert variant={messageType} className="mb-3">
            <i className={`bi bi-${messageType === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
            {message}
          </Alert>
        )}

        {uploading && (
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted">Uploading...</small>
              <small className="text-muted">{uploadProgress}%</small>
            </div>
            <ProgressBar now={uploadProgress} animated />
          </div>
        )}

        <div
          className={`upload-area ${dragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
          style={{ 
            border: '2px dashed #dee2e6', 
            borderRadius: '8px', 
            padding: '20px', 
            textAlign: 'center', 
            cursor: 'pointer',
            backgroundColor: dragOver ? '#f8f9fa' : 'transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <i className="bi bi-file-earmark-excel text-primary mb-2" style={{ fontSize: '2rem' }}></i>
          <h6 className="mb-2">Upload Excel File</h6>
          <p className="text-muted mb-3 small">
            Drag and drop your Excel file here, or click to browse
          </p>
          <Button
            variant="primary"
            size="sm"
            disabled={uploading}
            onClick={(e) => e.stopPropagation()}
          >
            <i className="bi bi-folder2-open me-2"></i>
            Choose File
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        <div className="mt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Button
              variant="outline-info"
              size="sm"
              onClick={handleDownloadSample}
              disabled={uploading}
            >
              <i className="bi bi-download me-1"></i>
              Sample Dataset
            </Button>
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              .xlsx, .xls (max 10MB)
            </small>
          </div>
          
          <small className="text-muted d-block text-center">
            Required columns: Year, Area, Price, Demand
          </small>
        </div>
      </Card.Body>
    </Card>
    </>
  );
};

export default FileUpload;