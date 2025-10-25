import React, { useState, useEffect } from 'react';
import { IoPersonCircleOutline } from 'react-icons/io5';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // NOTE: You need to create this '/api/my-profile' endpoint on the backend!
    fetch('http://localhost:5000/api/my-profile') 
      .then(res => res.ok ? res.json() : Promise.reject('Failed fetch'))
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch profile error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="profile-card">
        <IoPersonCircleOutline className="avatar-icon" aria-hidden="true" />
        <div>Loading profile...</div>
      </div>
    );
  }

  if (!user) {
     return (
       <div className="profile-card">
         <IoPersonCircleOutline className="avatar-icon" aria-hidden="true" />
         <div>Could not load profile.</div>
       </div>
     );
  }

  return (
    <div className="profile-card">
      <IoPersonCircleOutline className="avatar-icon" aria-hidden="true" />
      <div>
        {/* Use data fetched from the API */}
        <div className="item-title">{user.firstName} {user.lastName}</div>
        <div className="profile-meta">User ID: {user.user_id} · {user.email}</div>
      </div>
    </div>
  );
}