# Bookism

A personal reading tracker for keeping a record of what you've read and your notes on each book. Built as a mobile-responsive web app you can access from your phone while reading or from your desktop when sitting down to write.

## What It Does

Bookism does two things well:

1. **Track your reading** — maintain a catalog of books you've finished, are currently reading, or want to read.
2. **Capture your notes** — attach rich-text notes to each book that you can edit and revisit over time.

That's it. No social features, no gamification, no stats dashboards. Just your books and your thoughts on them.

## Core Features

### Book Search & Entry
- Search for books via the [Open Library API](https://openlibrary.org/developers/api) to pull in title, author, cover image, page count, publish year, and ISBN automatically.
- User selects a result and adds it to their library with a status.

### Reading Statuses
- **Currently Reading** — books you're actively reading.
- **Finished** — books you've completed, tagged with the year you finished them.
- **To Read** — a separate list of books you intend to pick up.

### Notes
- Each book has a dedicated notes page with a rich-text editor ([Tiptap](https://tiptap.dev/)).
- Users can freely write, format, add headings/sections, bold, italic, lists, quotes, etc.
- Notes auto-save as you type (debounced).
- Notes are the review — no separate review system.

### Year Tagging
- When marking a book as "Finished," the user tags it with the year they read it.
- Users can filter their finished books by year.

### Authentication
- Google OAuth sign-in (via Google Identity Services).
- All data is tied to the authenticated user.

## Tech Stack

| Layer       | Technology                     | Why                                                    |
|-------------|--------------------------------|--------------------------------------------------------|
| Frontend    | React + TypeScript             | Component-driven, huge ecosystem, portfolio diversity  |
| Styling     | you decide (i prefer reading my css)|                                                   |
| Text Editor | Tiptap (ProseMirror)           | Modern rich-text editor, extensible, great React support |
| Backend     | Python + FastAPI               | Lightweight, async, auto-generated API docs            |
| Database    | PostgreSQL                     | Reliable, free on Render, relational fits the data model |
| ORM         | SQLAlchemy + Alembic           | Mature Python ORM with migrations                      |
| Auth        | Google OAuth 2.0               | Simple, no password management                         |
| Deployment  | Vercel (FE) + Render (BE + DB) | Free tiers, simple setup                               |

## Data Model

```
users
├── id (PK)
├── google_id
├── email
├── name
├── avatar_url
├── created_at

books
├── id (PK)
├── user_id (FK → users)
├── open_library_key
├── title
├── author
├── cover_url
├── page_count
├── publish_year
├── isbn
├── status (currently_reading | finished | to_read)
├── year_read (nullable, set when status = finished)
├── notes (rich text, stored as JSON/HTML)
├── created_at
├── updated_at
```

## API Endpoints

```
Auth
  POST   /auth/google          → Google OAuth callback, returns JWT

Books
  GET    /books                 → List user's books (filter by status, year_read)
  POST   /books                 → Add a book to library
  GET    /books/:id             → Get book details + notes
  PATCH  /books/:id             → Update status, year_read, or notes
  DELETE /books/:id             → Remove book from library

Search
  GET    /search?q=             → Proxy to Open Library API, return formatted results
```

## Pages / Views

```
/login              → Google sign-in
/library            → Main view: tabs for Currently Reading, Finished, To Read
/library?year=2026  → Finished books filtered by year
/book/:id           → Book detail page with notes editor
/search             → Search Open Library, add books
```

### Feature request:
- Glitch animation should happen briefly during hover and stop.
- Currently if I search a book and go to its view, it now automatically is in my library because we set it as ToRead, for when a user simply goes to a books section lets not add it to our To Read immediately. Idk what this means in terms of putting reviews? Or if we see that the user has added a review we immediately set it to read to current date.
- Instead of posts call them Notes in the UI.
