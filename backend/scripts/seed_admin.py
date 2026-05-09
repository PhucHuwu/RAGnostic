from __future__ import annotations

import sys

from app.core.config import settings
from app.core.security import UserRole, UserStatus
from app.db.session import SessionLocal
from app.services.store import store


def main() -> int:
    username = settings.seed_admin_username.strip()
    password = settings.seed_admin_password
    email = settings.seed_admin_email.strip() or None

    if not username or not password:
        print(
            "Missing seed admin credentials. Set SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD.",
            file=sys.stderr,
        )
        return 1

    with SessionLocal() as db:
        existing = store.get_user_by_username(db, username)
        if existing is not None:
            print(f"Admin user '{username}' already exists. Skipped.")
            return 0

        store.create_user(
            db,
            username=username,
            password=password,
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            email=email,
        )
        print(f"Seeded admin user '{username}'.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
