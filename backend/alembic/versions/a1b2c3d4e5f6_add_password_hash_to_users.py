"""add password_hash to users

Revision ID: a1b2c3d4e5f6
Revises: c4777e021230
Create Date: 2026-05-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import bcrypt


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c4777e021230'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('password_hash', sa.String(), nullable=True))

    # Migrate the old demo user to the new johndoe identity
    users = sa.table(
        'users',
        sa.column('google_id', sa.String),
        sa.column('email', sa.String),
        sa.column('name', sa.String),
        sa.column('password_hash', sa.String),
    )
    hashed = bcrypt.hashpw(b"demo1234", bcrypt.gensalt()).decode()
    op.execute(
        users.update()
        .where(users.c.google_id == 'demo')
        .values(email='johndoe@bookism.app', name='John Doe', password_hash=hashed)
    )


def downgrade() -> None:
    users = sa.table(
        'users',
        sa.column('google_id', sa.String),
        sa.column('email', sa.String),
        sa.column('name', sa.String),
    )
    op.execute(
        users.update()
        .where(users.c.google_id == 'demo')
        .values(email='demo@bookism.app', name='Demo Reader')
    )
    op.drop_column('users', 'password_hash')
