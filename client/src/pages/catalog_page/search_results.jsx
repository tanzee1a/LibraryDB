import './search_results.css'
import Navbar from '../navbar/navbar.jsx'
import bookThumbnail from '../../assets/book_thumbnail.jpeg'
import mediaThumbnail from '../../assets/media_thumbnail.jpg'
import deviceThumbnail from '../../assets/device_thumbnail.jpeg'
import sampleData from '../../assets/sample_data.json'

function SearchResults() {
    const filters = sampleData.filters;

    const mockResults = sampleData.data.map(item => ({
    ...item,
    thumbnail:
        item.category === "BOOK"
        ? bookThumbnail
        : item.category === "MEDIA"
        ? mediaThumbnail
        : deviceThumbnail,
    }));
    

    const multipleMockResults = [...mockResults, ...mockResults, ...mockResults];

  return (
    <div>
      <Navbar/>
      <div className="page-container">
        <div className='search-result-page-container'>
            <div className="search-result-header">
                <h1>Find your perfect discovery.</h1>
                <input type="text" placeholder="Search..." className="search-result-search-bar" />
            </div>
            <div className="search-results-contents">
            <div className="filter-section">
                {filters.map((filter) => (
                    <div key={filter.category} className="filter-category">
                        <h3>{filter.category}</h3>
                        <ul>
                            {filter.topics.map((topic) => (
                                <li key={topic.name}>
                                    <strong>{topic.name}</strong>
                                    <ul>
                                        {topic.options.map((option) => (
                                            <li key={option}>
                                                <label>
                                                    <input type="checkbox" /> {option}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </div>
                    ))}
                </div>
                <div className="search-results-list">
                    {multipleMockResults.map((item) => {
                        return (
                        <div key={item.id} className={`search-result-item ${item.category.toLowerCase()}`}>
                            <div className="result-info">
                                <div>
                                    <img src={item.thumbnail} alt={item.title} className="result-thumbnail" />
                                </div>
                                <div className='result-text-info'>
                                    <h3 className="result-title">
                                    <a href={`/${item.category.toLowerCase()}-details`} className="result-link">
                                        {item.title}
                                    </a>
                                    </h3>
                                    <div className="result-description">
                                        {item.category === "BOOK" && (
                                        <div className="result-details">
                                            <p><strong>Author:</strong> {item.author}</p>
                                            <p><strong>Publisher:</strong> {item.publisher}</p>
                                            <p><strong>Year:</strong> {item.publicationDate}</p>
                                            <p><strong>ISBN:</strong> {item.isbn}</p>
                                        </div>
                                        )}

                                        {item.category === "MEDIA" && (
                                        <div className="result-details">
                                            <p><strong>Format:</strong> {item.format}</p>
                                            <p><strong>Rating:</strong> {item.rating}</p>
                                            <p><strong>Release Year:</strong> {item.release_year}</p>
                                            <p><strong>Runtime:</strong> {item.runtime}</p>
                                        </div>
                                        )}

                                        {item.category === "DEVICES" && (
                                        <div className="result-details">
                                            <p><strong>Manufacturer:</strong> {item.manufacturer}</p>
                                            <p><strong>Software:</strong> {item.software}</p>
                                            <p><strong>Device Type:</strong> {item.device_type}</p>
                                        </div>
                                        )}
                                        <div className="availability-status">
                                            <p><strong>Holds:</strong> <span>{item.holds}</span></p>
                                            <p><strong>Available:</strong> <span>{item.available}</span></p>
                                            <p><strong>Earliest Available:</strong> <span>{item.earliestAvailable}</span></p>
                                        </div>

                                    </div>
                                </div>
                                <div className="result-actions">
                                    {item.available > 0 ? (
                                        <button className="action-button primary-button">Borrow</button>
                                    ) : (
                                        <button className="action-button secondary-button">Place Hold</button>
                                    )}
                                </div>
                            </div>
                            <hr className="divider" />
                            </div>
                        );
                        })}
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default SearchResults