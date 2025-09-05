import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or os.urandom(32).hex()
    API_BASE_URL = os.environ.get('API_BASE_URL') or 'http://localhost:3000'
    CACHE_TIMEOUT = 300
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100