import './item_details.css';
import { useState, useEffect } from 'react';

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

function ItemDetails({ isStaff }) {
    const [selectedCategory, setSelectedCategory] = useState("BOOK");
    const item = sampleData.items.find(entry => entry.category === selectedCategory);
    useEffect(() => {
        const newItem = sampleData.items.find(entry => entry.category === selectedCategory);
        setEditedItem({ ...newItem });
    }, [selectedCategory]);
    const thumbnail =
        selectedCategory === "BOOK"
        ? bookThumbnail
        : selectedCategory === "MEDIA"
        ? mediaThumbnail
        : deviceThumbnail;

    const [isEditing, setIsEditing] = useState(false);
    const [editedItem, setEditedItem] = useState({ ...item });
    
    function handleEditToggle() {
        if (isEditing) {
            console.log("Saving item data:", editedItem);
            // TODO: send updated item to server or update global state
        }
        setIsEditing(!isEditing);
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setEditedItem(prev => ({ ...prev, [name]: value }));
    }

    const renderAvailabilityActionButtons = () => {
        if(isStaff) {
            return (
                <>
                    <button
                        className="action-button secondary-button"
                        onClick={handleEditToggle}
                    >
                        {isEditing ? "Save" : "Edit"}
                    </button>
                    <div className="availability-info">
                        <p><strong>Loaned Out:</strong> <span>{isEditing ? <input type="number" name="loanedOut" value={editedItem.loanedOut} onChange={handleInputChange} className="edit-input" /> : item.loanedOut}</span></p>
                        <p><strong>Holds:</strong> <span>{isEditing ? <input type="number" name="holds" value={editedItem.holds} onChange={handleInputChange} className="edit-input" /> : item.holds}</span></p>
                        <p><strong>Available:</strong> <span>{isEditing ? <input type="number" name="available" value={editedItem.available} onChange={handleInputChange} className="edit-input" /> : item.available}</span></p>
                    
                        { !isStaff && (
                            <>
                            <p><strong>Holds:</strong> <span>{item.holds}</span></p>
                            <p><strong>Available:</strong> <span>{item.available}</span></p>
                            </>
                        )}
                        { item.available == 0 && (
                            <p><strong>Earliest Available:</strong> <span>{item.earliestAvailable}</span></p>
                        )}
                    </div>
                </>
            )
        } else {
            return (
                <>
                    <div className="availability-info">
                        <p><strong>Holds:</strong> <span>{item.holds}</span></p>
                        <p><strong>Available:</strong> <span>{item.available}</span></p>
                        { item.available == 0 && (
                            <p><strong>Earliest Available:</strong> <span>{item.earliestAvailable}</span></p>
                        )}
                    </div>
                    {item.available > 0 ? (
                        <button className="action-button primary-button">Borrow</button>
                    ) : (
                        <button className="action-button secondary-button">Place Hold</button>
                    )}
                </>
            )
        }
    }

    const renderAdditionalInfo = () => {
        switch (selectedCategory) {
        case "BOOK":
            return (
            <>
                <li>
                <span className="info-name">Pages</span>
                <span className="info-icon"><FaRegFileAlt /></span>
                <span className="info-detail">
                    {isEditing ? (
                    <input
                        type="text"
                        name="pages"
                        value={editedItem.pages}
                        onChange={handleInputChange}
                        className="edit-input"
                    />
                    ) : (
                    item.pages
                    )}
                </span>
                </li>
                <li>
                <span className="info-name">Language</span>
                <span className="info-icon"><IoMdGlobe /></span>
                <span className="info-detail">
                    {isEditing ? (
                    <input
                        type="text"
                        name="language"
                        value={editedItem.language}
                        onChange={handleInputChange}
                        className="edit-input"
                    />
                    ) : (
                    item.language
                    )}
                </span>
                </li>
                <li>
                    <span className="info-name">Publisher</span>
                    <span className="info-icon"><IoBookOutline /></span>
                    <span className="info-detail">
                        {isEditing ? (
                        <input
                            type="text"
                            name="publisher"
                            value={editedItem.publisher}
                            onChange={handleInputChange}
                            className="edit-input"
                        />
                        ) : (
                        item.publisher
                        )}
                    </span>
                </li>
                <li>
                <span className="info-name">Publication Date</span>
                <span className="info-icon"><IoCalendarClearOutline /></span>
                <span className="info-detail">
                    {isEditing ? (
                    <input
                        type="text"
                        name="publicationDate"
                        value={editedItem.publicationDate}
                        onChange={handleInputChange}
                        className="edit-input"
                    />
                    ) : (
                    item.publicationDate
                    )}
                </span>
                </li>
                <li>
                <span className="info-name">ISBN</span>
                <span className="info-icon"><IoBarcodeOutline /></span>
                <span className="info-detail">
                    {isEditing ? (
                    <input
                        type="text"
                        name="isbn"
                        value={editedItem.isbn}
                        onChange={handleInputChange}
                        className="edit-input"
                        disabled
                    />
                    ) : (
                    item.isbn
                    )}
                </span>
                </li>
            </>
            );
        case "MEDIA":
            return (
            <>
                <li>
                    <span className="info-name">Release Year</span>
                    <span className="info-icon"><IoCalendarClearOutline /></span>
                    <span className="info-detail">
                        {isEditing ? (
                        <input
                            type="text"
                            name="release_year"
                            value={editedItem.release_year}
                            onChange={handleInputChange}
                            className="edit-input"
                        />
                        ) : (
                        item.release_year
                        )}
                    </span>
                </li>
                <li>
                    <span className="info-name">Runtime</span>
                    <span className="info-icon"><IoTimerOutline /></span>
                    <span className="info-detail">
                        {isEditing ? (
                        <input
                            type="text"
                            name="runtime"
                            value={editedItem.runtime}
                            onChange={handleInputChange}
                            className="edit-input"
                        />
                        ) : (
                        item.runtime
                        )}
                    </span>
                </li>
                <li>
                    <span className="info-name">Language</span>
                    <span className="info-icon"><IoMdGlobe /></span>
                    <span className="info-detail">
                        {isEditing ? (
                        <input
                            type="text"
                            name="language"
                            value={editedItem.language}
                            onChange={handleInputChange}
                            className="edit-input"
                        />
                        ) : (
                        item.language
                        )}
                    </span>
                </li>
                <li>
                    <span className="info-name">Format</span>
                    <span className="info-icon"><IoInformationCircleOutline /></span>
                    <span className="info-detail">
                        {isEditing ? (
                        <input
                            type="text"
                            name="format"
                            value={editedItem.format}
                            onChange={handleInputChange}
                            className="edit-input"
                        />
                        ) : (
                        item.format
                        )}
                    </span>
                </li>
                <li>
                    <span className="info-name">Rated</span>
                    <span className="info-icon"><BsTicketPerforated /></span>
                    <span className="info-detail">
                        {isEditing ? (
                        <input
                            type="text"
                            name="rating"
                            value={editedItem.rating}
                            onChange={handleInputChange}
                            className="edit-input"
                        />
                        ) : (
                        item.rating
                        )}
                    </span>
                </li>
            </>
            );
        case "DEVICE":
            return (
            <>
                <li>
                <span className="info-name">Manufacturer</span>
                <span className="info-icon"><TbBuildingFactory2 /></span>
                <span className="info-detail">
                    {isEditing ? (
                    <input
                        type="text"
                        name="manufacturer"
                        value={editedItem.manufacturer}
                        onChange={handleInputChange}
                        className="edit-input"
                    />
                    ) : (
                    item.manufacturer
                    )}
                </span>
                </li>
                <li>
                <span className="info-name">Device Type</span>
                <span className="info-icon"><MdDevicesOther /></span>
                <span className="info-detail">
                    {isEditing ? (
                    <input
                        type="text"
                        name="device_type"
                        value={editedItem.device_type}
                        onChange={handleInputChange}
                        className="edit-input"
                    />
                    ) : (
                    item.device_type
                    )}
                </span>
                </li>
            </>
            );
        default:
            return null;
        }
    };

    const creatorInfo = (() => {
        if (selectedCategory === "BOOK" && Array.isArray(item.authors) && item.authors.length > 0) {
        return { label: "written by ", names: item.authors.join(", ") };
        }
        if (selectedCategory === "MEDIA" && Array.isArray(item.directors) && item.directors.length > 0) {
        return { label: "directed by ", names: item.directors.join(", ") };
        }
        return null;
    })();


    return (
        <div>
        <div className="page-container">
            <div className="category-switch">
                <button
                className={`switch-button ${selectedCategory === "BOOK" ? "active" : ""}`}
                onClick={() => setSelectedCategory("BOOK")}
                >
                Book
                </button>
                <button
                className={`switch-button ${selectedCategory === "MEDIA" ? "active" : ""}`}
                onClick={() => setSelectedCategory("MEDIA")}
                >
                Media
                </button>
                <button
                className={`switch-button ${selectedCategory === "DEVICE" ? "active" : ""}`}
                onClick={() => setSelectedCategory("DEVICE")}
                >
                Device
                </button>
            </div>
            <div className="item-details-container">
                <div className="thumbnail-section">
                    <img src={thumbnail} alt="Item thumbnail" className="thumbnail" />
                    {renderAvailabilityActionButtons()}
                </div>

                <div className="details-section">
                <h1 className="item-title">
                    {isEditing ? (
                        <input
                        type="text"
                        name="title"
                        value={editedItem.title}
                        onChange={handleInputChange}
                        className="edit-input"
                        />
                    ) : (
                        item.title
                    )}
                </h1>
                {creatorInfo && (
                    <p className="item-author">
                        {creatorInfo.label}
                        {isEditing ? (
                        <input
                            type="text"
                            name={selectedCategory === "BOOK" ? "authors" : "directors"}
                            value={
                            selectedCategory === "BOOK"
                                ? editedItem.authors?.join(", ") || ""
                                : editedItem.directors?.join(", ") || ""
                            }
                            onChange={(e) => {
                            const updatedList = e.target.value
                                .split(",")
                                .map((entry) => entry.trim());
                            setEditedItem((prev) => ({
                                ...prev,
                                [selectedCategory === "BOOK" ? "authors" : "directors"]: updatedList,
                            }));
                            }}
                            className="edit-input"
                        />
                        ) : (
                        <span className="item-author-name">{creatorInfo.names}</span>
                        )}
                    </p>
                )}
                <hr className="divider" />
                {isEditing ? (
                    <textarea
                        name="description"
                        value={editedItem.description}
                        onChange={handleInputChange}
                        className="edit-input edit-description"
                    />
                    ) : (
                    <p className='item-description'>{item.description}</p>
                )}
                <hr className="divider" />
                <ul className="additional-info">{renderAdditionalInfo()}</ul>
                <hr className="divider" />
                <div className="tags-section">
                    <p className="tags-title"><strong>Shelf Location:</strong> {isEditing ? (
                        <input
                            type="text"
                            name="shelf_location"
                            value={editedItem.shelf_location}
                            onChange={e => {
                                setEditedItem(prev => ({ ...prev, shelf_location: e.target.value }));
                            }}
                            className="edit-input"
                        />
                    ) : (
                        item.shelf_location
                    )}</p>
                </div>
                <div className="tags-section">
                    <p className="tags-title"><strong>Tags:</strong> {isEditing ? (
                        <input
                            type="text"
                            name="tags"
                            value={editedItem.tags ? editedItem.tags.join(", ") : ""}
                            onChange={e => {
                                const tags = e.target.value.split(",").map(tag => tag.trim());
                                setEditedItem(prev => ({ ...prev, tags: tags }));
                            }}
                            className="edit-input"
                        />
                    ) : (
                        item.tags.join(", ")
                    )}</p>
                </div>
                </div>
            </div>
        </div>
        </div>
    )
}

export default ItemDetails