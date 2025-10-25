import React from 'react'
import './staff_page.css'

function StaffPage() {
  return (
    <div>
      <p>This is our staff page</p>
      <ul>
        <li><p><button>Put Item On Hold</button></p></li>
        <li><p><button>Take Item Off Hold</button></p></li>
        <li><p><button>Create Report</button></p></li>
        <li><p><button>Issue Fine to User</button></p></li>
        <li><p><button>Pay a User's Fine</button></p></li>
        <li><p><button>Add Item to Inventory</button></p></li>
      </ul>
    </div>
  )
}


export default StaffPage
