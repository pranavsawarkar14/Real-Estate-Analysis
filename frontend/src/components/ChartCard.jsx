import React, { useState, useRef, useEffect } from 'react';
import { Card, ButtonGroup, Button } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChartCard = ({ chartData }) => {
  const [viewMode, setViewMode] = useState('both');
  const chartRef = useRef();

  const getFilteredData = () => {
    if (!chartData || !chartData.datasets) return chartData;

    let filteredDatasets = [...chartData.datasets];

    if (viewMode === 'price') {
      filteredDatasets = chartData.datasets.filter(dataset => 
        dataset.label && dataset.label.toLowerCase().includes('price')
      );
    } else if (viewMode === 'demand') {
      filteredDatasets = chartData.datasets.filter(dataset => 
        dataset.label && dataset.label.toLowerCase().includes('demand')
      );
    }
    // 'both' mode shows all datasets

    // Ensure we have data to display
    if (filteredDatasets.length === 0) {
      filteredDatasets = chartData.datasets; // Fallback to show all data
    }

    return {
      ...chartData,
      datasets: filteredDatasets
    };
  };

  const getChartOptions = () => {
    const filteredData = getFilteredData();
    const hasPrice = filteredData.datasets.some(d => d.label && d.label.toLowerCase().includes('price'));
    const hasDemand = filteredData.datasets.some(d => d.label && d.label.toLowerCase().includes('demand'));
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: `Real Estate Trends - ${viewMode === 'both' ? 'Price & Demand' : viewMode === 'price' ? 'Price Analysis' : 'Demand Analysis'}`,
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: 20
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: '#007bff',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (label.toLowerCase().includes('price')) {
                label += '₹' + context.parsed.y.toLocaleString();
              } else if (label.toLowerCase().includes('demand')) {
                label += context.parsed.y.toFixed(1) + '/10';
              } else {
                label += context.parsed.y.toFixed(1);
              }
              return label;
            }
          }
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Year',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0,0,0,0.1)'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: viewMode === 'price' ? 'Price (₹)' : viewMode === 'demand' ? 'Demand Score (1-10)' : 'Value',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0,0,0,0.1)'
          },
          ticks: {
            callback: function(value) {
              if (viewMode === 'price' || (viewMode === 'both' && hasPrice && !hasDemand)) {
                return '₹' + value.toLocaleString();
              } else if (viewMode === 'demand' || (viewMode === 'both' && hasDemand && !hasPrice)) {
                return value.toFixed(1);
              }
              return value;
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6
        },
        line: {
          tension: 0.2
        }
      }
    };
  };

  const filteredData = getFilteredData();
  const chartOptions = getChartOptions();

  if (!filteredData || !filteredData.datasets || filteredData.datasets.length === 0) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <i className="bi bi-graph-up me-2"></i>
          Trends Chart
        </Card.Header>
        <Card.Body>
          <div className="text-center py-4">
            <i className="bi bi-bar-chart display-4 text-muted mb-3"></i>
            <p className="text-muted">No chart data available</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Check what data types are available
  const hasPrice = chartData.datasets.some(d => d.label && d.label.toLowerCase().includes('price'));
  const hasDemand = chartData.datasets.some(d => d.label && d.label.toLowerCase().includes('demand'));

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
        <div className="mb-2 mb-md-0">
          <i className="bi bi-graph-up me-2"></i>
          <strong>Trends Analysis</strong>
        </div>
        <ButtonGroup size="sm" className="chart-toggle">
          <Button
            variant={viewMode === 'both' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('both')}
            disabled={!hasPrice || !hasDemand}
            title={!hasPrice || !hasDemand ? 'Both price and demand data needed' : 'Show both price and demand'}
          >
            <i className="bi bi-bar-chart me-1"></i>
            Both
          </Button>
          <Button
            variant={viewMode === 'price' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('price')}
            disabled={!hasPrice}
            title={!hasPrice ? 'No price data available' : 'Show price trends only'}
          >
            <i className="bi bi-currency-rupee me-1"></i>
            Price
          </Button>
          <Button
            variant={viewMode === 'demand' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('demand')}
            disabled={!hasDemand}
            title={!hasDemand ? 'No demand data available' : 'Show demand trends only'}
          >
            <i className="bi bi-graph-up-arrow me-1"></i>
            Demand
          </Button>
        </ButtonGroup>
      </Card.Header>
      <Card.Body>
        <div className="chart-container">
          <Line
            ref={chartRef}
            data={filteredData}
            options={chartOptions}
            key={viewMode} // Force re-render when view mode changes
          />
        </div>
        <div className="mt-3">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Showing {filteredData.datasets.length} dataset{filteredData.datasets.length !== 1 ? 's' : ''} • 
            Click legend items to toggle visibility • 
            Hover over points for detailed values
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ChartCard;