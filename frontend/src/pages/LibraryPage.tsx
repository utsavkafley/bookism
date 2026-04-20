import './LibraryPage.css';

export default function LibraryPage() {
  return (
    <div className="library-page">
      <h2>My Library</h2>
      <div className="status-tabs">
        <button className="tab active">Currently Reading</button>
        <button className="tab">Finished</button>
        <button className="tab">To Read</button>
      </div>
      <div className="book-list empty">
        <p>No books yet. Search to add your first book.</p>
      </div>
    </div>
  );
}
