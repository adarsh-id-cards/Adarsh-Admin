#!/usr/bin/env python
"""
Render Deployment Startup Script
================================
This script runs BEFORE Gunicorn starts to:
1. Apply database migrations
2. Create superuser if not exists

Usage in Render Start Command:
    python startup.py && gunicorn config.wsgi

Safe for:
- Multiple deployments
- Database restarts
- No shell access environments
"""

import os
import sys
import django

def main():
    """
    Main startup routine for Render deployment.
    Runs when RENDER environment variable is set (Render sets RENDER_EXTERNAL_HOSTNAME).
    """
    # Check if we're in Render/Production environment
    # Render automatically sets RENDER_EXTERNAL_HOSTNAME, not RENDER=true
    is_render = bool(os.getenv("RENDER_EXTERNAL_HOSTNAME")) or os.getenv("RENDER", "").lower() == "true"
    is_production = os.getenv("ENV", "").lower() == "production"
    force_startup = os.getenv("RUN_STARTUP", "").lower() == "true"
    debug_mode = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    
    # Run startup if: on Render, or production, or forced, or DEBUG=False
    should_run = is_render or is_production or force_startup or not debug_mode
    
    if not should_run:
        print("[Startup] Skipping (local development mode)")
        return True
    
    print("=" * 60)
    print("[Startup] Deployment Initialization")
    print(f"  RENDER_EXTERNAL_HOSTNAME: {os.getenv('RENDER_EXTERNAL_HOSTNAME', 'not set')}")
    print(f"  DEBUG: {os.getenv('DEBUG', 'not set')}")
    print("=" * 60)
    
    # Setup Django
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    django.setup()
    
    success = True
    
    # 1. Run Migrations
    print("\n[Step 1/2] Running database migrations...")
    if not run_migrations():
        print("[WARNING] Migrations had issues, but continuing...")
    
    # 2. Create Superuser
    print("\n[Step 2/2] Creating superuser if needed...")
    if not create_superuser():
        print("[WARNING] Superuser creation had issues, but continuing...")
    
    print("\n" + "=" * 60)
    print("[Startup] Initialization complete!")
    print("=" * 60 + "\n")
    
    return success


def run_migrations():
    """
    Safely apply all pending database migrations.
    Idempotent: safe to run multiple times.
    """
    from django.core.management import call_command
    from django.db import connection
    from django.db.utils import OperationalError, ProgrammingError
    
    try:
        # Test database connection first
        connection.ensure_connection()
        print("  ✓ Database connection established")
        
        # Run migrations
        call_command("migrate", "--no-input", verbosity=1)
        print("  ✓ Migrations applied successfully")
        return True
        
    except OperationalError as e:
        print(f"  ✗ Database connection error: {e}")
        return False
    except ProgrammingError as e:
        print(f"  ✗ Database error: {e}")
        return False
    except Exception as e:
        print(f"  ✗ Unexpected error during migrations: {e}")
        return False


def create_superuser():
    """
    Create a superuser if one does not exist.
    
    Checks:
    1. If ANY superuser exists → skip
    2. If specific admin email exists → skip
    3. Otherwise → create new superuser
    
    Credentials from environment (with defaults):
    - DJANGO_SUPERUSER_USERNAME (default: admin)
    - DJANGO_SUPERUSER_EMAIL (default: admin@mail.com)
    - DJANGO_SUPERUSER_PASSWORD (default: admin123)
    """
    from django.contrib.auth import get_user_model
    from django.db.utils import OperationalError, ProgrammingError
    
    try:
        User = get_user_model()
        
        # Get credentials from environment
        username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@mail.com")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "admin123")
        
        # Check if superuser already exists
        existing = User.objects.filter(is_superuser=True).first()
        if existing:
            print(f"  ✓ Superuser already exists: {existing.username} ({existing.email})")
            return True
        
        # Check if user with this email exists (but not superuser)
        existing_by_email = User.objects.filter(email=email).first()
        if existing_by_email:
            # Upgrade existing user to superuser
            existing_by_email.is_superuser = True
            existing_by_email.is_staff = True
            existing_by_email.role = "super_admin"  # type: ignore
            existing_by_email.save()
            print(f"  ✓ Existing user upgraded to superuser: {existing_by_email.username}")
            return True
        
        # Create new superuser
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
        )
        
        # Set business role (specific to this project)
        user.role = "super_admin"  # type: ignore
        user.save()
        
        print(f"  ✓ Superuser created: {username} ({email})")
        print(f"  ⚠ SECURITY: Change the default password immediately!")
        return True
        
    except OperationalError as e:
        print(f"  ✗ Database not ready: {e}")
        return False
    except ProgrammingError as e:
        print(f"  ✗ Database schema error: {e}")
        return False
    except Exception as e:
        print(f"  ✗ Error creating superuser: {e}")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
