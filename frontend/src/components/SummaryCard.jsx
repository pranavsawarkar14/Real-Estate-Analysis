import React from 'react';
import { Card } from 'react-bootstrap';

const SummaryCard = ({ summary }) => {
  return (
    <Card className="mb-4">
      <Card.Header className="d-flex align-items-center">
        <i className="bi bi-lightbulb me-2 text-warning"></i>
        AI Analysis Summary
      </Card.Header>
      <Card.Body>
        <div className="summary-content">
          <p className="mb-0 lead" style={{ lineHeight: '1.6' }}>
            {summary}
          </p>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SummaryCard;