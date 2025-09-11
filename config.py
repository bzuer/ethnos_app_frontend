import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or os.urandom(32).hex()
    API_BASE_URL = os.environ.get('API_BASE_URL') or 'http://localhost:3000'
    
    # Cache Configuration
    CACHE_DURATION = 300  # 5 minutes
    HOMEPAGE_CACHE_DURATION = 600  # 10 minutes
    
    # Pagination Configuration  
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    DEFAULT_LIMIT = 25
    
    # Request Configuration
    API_TIMEOUT = 15
    API_RETRY_COUNT = 2