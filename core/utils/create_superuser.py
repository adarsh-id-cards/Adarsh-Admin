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

        user, created = User.objects.update_or_create(
            username=username,
            defaults={
                "email": email,
                "is_superuser": True,
                "is_staff": True,
                "password": User.objects.make_password(password),
            },
        )
        if created:
            print("✅ Superuser created automatically")
        else:
            print("✅ Superuser updated automatically")

    except OperationalError:
        # DB not ready yet (during migrations)
        print("⚠️ Database not ready, skipping superuser creation")
