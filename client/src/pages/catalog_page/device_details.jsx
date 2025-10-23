import './item_details.css'
import Navbar from '../navbar/navbar.jsx'
import thumbnail from '../../assets/device_thumbnail.jpeg';
import { MdDevicesOther } from "react-icons/md";
import { TbBuildingFactory2 } from "react-icons/tb";
import { BsGear } from "react-icons/bs";

function MediaDetails() {
  return (
    <div>
      <Navbar/>
      <div className="page-container">
        <div className="item-details-container">
          <div className="thumbnail-section">
            <img src={thumbnail} alt="Device thumbnail" className="thumbnail" />
            <div className="availability-info">
              <p><strong>Holds:</strong> <span>0</span></p>
              <p><strong>Available:</strong> <span>0</span></p>
              <p><strong>Earliest Available:</strong> <span>1 day(s)</span></p>

            </div>

            <button className="action-button borrow-button">Borrow</button>
            <button className="action-button hold-button">Place Hold</button>
          </div>

          <div className="details-section">
            <h1 className="item-title">MacBook Air 14inch</h1>
            <hr className="divider" />
            <p className="item-description">
              {`10-Core CPU
            8-Core GPU
            16GB Unified Memory
            256GB SSD Storage
            16-core Neural Engine
            13.6-inch Liquid Retina display with True Tone²
            12MP Center Stage camera
            MagSafe 3 charging port
            Two Thunderbolt 4 ports
            Support for up to two external displays
            Magic Keyboard with Touch ID
            Force Touch trackpad
            30W USB-C Power Adapter
            Apple Intelligence Footnote`}
            </p>
            <hr className="divider" />
            <ul className="additional-info">
              <li>
                <span className="info-name">Manufacturer</span>
                <span className="info-icon"><TbBuildingFactory2 /></span>
                <span className="info-detail">Apple</span>
              </li>
              <li>
                <span className="info-name">Software</span>
                <span className="info-icon"><BsGear /></span>
                <span className="info-detail">macOS</span>
              </li>
              <li>
                <span className="info-name">Device Type</span>
                <span className="info-icon"><MdDevicesOther /></span>
                <span className="info-detail">Laptop</span>
              </li>
            </ul>
            <hr className="divider" />
            <div className="tags-section">
              <p className="tags-title"><strong>Tags:</strong> Apple, Macbook, macOS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaDetails