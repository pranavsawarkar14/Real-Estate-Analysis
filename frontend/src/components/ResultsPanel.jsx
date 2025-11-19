import React from 'react';
import { Card, Alert, Button } from 'react-bootstrap';
import SummaryCard from './SummaryCard';
import ChartCard from './ChartCard';
import DataTable from './DataTable';

const ResultsPanel = ({ results, loading, onSuggestionClick }) => {
  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div className="loading-spinner">
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Analyzing your query...</p>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <i className="bi bi-chat-square-text display-1 text-muted mb-3"></i>
          <h5 className="text-muted">Ready to analyze your data</h5>
          <p className="text-muted">
            Enter a query in the panel on the left to get started with real estate analytics.
          </p>
        </Card.Body>
      </Card>
    );
  }

  // Handle suggestions (when area not found)
  if (results.suggestions && results.suggestions.length > 0) {
    return (
      <Card>
        <Card.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            No exact matches found. Did you mean one of these areas?
          </Alert>
          <div className="d-flex flex-wrap gap-2">
            {results.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline-primary"
                size="sm"
                onClick={() => onSuggestionClick(`Analyze ${suggestion}`)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="results-container fade-in">
      {/* Summary Card */}
      {results.summary && (
        <SummaryCard summary={results.summary} />
      )}

      {/* Chart Card */}
      {results.chart && Object.keys(results.chart).length > 0 && (
        <ChartCard chartData={results.chart} />
      )}

      {/* Data Table */}
      {results.table && results.table.length > 0 && (
        <DataTable 
          data={results.table} 
          totalRows={results.total_rows}
        />
      )}

      {/* No results message */}
      {(!results.summary && (!results.chart || Object.keys(results.chart).length === 0) && (!results.table || results.table.length === 0)) && (
        <Card>
          <Card.Body className="text-center py-4">
            <i className="bi bi-info-circle display-4 text-muted mb-3"></i>
            <h5 className="text-muted">No results found</h5>
            <p className="text-muted">
              Try refining your query or check the available areas.
            </p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ResultsPanel;