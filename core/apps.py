from django.apps import AppConfig
import os

class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        # prevent running during migrations or management commands
        if os.getenv("RUN_MAIN") != "true":
            return

        from core.utils.run_migrations import run_migrations
        from core.utils.create_superuser import create_superuser_if_needed

        run_migrations()
        create_superuser_if_needed()
