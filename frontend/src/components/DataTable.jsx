import React, { useState, useMemo } from 'react';
import { Card, Table, Form, Row, Col, Button, Badge, Pagination } from 'react-bootstrap';
import { downloadData } from '../services/api';

const DataTable = ({ data, totalRows }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('year');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [downloading, setDownloading] = useState(false);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numeric sorting
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle string sorting
      aVal = aVal?.toString().toLowerCase() || '';
      bVal = bVal?.toString().toLowerCase() || '';

      if (sortDirection === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleDownload = async (format) => {
    setDownloading(true);
    try {
      // Use the current filtered and sorted data from the table
      const dataToDownload = filteredAndSortedData;
      
      if (dataToDownload.length === 0) {
        alert('No data to download');
        return;
      }

      // Generate filename based on areas in the data
      const areas = [...new Set(dataToDownload.map(row => row.area || row.Area))];
      const areaName = areas.length === 1 
        ? areas[0].replace(/\s+/g, '_').toLowerCase()
        : areas.length > 1 
          ? `${areas.length}_areas_comparison`
          : 'analysis_results';
      
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const filename = `${areaName}_${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`;

      if (format === 'csv') {
        // Generate CSV
        const headers = Object.keys(dataToDownload[0]);
        const csvContent = [
          headers.join(','),
          ...dataToDownload.map(row => 
            headers.map(header => {
              const value = row[header];
              // Handle values that might contain commas
              return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
            }).join(',')
          )
        ].join('\n');

        // Create and download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // For Excel, we'll send the data to backend to generate proper Excel file
        const response = await fetch('/api/generate-excel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: dataToDownload })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        } else {
          throw new Error('Failed to generate Excel file');
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return 'bi-arrow-down-up';
    return sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  };

  const formatValue = (key, value) => {
    if (key === 'price' && typeof value === 'number') {
      return '₹' + value.toLocaleString();
    }
    if (key === 'demand' && typeof value === 'number') {
      return value.toFixed(1);
    }
    return value;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <Card.Header>
          <i className="bi bi-table me-2"></i>
          Data Table
        </Card.Header>
        <Card.Body>
          <div className="text-center py-4">
            <i className="bi bi-table display-4 text-muted mb-3"></i>
            <p className="text-muted">No data to display</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <i className="bi bi-table me-2"></i>
          Data Table
          <Badge bg="secondary" className="ms-2">
            {filteredAndSortedData.length} of {totalRows || data.length} records
          </Badge>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-success"
            size="sm"
            onClick={() => handleDownload('csv')}
            disabled={downloading}
            title="Download current analysis results as CSV"
          >
            <i className="bi bi-download me-1"></i>
            {downloading ? 'Generating...' : 'Export CSV'}
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleDownload('xlsx')}
            disabled={downloading}
            title="Download current analysis results as Excel"
          >
            <i className="bi bi-download me-1"></i>
            {downloading ? 'Generating...' : 'Export Excel'}
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Search and Controls */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Control
              type="text"
              placeholder="Search in table..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Col>
          <Col md={3}>
            <Form.Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </Form.Select>
          </Col>
        </Row>

        {/* Table */}
        <div className="table-container">
          <Table striped hover responsive>
            <thead>
              <tr>
                {columns.map(column => (
                  <th
                    key={column}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort(column)}
                    className="text-capitalize"
                  >
                    {column.replace('_', ' ')}
                    <i className={`bi ${getSortIcon(column)} ms-1`}></i>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr key={index}>
                  {columns.map(column => (
                    <td key={column}>
                      {formatValue(column, row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-3">
            <Pagination>
              <Pagination.First
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              />
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              })}

              <Pagination.Next
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}

        {/* Results info */}
        <div className="text-center text-muted mt-2">
          Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries
          {searchTerm && ` (filtered from ${data.length} total entries)`}
        </div>
      </Card.Body>
    </Card>
  );
};

export default DataTable;