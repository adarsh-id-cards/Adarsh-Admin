"""
Django settings for Adarsh Admin project.

Works for both LOCAL development and PRODUCTION without manual changes.
- Local: Uses SQLite, DEBUG=True, localhost settings (defaults)
- Production: Uses DATABASE_URL, DEBUG=False, secure settings (from .env)

Required .env variables for PRODUCTION:
    SECRET_KEY          - Django secret key (generate a new one!)
    DEBUG               - Set to 'False' for production
    DATABASE_URL        - PostgreSQL connection string
    ALLOWED_HOSTS       - Comma-separated hostnames
    SITE_URL            - Full URL of your site (https://yourdomain.com)
    EMAIL_HOST_USER     - SMTP email address
    EMAIL_HOST_PASSWORD - SMTP password/app password

Optional .env variables:
    CSRF_TRUSTED_ORIGINS - Comma-separated trusted origins for CSRF
    TIME_ZONE            - Server timezone (default: Asia/Kolkata)
"""

from pathlib import Path
from dotenv import load_dotenv
import os
import dj_database_url

# Load environment variables from .env file (if exists)
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# =============================================================================
# CORE SETTINGS
# =============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
# In production, set SECRET_KEY in .env file
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-key-change-in-production-*m$!x7r9vt=%9aqv1nnaav')

# SECURITY WARNING: don't run with debug turned on in production!
# Local default: True | Production: Set DEBUG=False in .env
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

# Allowed Hosts
# Local default: localhost, 127.0.0.1 | Production: Add your domain in .env
_default_hosts = 'localhost,127.0.0.1,.localhost' if DEBUG else ''
ALLOWED_HOSTS = [
    host.strip() 
    for host in os.getenv('ALLOWED_HOSTS', _default_hosts).split(',') 
    if host.strip()
]


# =============================================================================
# APPLICATION DEFINITION
# =============================================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "core.apps.CoreConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# =============================================================================
# DATABASE
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases
# =============================================================================

# Local default: SQLite | Production: Set DATABASE_URL in .env
# Example DATABASE_URL: postgres://user:password@host:5432/dbname

DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Production: Use DATABASE_URL (PostgreSQL, MySQL, etc.)
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Local development: Use SQLite (no setup needed)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# =============================================================================
# SECURITY SETTINGS
# =============================================================================

# CSRF Trusted Origins
# Local: Not needed | Production: Add your domains
# Auto-configure for Render deployment
_csrf_origins = os.getenv('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [
    origin.strip() 
    for origin in _csrf_origins.split(',') 
    if origin.strip()
]

# Auto-add Render domain if RENDER_EXTERNAL_HOSTNAME is set
render_hostname = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if render_hostname:
    render_url = f'https://{render_hostname}'
    if render_url not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(render_url)

# Production security settings (only when DEBUG=False)
if not DEBUG:
    # HTTPS settings
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 'yes')
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Cookie security
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # HSTS settings
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Other security
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'


# =============================================================================
# PASSWORD VALIDATION
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators
# =============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# =============================================================================
# INTERNATIONALIZATION
# https://docs.djangoproject.com/en/5.2/topics/i18n/
# =============================================================================

LANGUAGE_CODE = 'en-us'

TIME_ZONE = os.getenv('TIME_ZONE', 'Asia/Kolkata')

USE_I18N = True

USE_TZ = True


# =============================================================================
# STATIC FILES (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/
# =============================================================================

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Whitenoise for serving static files in production
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Media files (Uploads)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'


# =============================================================================
# AUTHENTICATION
# =============================================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'core.User'

# Login settings
LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = 'dashboard'
LOGOUT_REDIRECT_URL = 'login'


# =============================================================================
# EMAIL CONFIGURATION
# Local: Console backend (emails printed to terminal)
# Production: SMTP backend (set credentials in .env)
# =============================================================================

# Check if email credentials are provided
_email_configured = bool(os.getenv('EMAIL_HOST_USER'))

if _email_configured:
    # Production: Use SMTP
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
    EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 'yes')
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
    DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)
else:
    # Local development: Print emails to console
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    EMAIL_HOST_USER = ''
    EMAIL_HOST_PASSWORD = ''
    DEFAULT_FROM_EMAIL = 'noreply@localhost'

# Site URL for email links
# Local: http://localhost:8000 | Production: Set SITE_URL in .env
SITE_URL = os.getenv('SITE_URL', 'http://localhost:8000')


# =============================================================================
# LOGGING (Optional - useful for debugging in production)
# =============================================================================

if not DEBUG:
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '{levelname} {asctime} {module} {message}',
                'style': '{',
            },
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
        },
    }

