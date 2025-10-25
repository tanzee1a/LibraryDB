import './manage_fines.css'
import sampleData from '../../assets/sample_data.json'

import { useState } from 'react'
import { FaPlus } from 'react-icons/fa'

function ManageFines() {
    const fines = sampleData.fines;
    const multipleFines = [...fines, ...fines, ...fines];

    const filter = sampleData.user_filters.find(filter => filter.category === "Fines");

    const [showAddFineSheet, setShowAddFineSheet] = useState(false);
    const [newFine, setNewFine] = useState({
        user_email: '',
        borrow_id: '',
        amount: ''
    });

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    const renderFineActionButtons = (fine) => {
        const buttons = [];
        switch (fine.status_id) {
            case 'Awaiting Payment':
                buttons.push(<button key="markPaid" className="action-button primary-button">Mark as Paid</button>);
                buttons.push(<button key="cancel" className="action-button secondary-button">Cancel Fine</button>);
                break;
            case 'Paid':
                buttons.push(<button key="refund" className="action-button red-button">Refund</button>);
                break;
            default:
                break;
        }
        return buttons;
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewFine(prev => ({
            ...prev,
            [name]: value
        }));
    }

    const handleAddFineSubmit = (e) => {
        e.preventDefault();
        // Implement submission logic here
        // For now, just close the sheet and reset form
        console.log("New Fine Added");
        setShowAddFineSheet(false);
        setNewFine({
            user_email: '',
            borrow_id: '',
            amount: ''
        });
    }

    return (
        <div>
        <div className="page-container">
            <div className='search-result-page-container'>
                <div className="search-result-header">
                    <h1>Manage Fines</h1>
                    <div className="search-result-search-bar-container">
                        <button
                            className="action-circle-button primary-button"
                            onClick={() => setShowAddFineSheet(true)}
                        >
                            <FaPlus />
                        </button>
                        <input type="text" placeholder="Search fines..." className="search-result-search-bar" />
                    </div>
                </div>
                <div className="search-results-contents">
                    <div className="filter-section">
                    {
                        <div key={filter.category} className="filter-category">
                            <h3>{filter.category}</h3>
                            <hr className="divider divider--tight" />
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
                    }
                    </div>
                    <div className="search-results-list">
                        {multipleFines.map((fine) => {
                            return (
                                <div key={`fine-${fine.fine_id}`} className={`search-result-item`}>
                                    <div className="result-info">
                                    <div className='result-text-info'>
                                        <div className='result-title-header'>
                                            <h3 className="result-title">Fine #{fine.fine_id}</h3>
                                            <p className="result-title">{fine.status_id}</p>
                                        </div>
                                        <div className="result-description">
                                            <div className="result-details">
                                                {/* ``/borrow/${fine.borrow_id}` */}
                                                {/* `/item-details/${fine.user.user_id}` */}
                                                <p><a href={`/borrows/`} className="result-link">Borrow #{fine.borrow_id}</a></p>
                                                <p><strong>User:</strong> <a href={`/user`} className="result-link">{fine.user.user_first_name} {fine.user.user_last_name}</a></p>
                                                <p><strong>Date Issued:</strong> {fine.date_issued}</p>
                                                <p><strong>Date Paid:</strong> {fine.date_paid || '-'}</p>
                                                <p><strong>Amount:</strong> {currencyFormatter.format(fine.amount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        {renderFineActionButtons(fine)}
                                    </div>
                                </div>
                                <hr className="divider" />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
        {showAddFineSheet && (
        <div className="sheet-overlay" onClick={() => setShowAddFineSheet(false)}>
            <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Fine</h2>
            <form onSubmit={handleAddFineSubmit}>
                <label>
                User Email:
                <input
                    type="email"
                    name="user_email"
                    className="edit-input"
                    value={newFine.user_email}
                    onChange={handleInputChange}
                    required
                />
                </label>
                <label>
                Borrow ID:
                <input
                    type="number"
                    name="borrow_id"
                    className="edit-input"
                    value={newFine.borrow_id}
                    onChange={handleInputChange}
                    required
                />
                </label>
                <label>
                Amount:
                <input
                    type="number"
                    name="amount"
                    className="edit-input"
                    value={newFine.amount}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                />
                </label>
                <div className="sheet-actions">
                <button type="submit" className="action-button primary-button">Add Fine</button>
                <button
                    type="button"
                    className="action-button secondary-button"
                    onClick={() => setShowAddFineSheet(false)}
                >
                    Cancel
                </button>
                </div>
            </form>
            </div>
        </div>
        )}
        </div>
    )
}

export default ManageFines