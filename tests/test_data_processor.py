import pytest
import pandas as pd
import tempfile
import os
from unittest.mock import patch, MagicMock
import sys
import django
from django.conf import settings

# Setup Django for testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'realestatebot.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    django.setup()
except:
    pass

from api.data_processor import DataProcessor

class TestDataProcessor:
    
    def setup_method(self):
        """Setup test data"""
        self.processor = DataProcessor()
        
        # Create sample test data
        self.sample_data = pd.DataFrame({
            'year': [2020, 2021, 2022, 2020, 2021, 2022],
            'area': ['Wakad', 'Wakad', 'Wakad', 'Aundh', 'Aundh', 'Aundh'],
            'price': [5000000, 5500000, 6000000, 4500000, 4800000, 5200000],
            'demand': [7.5, 8.0, 8.5, 6.5, 7.0, 7.5]
        })
    
    def test_clean_numeric_field(self):
        """Test numeric field cleaning"""
        # Test with currency symbols and commas
        dirty_series = pd.Series(['₹50,00,000', '₹55,00,000', '60,00,000'])
        cleaned = self.processor._clean_numeric_field(dirty_series)
        
        expected = pd.Series([5000000.0, 5500000.0, 6000000.0])
        pd.testing.assert_series_equal(cleaned, expected)
    
    def test_extract_areas(self):
        """Test area extraction from queries"""
        self.processor.df = self.sample_data
        
        # Test exact match
        areas = self.processor._extract_areas('analyze wakad')
        assert 'Wakad' in areas
        
        # Test partial match
        areas = self.processor._extract_areas('show me aundh data')
        assert 'Aundh' in areas
        
        # Test multiple areas
        areas = self.processor._extract_areas('compare wakad and aundh')
        assert 'Wakad' in areas and 'Aundh' in areas
    
    def test_parse_query(self):
        """Test query parsing"""
        self.processor.df = self.sample_data
        
        # Test single area query
        result = self.processor.parse_query('Analyze Wakad')
        assert 'Wakad' in result['areas']
        assert result['metric'] == 'both'
        assert result['years'] is None
        
        # Test comparison query
        result = self.processor.parse_query('Compare Wakad and Aundh demand trends')
        assert len(result['areas']) == 2
        assert result['metric'] == 'demand'
        assert result['comparison'] is True
        
        # Test time-limited query
        result = self.processor.parse_query('Show price growth for Wakad over the last 2 years')
        assert result['years'] == 2
        assert result['metric'] == 'price'
    
    def test_aggregate_data(self):
        """Test data aggregation"""
        self.processor.df = self.sample_data
        
        areas = ['Wakad', 'Aundh']
        aggregated = self.processor._aggregate_data(self.sample_data, areas)
        
        # Check structure
        assert 'Wakad' in aggregated
        assert 'Aundh' in aggregated
        
        # Check Wakad data
        wakad_data = aggregated['Wakad']
        assert 'price_growth' in wakad_data
        assert 'demand_growth' in wakad_data
        assert 'avg_price' in wakad_data
        assert 'avg_demand' in wakad_data
        
        # Check growth calculation (should be positive for both areas)
        assert wakad_data['price_growth'] > 0
        assert wakad_data['demand_growth'] > 0
    
    def test_generate_chart_data(self):
        """Test chart data generation"""
        self.processor.df = self.sample_data
        
        areas = ['Wakad']
        aggregated = self.processor._aggregate_data(self.sample_data, areas)
        
        # Test both metrics
        chart_data = self.processor._generate_chart_data(aggregated, 'both')
        
        assert 'labels' in chart_data
        assert 'datasets' in chart_data
        assert len(chart_data['labels']) == 3  # 2020, 2021, 2022
        assert len(chart_data['datasets']) == 2  # Price and Demand
        
        # Test price only
        chart_data = self.processor._generate_chart_data(aggregated, 'price')
        price_datasets = [d for d in chart_data['datasets'] if 'price' in d['label'].lower()]
        assert len(price_datasets) == 1
    
    def test_get_mock_summary(self):
        """Test mock summary generation"""
        self.processor.df = self.sample_data
        
        areas = ['Wakad']
        aggregated = self.processor._aggregate_data(self.sample_data, areas)
        parsed = {'areas': areas, 'comparison': False}
        
        summary = self.processor._get_mock_summary(aggregated, parsed)
        
        assert isinstance(summary, str)
        assert len(summary) > 50  # Should be a substantial summary
        assert 'Wakad' in summary
        assert '₹' in summary  # Should include price formatting
    
    def test_query_data_integration(self):
        """Test full query processing"""
        self.processor.df = self.sample_data
        
        # Test successful query
        result = self.processor.query_data('Analyze Wakad')
        
        assert 'summary' in result
        assert 'chart' in result
        assert 'table' in result
        assert len(result['table']) > 0
        
        # Test query with no matching areas
        result = self.processor.query_data('Analyze NonExistentArea')
        assert 'error' in result
        assert 'suggestions' in result
    
    def test_get_filtered_data(self):
        """Test data filtering for download"""
        self.processor.df = self.sample_data
        
        # Test area filtering
        filtered = self.processor.get_filtered_data('Wakad')
        assert len(filtered) == 3  # 3 years of Wakad data
        assert all(filtered['area'] == 'Wakad')
        
        # Test no filter
        filtered = self.processor.get_filtered_data()
        assert len(filtered) == 6  # All data
    
    @patch('requests.post')
    def test_llm_integration(self, mock_post):
        """Test LLM API integration"""
        # Mock successful LLM response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'candidates': [{
                'content': {
                    'parts': [{'text': 'Test LLM summary response'}]
                }
            }]
        }
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response
        
        self.processor.df = self.sample_data
        areas = ['Wakad']
        aggregated = self.processor._aggregate_data(self.sample_data, areas)
        parsed = {'areas': areas}
        
        with patch.object(settings, 'GOOGLE_API_KEY', 'test-key'):
            summary = self.processor._get_llm_summary(aggregated, 'test query', parsed)
            assert summary == 'Test LLM summary response'
    
    def test_load_excel_file(self):
        """Test Excel file loading"""
        # Create temporary Excel file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            self.sample_data.to_excel(tmp.name, index=False)
            tmp_path = tmp.name
        
        try:
            # Test successful load
            success = self.processor.load_excel_file(tmp_path)
            assert success is True
            assert len(self.processor.df) == 6
            
            # Test required columns
            assert 'year' in self.processor.df.columns
            assert 'area' in self.processor.df.columns
            assert 'price' in self.processor.df.columns
            assert 'demand' in self.processor.df.columns
            
        finally:
            os.unlink(tmp_path)

if __name__ == '__main__':
    pytest.main([__file__])