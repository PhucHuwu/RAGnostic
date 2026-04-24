"""add profile icon name

Revision ID: 20260424_000002
Revises: 20260415_000001
Create Date: 2026-04-24 00:00:02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260424_000002"
down_revision = "20260415_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "chatbot_profiles",
        sa.Column("icon_name", sa.String(length=64), nullable=False, server_default="bot"),
    )


def downgrade() -> None:
    op.drop_column("chatbot_profiles", "icon_name")
