"""create execution table

Revision ID: e6dbe344f903
Revises: 
Create Date: 2026-10-29 19:52:04.048724

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e6dbe344f903'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "execution",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("algorithm_id", sa.String(64), nullable=False),
        sa.Column("implementation_version", sa.String(64), nullable=False),
        sa.Column("scenario_version_id", sa.Uuid(), nullable=False),
        sa.Column("input_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column(
            "status",
            sa.String(16),
            nullable=False,
            server_default=sa.text("'queued'"),
        ),
        sa.Column(
            "attempt",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column("lease_until", sa.DateTime(timezone=True)),
        sa.Column("result", postgresql.JSONB()),
        sa.Column("error", sa.Text()),
        sa.Column("duration_ms", sa.Float()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "status IN ('queued', 'running', 'completed', 'failed')",
            name="ck_execution_status_check",
        ),
        sa.CheckConstraint(
            "attempt >= 0",
            name="ck_execution_attempt",
        ),
        schema="executions",
    )
    op.create_index(
        "ix_execution_status_created_at",
        "execution",
        ["status", "created_at"],
        schema="executions",
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        "ix_execution_status_created_at",
        table_name="execution",
        schema="executions",
    )
    op.drop_table("execution", schema="executions")
