import os
from django.core.management import call_command
from django.db.utils import OperationalError, ProgrammingError

def run_migrations():
    """
    Safely run migrations on startup (Railway compatible)
    """
    if os.getenv("RUN_MIGRATIONS") != "true":
        return

    try:
        call_command("migrate", interactive=False)
        print("✅ Database migrations applied")
    except (OperationalError, ProgrammingError) as e:
        print("⚠️ Migration skipped:", e)
