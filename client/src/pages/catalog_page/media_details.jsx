import './item_details.css'
import Navbar from '../navbar/navbar.jsx'
import thumbnail from '../../assets/media_thumbnail.jpg';
import { IoMdGlobe } from "react-icons/io";
import { IoInformationCircleOutline, IoTimerOutline, IoCalendarClearOutline } from "react-icons/io5";
import { BsTicketPerforated } from "react-icons/bs";
function MediaDetails() {

  return (
    <div>
      <Navbar/>
      <div className="page-container">
        <div className="item-details-container">
          <div className="thumbnail-section">
            <img src={thumbnail} alt="Media thumbnail" className="thumbnail" />
            <div className="availability-info">
              <p><strong>Holds:</strong> <span>0</span></p>
              <p><strong>Available:</strong> <span>0</span></p>
              <p><strong>Earliest Available:</strong> <span>1 day(s)</span></p>

            </div>

            <button className="action-button borrow-button">Borrow</button>
            <button className="action-button hold-button">Place Hold</button>
          </div>
    
          <div className="details-section">
            <h1 className="item-title">Jurassic World Rebirth</h1>
            <hr className="divider" />
            <p className='item-description'>{`This small, portable book presents a unique perspective on the human body for artists to study and implement in their drawing work. In this book, artist and teacher Michel Lauricella simplifies the human body into basic shapes and forms, offering profound insight for artists of all kinds, sparking the imagination and improving one’s observational abilities. Rather than going the traditional route of memorizing a repertoire of poses, Lauricella instead stresses learning this small collection of forms, which can then be combined and shaped into the more complex and varied forms and postures we see in the living body.
            
            Geared toward artists of all levels—from beginners through professionals—this handy, pocket-sized book will help spark your imagination and creativity. Whether your interest is in figure drawing, fine arts, fashion design, game design, or creating comic book or manga art, you will find this helpful book filled with actionable insights.`}
            </p>
            <hr className="divider" />
            <ul className="additional-info">
              <li>
                <span className="info-name">Release Year</span>
                <span className="info-icon"><IoCalendarClearOutline /></span>
                <span className="info-detail">2020</span>
              </li>
              <li>
                <span className="info-name">Runtime</span>
                <span className="info-icon"><IoTimerOutline /></span>
                <span className="info-detail">2 hours, 30 minutes</span>
              </li>
              <li>
                <span className="info-name">Language</span>
                <span className="info-icon"><IoMdGlobe /></span>
                <span className="info-detail">English</span>
              </li>
              <li>
                <span className="info-name">Format</span>
                <span className="info-icon"><IoInformationCircleOutline /></span>
                <span className="info-detail">DVD</span>
              </li>
              <li>
                <span className="info-name">Rated</span>
                <span className="info-icon"><BsTicketPerforated /></span>
                <span className="info-detail">PG-13</span>
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