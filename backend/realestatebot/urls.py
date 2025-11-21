from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def root_view(request):
    return JsonResponse({
        'message': 'Real Estate Analysis API',
        'status': 'running',
        'endpoints': {
            'health': '/api/health/',
            'areas': '/api/areas/',
            'query': '/api/query/',
            'upload': '/api/upload/',
            'download': '/api/download/',
        }
    })

urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)