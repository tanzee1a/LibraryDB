import './item_details.css'
import Navbar from '../navbar/navbar.jsx'
import thumbnail from '../../assets/device_thumbnail.jpeg';
import { MdDevicesOther } from "react-icons/md";
import { TbBuildingFactory2 } from "react-icons/tb";
import { BsGear } from "react-icons/bs";
import sampleData from '../../assets/sample_data.json'

function DeviceDetails() {
  const device = sampleData.data.find(item => item.id === 3);

  return (
    <div>
      <Navbar/>
      <div className="page-container">
        <div className="item-details-container">
          <div className="thumbnail-section">
            <img src={thumbnail} alt="Device thumbnail" className="thumbnail" />
            <div className="availability-info">
              <p><strong>Holds:</strong> <span>{device.holds}</span></p>
              <p><strong>Available:</strong> <span>{device.available}</span></p>
              <p><strong>Earliest Available:</strong> <span>{device.earliestAvailable}</span></p>

            </div>
            {device.available > 0 ? (
              <button className="action-button primary-button">Borrow</button>
            ) : (
              <button className="action-button secondary-button">Place Hold</button>
            )}
          </div>

          <div className="details-section">
            <h1 className="item-title">{device.title}</h1>
            <hr className="divider" />
            <p className='item-description'>{device.description}</p>
            <hr className="divider" />
            <ul className="additional-info">
              <li>
                <span className="info-name">Manufacturer</span>
                <span className="info-icon"><TbBuildingFactory2 /></span>
                <span className="info-detail">{device.manufacturer}</span>
              </li>
              <li>
                <span className="info-name">Software</span>
                <span className="info-icon"><BsGear /></span>
                <span className="info-detail">{device.software}</span>
              </li>
              <li>
                <span className="info-name">Device Type</span>
                <span className="info-icon"><MdDevicesOther /></span>
                <span className="info-detail">{device.device_type}</span>
              </li>
            </ul>
            <hr className="divider" />
            <div className="tags-section">
              <p className="tags-title"><strong>Tags:</strong> {device.tags.join(", ")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceDetails