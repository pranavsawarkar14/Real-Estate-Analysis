import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const NotificationToast = ({ show, onClose, variant = 'success', title, message, delay = 5000 }) => {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'danger':
        return 'bi-exclamation-triangle-fill';
      case 'warning':
        return 'bi-exclamation-circle-fill';
      case 'info':
        return 'bi-info-circle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  };

  const getHeaderBg = () => {
    switch (variant) {
      case 'success':
        return 'success';
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'primary';
    }
  };

  return (
    <ToastContainer 
      position="top-end" 
      className="p-3"
      style={{ zIndex: 9999 }}
    >
      <Toast 
        show={show} 
        onClose={onClose} 
        delay={delay} 
        autohide
        bg={getHeaderBg()}
      >
        <Toast.Header>
          <i className={`${getIcon()} me-2`}></i>
          <strong className="me-auto">{title}</strong>
        </Toast.Header>
        <Toast.Body className="text-white">
          {message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default NotificationToast;