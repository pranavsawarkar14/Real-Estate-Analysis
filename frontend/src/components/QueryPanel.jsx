import React, { useState } from 'react';
import { Card, Form, Button, ListGroup, Badge } from 'react-bootstrap';

const QueryPanel = ({ onQuery, loading, areas, recentQueries }) => {
  const [query, setQuery] = useState('');

  const presetQueries = [
    'Analyze Wakad',
    'Compare Ambegaon Budruk and Aundh demand trends',
    'Show price growth for Akurdi over the last 3 years',
    'Which area has the highest demand?',
    'Price trends in Pune areas'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onQuery(query.trim());
    }
  };

  const handlePresetClick = (presetQuery) => {
    setQuery(presetQuery);
    onQuery(presetQuery);
  };

  const handleRecentClick = (recentQuery) => {
    setQuery(recentQuery);
    onQuery(recentQuery);
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex align-items-center">
        <i className="bi bi-chat-dots me-2"></i>
        Query Assistant
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Ask about real estate data:</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'Analyze price trends in Wakad' or 'Compare demand between Aundh and Kothrud'"
              className="query-input"
              disabled={loading}
            />
          </Form.Group>
          
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !query.trim()}
            className="w-100 mb-3"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Analyzing...
              </>
            ) : (
              <>
                <i className="bi bi-search me-2"></i>
                Analyze Data
              </>
            )}
          </Button>
        </Form>

        {/* Preset Queries */}
        <div className="mb-3">
          <h6 className="text-muted mb-2">
            <i className="bi bi-lightbulb me-1"></i>
            Quick Queries
          </h6>
          <div className="preset-buttons">
            {presetQueries.map((preset, index) => (
              <Button
                key={index}
                variant="outline-secondary"
                size="sm"
                className="preset-btn"
                onClick={() => handlePresetClick(preset)}
                disabled={loading}
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>

        {/* Recent Queries */}
        {recentQueries.length > 0 && (
          <div>
            <h6 className="text-muted mb-2">
              <i className="bi bi-clock-history me-1"></i>
              Recent Queries
            </h6>
            <div className="recent-queries">
              {recentQueries.map((recent, index) => (
                <div
                  key={index}
                  className="recent-query-item"
                  onClick={() => handleRecentClick(recent)}
                >
                  <i className="bi bi-arrow-clockwise me-2 text-muted"></i>
                  {recent}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Areas */}
        {areas.length > 0 && (
          <div className="mt-3">
            <h6 className="text-muted mb-2">
              <i className="bi bi-geo-alt me-1"></i>
              Available Areas ({areas.length})
            </h6>
            <div className="d-flex flex-wrap gap-1">
              {areas.slice(0, 10).map((area, index) => (
                <Badge
                  key={index}
                  bg="light"
                  text="dark"
                  className="cursor-pointer"
                  onClick={() => handlePresetClick(`Analyze ${area}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {area}
                </Badge>
              ))}
              {areas.length > 10 && (
                <Badge bg="secondary">
                  +{areas.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default QueryPanel;