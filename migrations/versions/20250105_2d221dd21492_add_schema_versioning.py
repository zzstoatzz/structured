"""add schema versioning

Revision ID: 2d221dd21492
Revises: 
Create Date: 2025-01-05 07:47:44.554667+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d221dd21492'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('schemas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=False),
    sa.Column('prompt', sa.String(), nullable=False),
    sa.Column('fields', sa.JSON(), nullable=False),
    sa.Column('version', sa.Integer(), nullable=False),
    sa.Column('is_builtin', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.Column('is_latest', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['parent_id'], ['schemas.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('generations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('schema_id', sa.Integer(), nullable=False),
    sa.Column('prompt', sa.String(), nullable=False),
    sa.Column('output', sa.JSON(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('is_favorite', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['schema_id'], ['schemas.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('generations')
    op.drop_table('schemas')
    # ### end Alembic commands ###
