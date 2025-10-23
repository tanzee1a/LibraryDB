import './item_details.css';
import Navbar from '../navbar/navbar.jsx';

import bookThumbnail from '../../assets/book_thumbnail.jpeg';
import mediaThumbnail from '../../assets/media_thumbnail.jpg';
import deviceThumbnail from '../../assets/device_thumbnail.jpeg';
import { FaRegFileAlt } from "react-icons/fa";
import { IoMdGlobe } from "react-icons/io";
import { IoBookOutline, IoCalendarClearOutline, IoBarcodeOutline, IoInformationCircleOutline, IoTimerOutline } from "react-icons/io5";
import { MdDevicesOther } from "react-icons/md";
import { TbBuildingFactory2 } from "react-icons/tb";
import { BsTicketPerforated } from "react-icons/bs";

import sampleData from '../../assets/sample_data.json'

function ItemDetails({ category = "BOOK" }) {
  const item = sampleData.data.find(entry => entry.category === category);
  const thumbnail =
    category === "BOOK"
      ? bookThumbnail
      : category === "MEDIA"
      ? mediaThumbnail
      : deviceThumbnail;

  const renderAdditionalInfo = () => {
    switch (category) {
      case "BOOK":
        return (
          <>
            <li>
              <span className="info-name">Pages</span>
              <span className="info-icon"><FaRegFileAlt /></span>
              <span className="info-detail">{item.pages}</span>
            </li>
            <li>
              <span className="info-name">Language</span>
              <span className="info-icon"><IoMdGlobe /></span>
              <span className="info-detail">{item.language}</span>
            </li>
            <li>
              <span className="info-name">Publisher</span>
              <span className="info-icon"><IoBookOutline /></span>
              <span className="info-detail">{item.publisher}</span>
            </li>
            <li>
              <span className="info-name">Publication Date</span>
              <span className="info-icon"><IoCalendarClearOutline /></span>
              <span className="info-detail">{item.publicationDate}</span>
            </li>
            <li>
              <span className="info-name">ISBN</span>
              <span className="info-icon"><IoBarcodeOutline /></span>
              <span className="info-detail">{item.isbn}</span>
            </li>
          </>
        );
      case "MEDIA":
        return (
          <>
            <li>
                <span className="info-name">Release Year</span>
                <span className="info-icon"><IoCalendarClearOutline /></span>
                <span className="info-detail">{item.release_year}</span>
              </li>
              <li>
                <span className="info-name">Runtime</span>
                <span className="info-icon"><IoTimerOutline /></span>
                <span className="info-detail">{item.runtime}</span>
              </li>
              <li>
                <span className="info-name">Language</span>
                <span className="info-icon"><IoMdGlobe /></span>
                <span className="info-detail">{item.language}</span>
              </li>
              <li>
                <span className="info-name">Format</span>
                <span className="info-icon"><IoInformationCircleOutline /></span>
                <span className="info-detail">{item.format}</span>
              </li>
              <li>
                <span className="info-name">Rated</span>
                <span className="info-icon"><BsTicketPerforated /></span>
                <span className="info-detail">{item.rating}</span>
              </li>
          </>
        );
      case "DEVICE":
        return (
          <>
            <li>
              <span className="info-name">Manufacturer</span>
              <span className="info-icon"><TbBuildingFactory2 /></span>
              <span className="info-detail">{item.manufacturer}</span>
            </li>
            <li>
              <span className="info-name">Device Type</span>
              <span className="info-icon"><MdDevicesOther /></span>
              <span className="info-detail">{item.device_type}</span>
            </li>
          </>
        );
      default:
        return null;
    }
  };

  const creatorInfo = (() => {
    if (category === "BOOK" && Array.isArray(item.authors) && item.authors.length > 0) {
      return { label: "written by", names: item.authors.join(", ") };
    }
    if (category === "MEDIA" && Array.isArray(item.directors) && item.directors.length > 0) {
      return { label: "directed by", names: item.directors.join(", ") };
    }
    return null;
  })();


  return (
    <div>
      <Navbar/>
      <div className="page-container">
        <div className="item-details-container">
          <div className="thumbnail-section">
            <img src={thumbnail} alt="Item thumbnail" className="thumbnail" />
            <div className="availability-info">
              <p><strong>Holds:</strong> <span>{item.holds}</span></p>
              <p><strong>Available:</strong> <span>{item.available}</span></p>
              {
                item.available == 0 && (
                  <p><strong>Earliest Available:</strong> <span>{item.earliestAvailable}</span></p>
                )
              }
            </div>
            {item.available > 0 ? (
              <button className="action-button primary-button">Borrow</button>
            ) : (
              <button className="action-button secondary-button">Place Hold</button>
            )}
          </div>

          <div className="details-section">
            <h1 className="item-title">{item.title}</h1>
             {creatorInfo && (
              <p className="item-author">
                {creatorInfo.label}{" "}
                <span className="item-author-name">{creatorInfo.names}</span>
              </p>
            )}
            <hr className="divider" />
            <p className='item-description'>{item.description}</p>
            <hr className="divider" />
            <ul className="additional-info">{renderAdditionalInfo()}</ul>
            <hr className="divider" />
            <div className="tags-section">
              <p className="tags-title"><strong>Tags:</strong> {item.tags.join(", ")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetails