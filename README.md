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
  4. TBC (need to make sure set up steps are for sure what im thinking LOL)
---
## Technologies:
* **Frontend**: React, Vite, CSS, Toastify 
* **Backend**: Node.js
* **Database**: MySQL on AWS
* **Authentication**: JWT
* **Hosting**: Vercel (frontend), Render/AWS (backend)
---
## User Authentication
   


