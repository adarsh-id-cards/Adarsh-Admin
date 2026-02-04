from django.apps import AppConfig
import os

class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        # Always run migrations and create superuser on startup
        try:
            from core.utils.run_migrations import run_migrations
            from core.utils.create_superuser import create_superuser_if_needed
            print("[Startup] Running migrations...")
            run_migrations()
            print("[Startup] Creating superuser if needed...")
            create_superuser_if_needed()
        except Exception as e:
            print(f"[Startup] Error during migration/superuser creation: {e}")
