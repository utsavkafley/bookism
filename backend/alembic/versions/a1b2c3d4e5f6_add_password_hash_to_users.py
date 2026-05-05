"""add password_hash to users, reset demo user

Revision ID: a1b2c3d4e5f6
Revises: c4777e021230
Create Date: 2026-05-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c4777e021230'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

users_t = sa.table('users', sa.column('id', sa.Integer), sa.column('google_id', sa.String))
books_t = sa.table('books', sa.column('id', sa.Integer), sa.column('user_id', sa.Integer))
posts_t = sa.table('posts', sa.column('book_id', sa.Integer))


def upgrade() -> None:
    op.add_column('users', sa.Column('password_hash', sa.String(), nullable=True))

    # Find the old demo user so we can delete their data
    conn = op.get_bind()
    row = conn.execute(
        sa.select(users_t.c.id).where(users_t.c.google_id == 'demo')
    ).fetchone()

    if row:
        demo_id = row[0]
        # book_ids needed to delete posts first (no cascade on books→posts yet)
        book_ids = [
            r[0] for r in conn.execute(
                sa.select(books_t.c.id).where(books_t.c.user_id == demo_id)
            ).fetchall()
        ]
        if book_ids:
            conn.execute(
                posts_t.delete().where(posts_t.c.book_id.in_(book_ids))
            )
        conn.execute(books_t.delete().where(books_t.c.user_id == demo_id))
        conn.execute(users_t.delete().where(users_t.c.id == demo_id))


def downgrade() -> None:
    op.drop_column('users', 'password_hash')
