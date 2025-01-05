"""add version tracking

Revision ID: 001
Create Date: 2024-01-05
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers
revision: str = '001'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade the database"""
    op.add_column(
        'schemas',
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
    )
    op.add_column(
        'schemas', sa.Column('parent_id', sa.Integer(), nullable=True)
    )
    op.add_column(
        'schemas',
        sa.Column(
            'is_latest', sa.Boolean(), nullable=False, server_default='1'
        ),
    )

    op.create_foreign_key(
        'fk_schema_parent', 'schemas', 'schemas', ['parent_id'], ['id']
    )


def downgrade() -> None:
    """Downgrade the database"""
    op.drop_constraint('fk_schema_parent', 'schemas', type_='foreignkey')
    op.drop_column('schemas', 'is_latest')
    op.drop_column('schemas', 'parent_id')
    op.drop_column('schemas', 'version')
