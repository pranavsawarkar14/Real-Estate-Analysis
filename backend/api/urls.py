from django.urls import path
from . import views

urlpatterns = [
    path('upload', views.upload_file, name='upload'),
    path('query', views.query_data, name='query'),
    path('download', views.download_data, name='download'),
    path('download-sample', views.download_sample_dataset, name='download_sample'),
    path('generate-excel', views.generate_excel, name='generate_excel'),
    path('areas', views.get_areas, name='areas'),
    path('health', views.health_check, name='health'),
]