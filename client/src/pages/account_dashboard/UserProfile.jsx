import React from 'react';
import { IoPersonCircleOutline } from 'react-icons/io5';

export default function UserProfile() {
  return (
    <div className="profile-card">
      <IoPersonCircleOutline className="avatar-icon" aria-hidden="true" />
      <div>
        <div className="item-title">Jane Doe</div>
        <div className="profile-meta">Member ID: LIB-12345 · jane@library.org</div>
      </div>
      <div>
        <button className="btn primary">Edit</button>
      </div>
    </div>
  );
}