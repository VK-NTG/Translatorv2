"""Add language_settings table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2025-01-07 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Create language_settings table
    op.create_table('language_settings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('code', sa.String(length=8), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=True),
        sa.Column('voice', sa.String(length=64), nullable=True),
        sa.Column('transcribe_model', sa.String(length=32), nullable=True),
        sa.Column('translation_model', sa.String(length=32), nullable=True),
        sa.Column('summary_model', sa.String(length=32), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )


def downgrade():
    op.drop_table('language_settings')
