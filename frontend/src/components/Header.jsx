import React from 'react';
import { Container, Navbar, Badge } from 'react-bootstrap';

const Header = ({ healthStatus }) => {
  return (
    <header className="app-header">
      <Container>
        <Navbar.Brand className="d-flex align-items-center">
          <i className="bi bi-buildings me-3" style={{ fontSize: '2.2rem', color: '#ffffff' }}></i>
          <div>
            <h1 className="mb-0" style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
              Prop Analytics
            </h1>
            <p className="mb-0 opacity-90" style={{ fontSize: '0.95rem', fontWeight: '400' }}>
              Advanced Real Estate Intelligence Platform
            </p>
          </div>
        </Navbar.Brand>
        
        {healthStatus && (
          <div className="d-flex align-items-center text-end">
            <div className="me-3">
              <Badge 
                bg={healthStatus.data_loaded ? 'success' : 'warning'}
                className="me-2"
              >
                <i className={`bi bi-${healthStatus.data_loaded ? 'check-circle' : 'exclamation-triangle'} me-1`}></i>
                {healthStatus.data_loaded ? 'Data Loaded' : 'No Data'}
              </Badge>
              {healthStatus.total_records > 0 && (
                <small className="opacity-75">
                  {healthStatus.total_records.toLocaleString()} records
                </small>
              )}
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};

export default Header;