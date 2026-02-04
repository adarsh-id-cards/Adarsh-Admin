import os
from django.contrib.auth import get_user_model
from django.db.utils import OperationalError

def create_superuser_if_needed():
    """
    Create a superuser ONCE if environment variable is enabled.
    Safe for Railway startup.
    """
    if os.getenv("CREATE_SUPERUSER") != "true":
        return

    try:
        User = get_user_model()

        username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "Admin@123")

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
            )
            print("✅ Superuser created automatically")
        else:
            print("ℹ️ Superuser already exists")

    except OperationalError:
        # DB not ready yet (during migrations)
        print("⚠️ Database not ready, skipping superuser creation")
