import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import Header from './components/Header';
import QueryPanel from './components/QueryPanel';
import ResultsPanel from './components/ResultsPanel';
import FileUpload from './components/FileUpload';
import { queryData, getAreas, checkHealth } from './services/api';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [areas, setAreas] = useState([]);
  const [recentQueries, setRecentQueries] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    // Load recent queries from localStorage
    const saved = localStorage.getItem('recentQueries');
    if (saved) {
      setRecentQueries(JSON.parse(saved));
    }

    // Check health and load areas
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [healthResponse, areasResponse] = await Promise.all([
        checkHealth(),
        getAreas()
      ]);
      
      setHealthStatus(healthResponse.data);
      setAreas(areasResponse.data.areas || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to connect to the server. Please check if the backend is running.');
    }
  };

  const handleQuery = async (query) => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await queryData(query);
      setResults(response.data);

      // Add to recent queries
      const newRecentQueries = [query, ...recentQueries.filter(q => q !== query)].slice(0, 5);
      setRecentQueries(newRecentQueries);
      localStorage.setItem('recentQueries', JSON.stringify(newRecentQueries));

    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to process query. Please try again.';
      setError(errorMessage);
      
      // If there are suggestions, show them
      if (err.response?.data?.suggestions) {
        setResults({ suggestions: err.response.data.suggestions });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    // Reload areas after successful upload
    try {
      const response = await getAreas();
      setAreas(response.data.areas || []);
      setResults(null); // Clear previous results
    } catch (err) {
      console.error('Failed to reload areas:', err);
    }
  };

  return (
    <div className="App">
      <Header healthStatus={healthStatus} />
      
      <Container fluid>
        {error && (
          <Row className="mb-3">
            <Col>
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            </Col>
          </Row>
        )}

        <Row>
          <Col lg={4} className="mb-4">
            <FileUpload onUploadSuccess={handleFileUpload} />
            
            <QueryPanel
              onQuery={handleQuery}
              loading={loading}
              areas={areas}
              recentQueries={recentQueries}
            />
          </Col>
          
          <Col lg={8}>
            <ResultsPanel
              results={results}
              loading={loading}
              onSuggestionClick={handleQuery}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;