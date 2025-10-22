import './item_details.css'
import Navbar from '../navbar/navbar.jsx'
import thumbnail from '../../assets/book_thumbnail.jpeg';
import { FaRegFileAlt } from "react-icons/fa";
import { IoMdGlobe } from "react-icons/io";
import { IoBookOutline, IoCalendarClearOutline, IoBarcodeOutline } from "react-icons/io5";

function BookDetails() {

  return (
    <div>
      <Navbar/>
      <div className="page-container">
        <div className="item-details-container">
          <div className="thumbnail-section">
            <img src={thumbnail} alt="Book thumbnail" className="thumbnail" />
            <div className="availability-info">
              <p><strong>Holds:</strong> <span>0</span></p>
              <p><strong>Available:</strong> <span>0</span></p>
              <p><strong>Earliest Available:</strong> <span>1 day(s)</span></p>

            </div>

            <button className="action-button borrow-button">Borrow</button>
            <button className="action-button hold-button">Place Hold</button>
          </div>

          <div className="details-section">
            <h1 className="item-title">The Dallergut Dream-making district : a novel</h1>
            <p className="item-author">by <span className='item-author-name'>James West</span></p>
            <hr className="divider" />
            <p className='item-description'>
              {`This small, portable book presents a unique perspective on the human body for artists to study and implement in their drawing work. In this book, artist and teacher Michel Lauricella simplifies the human body into basic shapes and forms, offering profound insight for artists of all kinds, sparking the imagination and improving one’s observational abilities. Rather than going the traditional route of memorizing a repertoire of poses, Lauricella instead stresses learning this small collection of forms, which can then be combined and shaped into the more complex and varied forms and postures we see in the living body.

            Geared toward artists of all levels—from beginners through professionals—this handy, pocket-sized book will help spark your imagination and creativity. Whether your interest is in figure drawing, fine arts, fashion design, game design, or creating comic book or manga art, you will find this helpful book filled with actionable insights.`}
            </p>
            <hr className="divider" />
            <ul className="additional-info">
              <li>
                <span className="info-name">Pages</span>
                <span className="info-icon"><FaRegFileAlt /></span>
                <span className="info-detail">320</span>
              </li>
              <li>
                <span className="info-name">Language</span>
                <span className="info-icon"><IoMdGlobe /></span>
                <span className="info-detail">English</span>
              </li>
              <li>
                <span className="info-name">Publisher</span>
                <span className="info-icon"><IoBookOutline /></span>
                <span className="info-detail">Random House Publishing Group</span>
              </li>
              <li>
                <span className="info-name">Publication Date</span>
                <span className="info-icon"><IoCalendarClearOutline /></span>
                <span className="info-detail">March 3, 2020</span>
              </li>
              <li>
                <span className="info-name">ISBN</span>
                <span className="info-icon"><IoBarcodeOutline /></span>
                <span className="info-detail">9781984881666</span>
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

export default BookDetails