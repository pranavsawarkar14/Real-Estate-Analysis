import pytest
import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

def pytest_configure():
    """Configure Django settings for pytest"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'realestatebot.settings')
    django.setup()

@pytest.fixture(scope='session')
def django_db_setup():
    """Setup test database"""
    pass