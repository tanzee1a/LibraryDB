import React from 'react';

const UserProfile = () => {
  return (
    <div className="user-profile" style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px' }}>
      <img 
        src="https://i.pravatar.cc/100" 
        alt="User avatar" 
        style={{ borderRadius: '50%', width: '100px', height: '100px' }} 
      />
      <h2>Jane Doe</h2>
      <p>Member ID: LIB-12345</p>
    </div>
  );
};

export default UserProfile;