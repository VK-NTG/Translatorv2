"""Add sessions and translations tables

Revision ID: a1b2c3d4e5f6
Revises: 368072c06329
Create Date: 2025-01-07 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '368072c06329'
branch_labels = None
depends_on = None


def upgrade():
    # Create sessions table
    op.create_table('sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('language_a', sa.String(length=10), nullable=True),
        sa.Column('language_b', sa.String(length=10), nullable=True),
        sa.Column('model_a', sa.JSON(), nullable=True),
        sa.Column('model_b', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create translations table
    op.create_table('translations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('session_id', sa.String(length=36), nullable=True),
        sa.Column('from_lang', sa.String(length=10), nullable=True),
        sa.Column('to_lang', sa.String(length=10), nullable=True),
        sa.Column('original', sa.Text(), nullable=True),
        sa.Column('translated', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('translations')
    op.drop_table('sessions')
