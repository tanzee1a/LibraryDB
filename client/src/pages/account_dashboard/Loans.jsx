import React, { useState, useEffect } from 'react';

const Loans = () => {
  // Set up state to hold your data
  const [currentlyBorrowed, setCurrentlyBorrowed] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from the API when the component mounts
  useEffect(() => {
    fetch('http://localhost:5000/api/my-loans') // Use your full server URL
      .then(res => res.json())
      .then(data => {
        setCurrentlyBorrowed(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch loans:", err);
        setLoading(false);
      });
  }, []); // The empty [] means this runs only once

  // Show a loading message
  if (loading) {
    return (
      <div className="dashboard-section">
        <h3>Currently Borrowing</h3>
        <p>Loading your borrowed items...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <h3>Currently Borrowing</h3>
      {currentlyBorrowed.length === 0 ? (
        <p>You have no items currently borrowed.</p>
      ) : (
        <ul>
          {currentlyBorrowed.map(item => (
            <li key={item.borrow_id}>
              <strong>{item.title}</strong> - Due by: {new Date(item.dueDate).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Loans;