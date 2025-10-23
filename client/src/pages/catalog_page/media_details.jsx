import './item_details.css'
import Navbar from '../navbar/navbar.jsx'
import thumbnail from '../../assets/media_thumbnail.jpg';
import { IoMdGlobe } from "react-icons/io";
import { IoInformationCircleOutline, IoTimerOutline, IoCalendarClearOutline } from "react-icons/io5";
import { BsTicketPerforated } from "react-icons/bs";
import sampleData from '../../assets/sample_data.json'

function MediaDetails() {
  const media = sampleData.data.find(item => item.id === 2);

  return (
    <div>
      <Navbar/>
      <div className="page-container">
        <div className="item-details-container">
          <div className="thumbnail-section">
            <img src={thumbnail} alt="Media thumbnail" className="thumbnail" />
            <div className="availability-info">
              <p><strong>Holds:</strong> <span>{media.holds}</span></p>
              <p><strong>Available:</strong> <span>{media.available}</span></p>
              <p><strong>Earliest Available:</strong> <span>{media.earliestAvailable}</span></p>

            </div>
            {media.available > 0 ? (
              <button className="action-button primary-button">Borrow</button>
            ) : (
              <button className="action-button secondary-button">Place Hold</button>
            )}
          </div>
    
          <div className="details-section">
            <h1 className="item-title">{media.title}</h1>
            <hr className="divider" />
            <p className='item-description'>{media.description}</p>
            <hr className="divider" />
            <ul className="additional-info">
              <li>
                <span className="info-name">Release Year</span>
                <span className="info-icon"><IoCalendarClearOutline /></span>
                <span className="info-detail">{media.release_year}</span>
              </li>
              <li>
                <span className="info-name">Runtime</span>
                <span className="info-icon"><IoTimerOutline /></span>
                <span className="info-detail">{media.runtime}</span>
              </li>
              <li>
                <span className="info-name">Language</span>
                <span className="info-icon"><IoMdGlobe /></span>
                <span className="info-detail">{media.language}</span>
              </li>
              <li>
                <span className="info-name">Format</span>
                <span className="info-icon"><IoInformationCircleOutline /></span>
                <span className="info-detail">{media.format}</span>
              </li>
              <li>
                <span className="info-name">Rated</span>
                <span className="info-icon"><BsTicketPerforated /></span>
                <span className="info-detail">{media.rating}</span>
              </li>
            </ul>
            <hr className="divider" />
            <div className="tags-section">
              <p className="tags-title"><strong>Tags:</strong> Fantasy, Fiction, Adult</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaDetails