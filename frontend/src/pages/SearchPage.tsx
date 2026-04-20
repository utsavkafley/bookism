import './SearchPage.css';

export default function SearchPage() {
  return (
    <div className="search-page">
      <h2>Search Books</h2>
      <input
        type="text"
        placeholder="Search by title or author..."
        className="search-input"
      />
      <div className="search-results empty">
        <p>Search Open Library to find and add books.</p>
      </div>
    </div>
  );
}
