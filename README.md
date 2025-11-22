# Group 5 Library Database Project:

## About the Project:

Welcome to the Lbry Database full-stack project! This system was built to simulate a real-world library management system through a responsive web app powered by a MySQL database and a custom Node.js backend. The frontend is built with React, Vite, and CSS.

### Our Mini-World:

Our library revolves around two main types of users:

* ***Patrons***: which include guests, paid members, students, and faculty. All patrons of the library are able to browse our item catalog, but only paid members, students, and faculty have the ability to checkout and join the waitlist for items. Our system enables Patrons to register, join/cancel/renew a membership, login, manage profile details, incur/pay off fines, and join waitlists. 

* ***Staff*** : which includes clerks, assistant librarians, and the librarian. Clerks are able to manage borrows and holds, Assistant Librarians can manage items and users (except staff), generate some reports, and also manage borrows and holds. Librarians can do do all of the previous operations while also generating revenue reports and managing staff.

Our library collection consists of books, movies, and electronic devices. Each item type has its own details (e.g., author, genre, director, or device type). Multiple copies of an item may exist, and each copy can be tracked as Available, On Loan, or On Hold.

---
## Installation/Set up:
1. Clone the repository and navigate into the repo folder
   ```
   git clone git clone https://github.com/tanzee1a/LibraryDB.git
   cd LibraryDB
   ```
2. Set up the backend
   ```
   cd server
   npm install
   ```
 3. Set up front end
    ```
    cd client
    npm install
    ```
  4. Create a .env file:
     ```
     REACT_APP_API_URL=http://localhost:8000
     ```
  5. Run backend
     ```
     cd server
     npm start
     ```
  6. Run Frontend
     ``` 
     cd client
     npm run dev
     ```

---
## Technologies:
* **Frontend**: React, Vite, CSS, Toastify 
* **Backend**: Node.js
* **Database**: MySQL on AWS
* **Authentication**: JWT
* **Hosting**: Vercel (frontend), Render/AWS (backend)
---
## User Authentication
* **Guest**: can only browse our catalog, login, or register as a new user
* **Inactive Patron**: users that have created a non-student or non-faculty account but have not signed up for a membership, only able to browse our catalog, add items to save for later, change profile details, and signup for a membership through the profile page.
* **Active Patron**: users that have put a card on file for their membership, are able to request items for pickups, save for later, join waitlist, pay fines, change profile details, and have items on loan (max 10 items) or hold
* **Student**: users who are not able to register (must be done through librarian or assistant librarian), do not have to pay a membership fee, can change profile password, are able to request items for pickups, save for later, join waitlist, pay fines, change profile details, and have items on loan (max 10 items) or hold
* **Faculty**: users who are not able to register (must be done through librarian or assistant librarian), do not have to pay a membership fee, can change profile password, are able to request items for pickups, save for later, join waitlist, pay fines, change profile details, and have items on loan (max 10 items) or hold
* **Clerk**: manages borrows and holds, can change password
* **Assistant Librarian**: manages borrows, holds, items, fines, and users (not staff). Can generate _some_ reports pertaining to their duties, and can change their own password.
* **Librarian**: manages borrows, holds, items fines, and users (including staff). Can generate _all_ reports, and can update staff details (except their own).
---
## Data Entry Forms
---
## Triggers 
---
## Queries 
---
## Reports
---
## Hosted Weblink Information:




