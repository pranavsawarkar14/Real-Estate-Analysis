import os
import pandas as pd
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import json
from .data_processor import data_processor

@csrf_exempt
@api_view(['POST'])
def upload_file(request):
    """Handle Excel file upload"""
    try:
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        
        # Validate file type
        if not uploaded_file.name.endswith(('.xlsx', '.xls')):
            return Response({'error': 'Invalid file type. Please upload an Excel file.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Save file temporarily
        file_path = default_storage.save(f'uploads/{uploaded_file.name}', ContentFile(uploaded_file.read()))
        full_path = default_storage.path(file_path)
        
        # Load the new data
        success = data_processor.load_excel_file(full_path)
        
        # Clean up temporary file
        default_storage.delete(file_path)
        
        if success:
            return Response({
                'message': 'File uploaded and processed successfully',
                'areas': data_processor.get_areas()
            })
        else:
            return Response({'error': 'Failed to process the uploaded file. Please check the format.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({'error': f'Upload failed: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
def query_data(request):
    """Handle natural language queries"""
    try:
        data = json.loads(request.body)
        query = data.get('query', '').strip()
        
        if not query:
            return Response({'error': 'Query cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        result = data_processor.query_data(query)
        
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(result)
    
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON in request body'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Query processing failed: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def download_data(request):
    """Download filtered data as CSV or XLSX"""
    try:
        area = request.GET.get('area', '')
        format_type = request.GET.get('format', 'csv').lower()
        
        if format_type not in ['csv', 'xlsx']:
            return Response({'error': 'Invalid format. Use csv or xlsx.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Get filtered data
        filtered_df = data_processor.get_filtered_data(area)
        
        if filtered_df.empty:
            return Response({'error': 'No data found for the specified area'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Generate filename
        area_name = area.replace(' ', '_').lower() if area else 'all_areas'
        filename = f"{area_name}_data.{format_type}"
        
        # Create response
        response = HttpResponse(content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        if format_type == 'csv':
            response['Content-Type'] = 'text/csv'
            filtered_df.to_csv(response, index=False)
        else:
            response['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            filtered_df.to_excel(response, index=False, engine='openpyxl')
        
        return response
    
    except Exception as e:
        return Response({'error': f'Download failed: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def download_sample_dataset(request):
    """Download the original Sample_data.xlsx file"""
    try:
        from pathlib import Path
        from django.conf import settings
        
        # Get the actual sample data file
        base_dir = Path(settings.BASE_DIR).parent
        sample_file = base_dir / 'Sample_data.xlsx'
        
        if sample_file.exists():
            # Serve the actual sample file
            with open(sample_file, 'rb') as f:
                response = HttpResponse(
                    f.read(), 
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = 'attachment; filename="Sample_data.xlsx"'
                return response
        else:
            return Response({'error': 'Sample dataset file not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({'error': f'Failed to download sample dataset: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
def generate_excel(request):
    """Generate Excel file from JSON data"""
    try:
        data = json.loads(request.body)
        table_data = data.get('data', [])
        
        if not table_data:
            return Response({'error': 'No data provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert to DataFrame
        df = pd.DataFrame(table_data)
        
        # Create Excel response
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="analysis_results.xlsx"'
        
        # Write Excel data
        df.to_excel(response, index=False, engine='openpyxl')
        
        return response
    
    except Exception as e:
        return Response({'error': f'Failed to generate Excel file: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_areas(request):
    """Get list of available areas for autocomplete"""
    try:
        areas = data_processor.get_areas()
        return Response({'areas': areas})
    except Exception as e:
        return Response({'error': f'Failed to get areas: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'data_loaded': data_processor.df is not None and not data_processor.df.empty,
        'total_records': len(data_processor.df) if data_processor.df is not None else 0
    })