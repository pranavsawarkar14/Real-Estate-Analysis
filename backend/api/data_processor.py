import pandas as pd
import re
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import requests
from django.conf import settings
import json

class DataProcessor:
    def __init__(self):
        self.df = None
        self.load_default_data()
    
    def load_default_data(self):
        """Load the default sample_data.xlsx file"""
        try:
            # Look for sample_data.xlsx in project root
            base_dir = Path(settings.BASE_DIR).parent
            sample_file = base_dir / 'Sample_data.xlsx'
            
            print(f"🔍 Looking for sample data at: {sample_file}")
            
            if sample_file.exists():
                print("📁 Found sample data file, loading...")
                success = self.load_excel_file(str(sample_file))
                if not success:
                    print("⚠️ Failed to load sample data, starting with empty dataset")
                    self.df = pd.DataFrame()
            else:
                print(f"⚠️ Sample data file not found at {sample_file}")
                print("📝 Starting with empty dataset - you can upload your own Excel file")
                self.df = pd.DataFrame()
        except Exception as e:
            print(f"❌ Error loading default data: {e}")
            self.df = pd.DataFrame()
    
    def load_excel_file(self, file_path: str) -> bool:
        """Load and validate Excel file"""
        try:
            df = pd.read_excel(file_path)
            
            # Print original columns for debugging
            print(f"Original columns: {df.columns.tolist()}")
            
            # Normalize column names (case-insensitive)
            df.columns = df.columns.str.strip().str.lower()
            
            # Map common column name variations
            column_mapping = {
                'yr': 'year',
                'years': 'year',
                'final location': 'area',
                'location': 'area',
                'region': 'area',
                'locality': 'area',
                'place': 'area',
                'city': 'area',
                'flat - weighted average rate': 'price',
                'office - weighted average rate': 'price',
                'cost': 'price',
                'amount': 'price',
                'value': 'price',
                'rate': 'price',
                'total sold - igr': 'demand',
                'residential_sold - igr': 'demand',
                'flat_sold - igr': 'demand',
                'total units': 'demand',
                'demand_score': 'demand',
                'demand_index': 'demand',
                'popularity': 'demand'
            }
            
            # Apply column mapping (but avoid duplicates)
            new_columns = []
            for col in df.columns:
                mapped_col = column_mapping.get(col, col)
                new_columns.append(mapped_col)
            
            df.columns = new_columns
            print(f"Mapped columns: {df.columns.tolist()}")
            
            # Handle duplicate columns by keeping only the first occurrence of each required column
            required_cols = ['year', 'area', 'price', 'demand']
            for req_col in required_cols:
                if req_col in df.columns:
                    # Find all occurrences of this column
                    col_indices = [i for i, col in enumerate(df.columns) if col == req_col]
                    if len(col_indices) > 1:
                        # Keep only the first occurrence, rename others
                        for i, idx in enumerate(col_indices[1:], 1):
                            df.columns.values[idx] = f"{req_col}_{i}"
                        print(f"🔧 Resolved duplicate column '{req_col}'")
            
            # Check required columns
            required_cols = ['year', 'area', 'price', 'demand']
            missing_cols = [col for col in required_cols if col not in df.columns]
            
            if missing_cols:
                print(f"Missing columns: {missing_cols}")
                print(f"Available columns: {df.columns.tolist()}")
                
                # Create the missing columns from available data
                if 'area' not in df.columns:
                    if 'final location' in df.columns:
                        df['area'] = df['final location']
                        print("✅ Mapped 'final location' to 'area'")
                    elif any(col for col in df.columns if 'location' in col.lower()):
                        location_col = next(col for col in df.columns if 'location' in col.lower())
                        df['area'] = df[location_col]
                        print(f"✅ Mapped '{location_col}' to 'area'")
                
                if 'price' not in df.columns:
                    if 'flat - weighted average rate' in df.columns:
                        df['price'] = df['flat - weighted average rate']
                        print("✅ Mapped 'flat - weighted average rate' to 'price'")
                    elif 'office - weighted average rate' in df.columns:
                        df['price'] = df['office - weighted average rate']
                        print("✅ Mapped 'office - weighted average rate' to 'price'")
                    elif any(col for col in df.columns if 'rate' in col.lower() and 'average' in col.lower()):
                        rate_col = next(col for col in df.columns if 'rate' in col.lower() and 'average' in col.lower())
                        df['price'] = df[rate_col]
                        print(f"✅ Mapped '{rate_col}' to 'price'")
                
                if 'demand' not in df.columns:
                    if 'total sold - igr' in df.columns:
                        df['demand'] = df['total sold - igr']
                        print("✅ Mapped 'total sold - igr' to 'demand'")
                    elif 'residential_sold - igr' in df.columns:
                        df['demand'] = df['residential_sold - igr']
                        print("✅ Mapped 'residential_sold - igr' to 'demand'")
                    elif 'flat_sold - igr' in df.columns:
                        df['demand'] = df['flat_sold - igr']
                        print("✅ Mapped 'flat_sold - igr' to 'demand'")
                    elif 'total units' in df.columns:
                        df['demand'] = df['total units']
                        print("✅ Mapped 'total units' to 'demand'")
                
                # Check again if we have all required columns now
                final_missing = [col for col in required_cols if col not in df.columns]
                if final_missing:
                    available_cols = df.columns.tolist()
                    error_msg = f"Could not map required columns: {final_missing}. Available columns: {available_cols}"
                    raise ValueError(error_msg)
                
                print("✅ Successfully mapped all required columns")
            
            # Clean numeric fields
            print("🧹 Cleaning data fields...")
            
            # Clean year
            df['year'] = pd.to_numeric(df['year'], errors='coerce')
            
            # Clean price
            df['price'] = self._clean_numeric_field(df['price'])
            
            # Clean demand
            df['demand'] = self._clean_numeric_field(df['demand'])
            
            # Remove rows with invalid data first
            initial_count = len(df)
            df = df.dropna(subset=['year', 'area', 'price', 'demand'])
            print(f"📊 Removed {initial_count - len(df)} rows with missing data")
            
            # Normalize demand to 1-10 scale if it's too large
            if len(df) > 0 and df['demand'].max() > 100:
                print(f"📈 Scaling demand from {df['demand'].min()}-{df['demand'].max()} to 1-10 scale")
                df['demand'] = (df['demand'] / df['demand'].max() * 9) + 1
            
            # Normalize area names
            df['area'] = df['area'].astype(str).str.strip().str.title()
            
            # Remove any remaining invalid rows
            df = df[df['price'] > 0]  # Price must be positive
            df = df[df['demand'] > 0]  # Demand must be positive
            df = df[df['year'] >= 2000]  # Reasonable year range
            
            print(f"✅ Final dataset: {len(df)} records, {df['area'].nunique()} unique areas")
            
            print(f"Successfully loaded {len(df)} records")
            self.df = df
            return True
            
        except Exception as e:
            print(f"Error loading Excel file: {e}")
            return False
    
    def _clean_numeric_field(self, series):
        """Clean numeric fields by removing commas, currency symbols"""
        try:
            # Convert to pandas Series if it's not already
            if not isinstance(series, pd.Series):
                series = pd.Series(series)
            
            # If it's already numeric, return as-is
            if pd.api.types.is_numeric_dtype(series):
                return pd.to_numeric(series, errors='coerce')
            
            # If it's object type, clean the strings
            if series.dtype == 'object':
                # Remove commas, currency symbols, and other non-numeric characters
                cleaned = series.astype(str).str.replace(r'[,$₹\s]', '', regex=True)
                # Replace empty strings with NaN
                cleaned = cleaned.replace('', pd.NA)
                return pd.to_numeric(cleaned, errors='coerce')
            
            return pd.to_numeric(series, errors='coerce')
        except Exception as e:
            print(f"Error cleaning numeric field: {e}")
            # Return the series converted to numeric with errors as NaN
            return pd.to_numeric(series, errors='coerce')
    
    def get_areas(self) -> List[str]:
        """Get list of unique areas"""
        if self.df is None or self.df.empty:
            return []
        return sorted(self.df['area'].unique().tolist())
    
    def parse_query(self, query: str) -> Dict:
        """Parse natural language query to extract areas, metrics, and time window"""
        query_lower = query.lower()
        
        # Extract areas (fuzzy matching)
        areas = self._extract_areas(query_lower)
        
        # Extract metric preference with more keywords
        metric = 'both'  # default
        price_keywords = ['price', 'cost', 'rate', 'value', 'expensive', 'cheap', 'affordable', 'pricing']
        demand_keywords = ['demand', 'popular', 'sold', 'units', 'sales', 'market', 'activity', 'volume']
        
        has_price = any(keyword in query_lower for keyword in price_keywords)
        has_demand = any(keyword in query_lower for keyword in demand_keywords)
        
        if has_price and not has_demand:
            metric = 'price'
        elif has_demand and not has_price:
            metric = 'demand'
        
        # Extract time window with more patterns
        years_match = re.search(r'(?:last|past|recent)\s*(\d+)\s*years?', query_lower)
        year_range_match = re.search(r'(\d{4})\s*(?:to|-)\s*(\d{4})', query_lower)
        specific_year_match = re.search(r'(?:in|for|during)\s*(\d{4})', query_lower)
        
        years = None
        year_filter = None
        
        if years_match:
            years = int(years_match.group(1))
        elif year_range_match:
            start_year = int(year_range_match.group(1))
            end_year = int(year_range_match.group(2))
            year_filter = (start_year, end_year)
        elif specific_year_match:
            year_filter = int(specific_year_match.group(1))
        
        # Extract analysis type
        analysis_type = 'overview'  # default
        if any(word in query_lower for word in ['compare', 'comparison', 'vs', 'versus', 'against']):
            analysis_type = 'comparison'
        elif any(word in query_lower for word in ['trend', 'growth', 'change', 'over time']):
            analysis_type = 'trend'
        elif any(word in query_lower for word in ['best', 'top', 'highest', 'maximum', 'peak']):
            analysis_type = 'ranking'
        elif any(word in query_lower for word in ['invest', 'investment', 'buy', 'purchase', 'recommend']):
            analysis_type = 'investment'
        
        return {
            'areas': areas,
            'metric': metric,
            'years': years,
            'year_filter': year_filter,
            'analysis_type': analysis_type,
            'comparison': len(areas) > 1,
            'original_query': query
        }
    
    def _extract_areas(self, query: str) -> List[str]:
        """Extract area names from query with improved fuzzy matching"""
        if self.df is None or self.df.empty:
            return []
        
        available_areas = self.get_areas()
        found_areas = []
        query_words = set(query.lower().split())
        
        for area in available_areas:
            area_lower = area.lower()
            area_words = set(area_lower.split())
            
            # Exact match
            if area_lower in query:
                found_areas.append(area)
                continue
            
            # Partial word match (at least 50% of area words found in query)
            matching_words = area_words.intersection(query_words)
            if len(matching_words) >= len(area_words) * 0.5:
                found_areas.append(area)
                continue
            
            # Substring match for single word areas
            if len(area_words) == 1:
                area_word = list(area_words)[0]
                if len(area_word) >= 3 and any(area_word in word for word in query_words):
                    found_areas.append(area)
        
        return found_areas
    
    def query_data(self, query: str) -> Dict:
        """Process query and return summary, chart data, and table data"""
        if self.df is None or self.df.empty:
            return {
                'error': 'No data available. Please upload a dataset first.',
                'summary': '',
                'chart': {},
                'table': []
            }
        
        parsed = self.parse_query(query)
        areas = parsed['areas']
        
        if not areas:
            # Try to suggest similar areas
            suggestions = self._get_area_suggestions(query)
            available_areas = self.get_areas()
            
            if suggestions:
                suggestion_text = f"No exact matches found. Did you mean: {', '.join(suggestions[:3])}?"
            else:
                suggestion_text = f"No matching areas found. Available areas: {', '.join(available_areas[:5])}{'...' if len(available_areas) > 5 else ''}"
            
            return {
                'error': suggestion_text,
                'summary': f"Unable to find data for the requested location in your query: '{query}'. Please try one of the suggested areas or check the available locations.",
                'chart': {},
                'table': [],
                'suggestions': suggestions if suggestions else available_areas[:10]
            }
        
        # Filter data
        filtered_df = self.df[self.df['area'].isin(areas)].copy()
        
        # Apply time window if specified
        if parsed['years']:
            max_year = filtered_df['year'].max()
            min_year = max_year - parsed['years'] + 1
            filtered_df = filtered_df[filtered_df['year'] >= min_year]
        elif parsed['year_filter']:
            if isinstance(parsed['year_filter'], tuple):
                start_year, end_year = parsed['year_filter']
                filtered_df = filtered_df[(filtered_df['year'] >= start_year) & (filtered_df['year'] <= end_year)]
            else:
                filtered_df = filtered_df[filtered_df['year'] == parsed['year_filter']]
        
        # Generate aggregated data
        aggregated = self._aggregate_data(filtered_df, areas)
        
        # Generate summary using LLM or fallback
        summary = self._get_summary(aggregated, query, parsed)
        
        # Generate chart data
        chart_data = self._generate_chart_data(aggregated, parsed['metric'])
        
        # Prepare table data (limit to 500 rows)
        table_data = filtered_df.head(500).to_dict('records')
        
        return {
            'summary': summary,
            'chart': chart_data,
            'table': table_data,
            'total_rows': len(filtered_df)
        }
    
    def _get_area_suggestions(self, query: str) -> List[str]:
        """Get intelligent area suggestions with scoring"""
        areas = self.get_areas()
        query_words = set(query.lower().split())
        
        suggestions = []
        for area in areas:
            area_lower = area.lower()
            area_words = set(area_lower.split())
            
            score = 0
            
            # Exact substring match (highest score)
            if any(word in area_lower for word in query_words if len(word) >= 3):
                score += 10
            
            # Word intersection
            common_words = query_words.intersection(area_words)
            score += len(common_words) * 5
            
            # Partial word matches
            for q_word in query_words:
                if len(q_word) >= 3:
                    for a_word in area_words:
                        if q_word in a_word or a_word in q_word:
                            score += 2
            
            # Character similarity for short queries
            if len(query.strip()) <= 5:
                for q_word in query_words:
                    for a_word in area_words:
                        if len(set(q_word).intersection(set(a_word))) >= min(len(q_word), len(a_word)) * 0.6:
                            score += 1
            
            if score > 0:
                suggestions.append((area, score))
        
        # Sort by score and return top 5
        suggestions.sort(key=lambda x: x[1], reverse=True)
        return [area for area, score in suggestions[:5]]
    
    def _aggregate_data(self, df: pd.DataFrame, areas: List[str]) -> Dict:
        """Aggregate data by year and area"""
        if df.empty:
            return {}
        
        # Group by year and area
        grouped = df.groupby(['year', 'area']).agg({
            'price': 'mean',
            'demand': 'mean'
        }).reset_index()
        
        # Calculate growth rates
        result = {}
        for area in areas:
            area_data = grouped[grouped['area'] == area].sort_values('year')
            if len(area_data) >= 2:
                price_growth = ((area_data['price'].iloc[-1] - area_data['price'].iloc[0]) / 
                               area_data['price'].iloc[0] * 100)
                demand_growth = ((area_data['demand'].iloc[-1] - area_data['demand'].iloc[0]) / 
                                area_data['demand'].iloc[0] * 100)
                
                result[area] = {
                    'data': area_data.to_dict('records'),
                    'price_growth': round(price_growth, 2),
                    'demand_growth': round(demand_growth, 2),
                    'avg_price': round(area_data['price'].mean(), 2),
                    'avg_demand': round(area_data['demand'].mean(), 2)
                }
        
        return result
    
    def _get_summary(self, aggregated: Dict, query: str, parsed: Dict) -> str:
        """Generate summary using Google LLM or fallback"""
        try:
            if settings.GOOGLE_API_KEY:
                return self._get_llm_summary(aggregated, query, parsed)
        except Exception as e:
            print(f"LLM API error: {e}")
        
        # Fallback to deterministic summary
        return self._get_mock_summary(aggregated, parsed)
    
    def _get_llm_summary(self, aggregated: Dict, query: str, parsed: Dict) -> str:
        """Get summary from Google LLM"""
        # Build prompt with aggregated data
        prompt = self._build_llm_prompt(aggregated, query, parsed)
        
        # Call Google LLM API (using Gemini)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={settings.GOOGLE_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        if 'candidates' in result and result['candidates']:
            return result['candidates'][0]['content']['parts'][0]['text'].strip()
        
        raise Exception("No response from LLM")
    
    def _build_llm_prompt(self, aggregated: Dict, query: str, parsed: Dict) -> str:
        """Build enhanced prompt for LLM with context"""
        areas = list(aggregated.keys())
        analysis_type = parsed.get('analysis_type', 'overview')
        
        prompt = f"You are a real estate market analyst. Analyze this data for: '{query}'\n\n"
        prompt += f"Analysis Type: {analysis_type}\n"
        prompt += f"Areas Analyzed: {', '.join(areas)}\n\n"
        
        prompt += "DATA SUMMARY:\n"
        for area, data in aggregated.items():
            prompt += f"\n{area}:\n"
            prompt += f"  • Average Price: ₹{data['avg_price']:,.0f}\n"
            prompt += f"  • Average Demand Score: {data['avg_demand']:.1f}/10\n"
            prompt += f"  • Price Growth: {data['price_growth']:+.1f}%\n"
            prompt += f"  • Demand Growth: {data['demand_growth']:+.1f}%\n"
        
        # Add context based on analysis type
        context_prompts = {
            'comparison': "Compare these areas highlighting the best performer and key differences.",
            'trend': "Focus on growth trends and market momentum over time.",
            'ranking': "Rank these areas and identify the top performer with reasons.",
            'investment': "Provide investment recommendations with risk assessment.",
            'overview': "Provide a comprehensive market overview with key insights."
        }
        
        context = context_prompts.get(analysis_type, context_prompts['overview'])
        
        prompt += f"\n\nINSTRUCTIONS:\n"
        prompt += f"1. {context}\n"
        prompt += f"2. Write EXACTLY 4-5 lines (not sentences, but lines)\n"
        prompt += f"3. Each line should be concise and impactful\n"
        prompt += f"4. Include specific numbers and percentages\n"
        prompt += f"5. End with one clear actionable recommendation\n"
        prompt += f"6. Use professional but accessible language\n"
        prompt += f"7. Focus on the most important insights only\n\n"
        prompt += f"Format your response as exactly 4-5 lines, each line being one key insight or recommendation."
        
        return prompt
    
    def _get_mock_summary(self, aggregated: Dict, parsed: Dict) -> str:
        """Generate enhanced deterministic summary in 4-5 lines"""
        if not aggregated:
            return "No data available for the requested areas."
        
        areas = list(aggregated.keys())
        analysis_type = parsed.get('analysis_type', 'overview')
        
        if len(areas) == 1:
            area = areas[0]
            data = aggregated[area]
            
            lines = []
            lines.append(f"{area} market analysis shows average property price of ₹{data['avg_price']:,.0f} with {data['price_growth']:+.1f}% growth.")
            lines.append(f"Demand score stands at {data['avg_demand']:.1f}/10 with {data['demand_growth']:+.1f}% growth trend.")
            
            if data['price_growth'] > 5 and data['demand_growth'] > 0:
                lines.append(f"Strong market momentum indicates robust investment potential.")
                lines.append(f"Recommendation: Consider this area for medium to long-term investment.")
            elif data['price_growth'] < 0 or data['demand_growth'] < -5:
                lines.append(f"Market shows signs of correction with declining trends.")
                lines.append(f"Recommendation: Wait for market stabilization before investing.")
            else:
                lines.append(f"Market shows stable performance with moderate growth potential.")
                lines.append(f"Recommendation: Suitable for conservative investors seeking steady returns.")
            
            return '\n'.join(lines)
        
        else:
            # Multi-area comparison
            best_price = max(aggregated.items(), key=lambda x: x[1]['price_growth'])
            best_demand = max(aggregated.items(), key=lambda x: x[1]['demand_growth'])
            highest_price = max(aggregated.items(), key=lambda x: x[1]['avg_price'])
            
            lines = []
            lines.append(f"Comparative analysis of {len(areas)} areas: {', '.join(areas)}.")
            lines.append(f"{best_price[0]} leads in price appreciation at {best_price[1]['price_growth']:+.1f}%, while {best_demand[0]} shows highest demand growth at {best_demand[1]['demand_growth']:+.1f}%.")
            lines.append(f"{highest_price[0]} commands premium pricing at ₹{highest_price[1]['avg_price']:,.0f} average.")
            
            if best_price[0] == best_demand[0]:
                lines.append(f"{best_price[0]} emerges as the clear market leader with strong fundamentals.")
                lines.append(f"Recommendation: Prioritize {best_price[0]} for balanced growth and demand potential.")
            else:
                lines.append(f"Market shows diverse opportunities across different growth metrics.")
                lines.append(f"Recommendation: Choose {best_price[0]} for capital gains or {best_demand[0]} for market activity.")
            
            return '\n'.join(lines)
    
    def _generate_chart_data(self, aggregated: Dict, metric: str) -> Dict:
        """Generate Chart.js compatible data"""
        if not aggregated:
            return {}
        
        # Get all years across all areas
        all_years = set()
        for area_data in aggregated.values():
            for record in area_data['data']:
                all_years.add(record['year'])
        
        years = sorted(list(all_years))
        
        datasets = []
        colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8']
        
        for i, (area, data) in enumerate(aggregated.items()):
            color = colors[i % len(colors)]
            
            # Create data arrays for price and demand
            area_df = pd.DataFrame(data['data'])
            
            if metric in ['price', 'both']:
                price_data = []
                for year in years:
                    year_data = area_df[area_df['year'] == year]
                    price_data.append(year_data['price'].iloc[0] if not year_data.empty else None)
                
                datasets.append({
                    'label': f'{area} - Price',
                    'data': price_data,
                    'borderColor': color,
                    'backgroundColor': color + '20',
                    'fill': False,
                    'tension': 0.1
                })
            
            if metric in ['demand', 'both']:
                demand_data = []
                for year in years:
                    year_data = area_df[area_df['year'] == year]
                    demand_data.append(year_data['demand'].iloc[0] if not year_data.empty else None)
                
                datasets.append({
                    'label': f'{area} - Demand',
                    'data': demand_data,
                    'borderColor': color,
                    'backgroundColor': color + '20',
                    'fill': False,
                    'tension': 0.1,
                    'borderDash': [5, 5] if metric == 'both' else []
                })
        
        return {
            'labels': [str(year) for year in years],
            'datasets': datasets
        }
    
    def get_filtered_data(self, area: str = None) -> pd.DataFrame:
        """Get filtered data for download"""
        if self.df is None or self.df.empty:
            return pd.DataFrame()
        
        if area:
            return self.df[self.df['area'].str.contains(area, case=False, na=False)]
        
        return self.df

# Global instance
data_processor = DataProcessor()