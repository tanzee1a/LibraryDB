import React from 'react';

const Loans = () => {
  // Dummy data
  const currentlyBorrowed = [
    { id: 1, title: 'Dune', dueDate: '2025-11-15' },
    { id: 2, title: 'The Three-Body Problem', dueDate: '2025-11-28' },
  ];

  return (
    <div className="dashboard-section">
      <h3>Currently Borrowing</h3>
      <ul>
        {currentlyBorrowed.map(book => (
          <li key={book.id}>
            <strong>{book.title}</strong> - Due by {book.dueDate}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Loans;