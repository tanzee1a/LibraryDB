import './item_details.css'
import Navbar from '../navbar/navbar.jsx'
import thumbnail from '../../assets/book_thumbnail.jpeg';
import { FaRegFileAlt } from "react-icons/fa";
import { IoMdGlobe } from "react-icons/io";
import { IoBookOutline, IoCalendarClearOutline, IoBarcodeOutline } from "react-icons/io5";
import sampleData from '../../assets/sample_data.json'

function BookDetails() {
  const book = sampleData.data.find(item => item.id === 1);
  return (
    <div>
      <Navbar/>
      <div className="page-container">
        <div className="item-details-container">
          <div className="thumbnail-section">
            <img src={thumbnail} alt="Book thumbnail" className="thumbnail" />
            <div className="availability-info">
              <p><strong>Holds:</strong> <span>{book.holds}</span></p>
              <p><strong>Available:</strong> <span>{book.available}</span></p>
              <p><strong>Earliest Available:</strong> <span>{book.earliestAvailable}</span></p>
            </div>
            {book.available > 0 ? (
              <button className="action-button primary-button">Borrow</button>
            ) : (
              <button className="action-button secondary-button">Place Hold</button>
            )}
          </div>

          <div className="details-section">
            <h1 className="item-title">{book.title}</h1>
            <p className="item-author">by <span className='item-author-name'>{book.author}</span></p>
            <hr className="divider" />
            <p className='item-description'>{book.description}</p>
            <hr className="divider" />
            <ul className="additional-info">
              <li>
                <span className="info-name">Pages</span>
                <span className="info-icon"><FaRegFileAlt /></span>
                <span className="info-detail">{book.pages}</span>
              </li>
              <li>
                <span className="info-name">Language</span>
                <span className="info-icon"><IoMdGlobe /></span>
                <span className="info-detail">{book.language}</span>
              </li>
              <li>
                <span className="info-name">Publisher</span>
                <span className="info-icon"><IoBookOutline /></span>
                <span className="info-detail">{book.publisher}</span>
              </li>
              <li>
                <span className="info-name">Publication Date</span>
                <span className="info-icon"><IoCalendarClearOutline /></span>
                <span className="info-detail">{book.publicationDate}</span>
              </li>
              <li>
                <span className="info-name">ISBN</span>
                <span className="info-icon"><IoBarcodeOutline /></span>
                <span className="info-detail">{book.isbn}</span>
              </li>
            </ul>
            <hr className="divider" />
            <div className="tags-section">
              <p className="tags-title"><strong>Tags:</strong> {book.tags.join(", ")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetails