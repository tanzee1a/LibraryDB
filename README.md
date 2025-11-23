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
* **Faculty**: users who are not able to register (must be done through librarian or assistant librarian), do not have to pay a membership fee, can change profile password, are able to request items for pickups, save for later, join waitlist, pay fines, change profile details, and have items on loan (max 25 items) or hold
* **Clerk**: manages borrows and holds, can change password
* **Assistant Librarian**: manages borrows, holds, items, fines, and users (not staff). Can generate _some_ reports pertaining to their duties, and can change their own password.
* **Librarian**: manages borrows, holds, items fines, and users (including staff). Can generate _all_ reports, and can update staff details (except their own).
---
## Types of Data That Can Be Added/Modified

Both users and staff are able to manipulate data in our system.

### **On the User Side**
- Users can request pickup for items, which creates a hold on the item and decrements its available count.
- Users can join waitlists for items that are unavailable, and they can also remove themselves from the waitlist.
- Users can pay off their fines.
- Users can change/update their profile details and password.

### **On the Staff Side**

#### **Clerk**
- Can manage borrows:
  - Mark items as returned (increases available count).
  - Manually create a borrow (“Direct Checkout”) for in-person checkout.
- Can mark items as **lost** (reduces item quantity by 1).
- Can mark items as **found** (increases item quantity by 1).
- Can manage holds:
  - Cancel a hold (delete it).
  - Resolve a hold by marking the item as picked up (converts hold into a borrow/loan).
- Can manage the waitlist:
  - Add users to the waitlist manually.
  - Remove users from the waitlist.

#### **Assistant Librarian**
*Includes everything a Clerk can do, plus:*
- Can **create users** (patrons, students, faculty).
- Can manage users:
  - Edit user details.
  - “Deactivate” users (soft delete).
  - “Reactivate” users.
- Can manage items:
  - Add new items to the catalog.
  - Edit item details.
  - “Delete” items (soft delete) — deleted items are hidden from users.  
    *Note: Items currently loaned out or on hold cannot be deleted.*
- Can manage fines:
  - Create new fines.
  - Modify fines by manually marking them paid or waiving them.

#### **Librarian**
*Includes everything an Assistant Librarian can do, plus:*
- Can create staff accounts.
- Can edit staff.
- Can “delete” staff.
---
## Triggers 
### Trigger 1: Automatic Creation of Fines for Overdue Items

**Semantic Constraint**: We must ensure that any item returned after its due date automatically generates a fine record upon return. This fine must be calculated based on the specific daily_late_fee associated with the item’s category and the user’s role.

Standard schema constraints cannot validate data based on changes such as comparing a previous status to a new status or perform calculations involving multiple tables.
We implemented an `AFTER UPDATE` trigger that activates only when a `BORROW` record’s status transitions from Loaned Out to Returned. The trigger performs the following logic:

1. Calculates the daysLate (return_date - due_date).
2. If late, it queries the LOAN_POLICY table to determine the correct fee rate for the user's specific role.
3. It calculates the total fine and inserts a new record into the `FINE` table.


``` sql
CREATE DEFINER=`tan_group5`@`%` TRIGGER `trg_Create_Late_Fine_After_Return` AFTER UPDATE ON `BORROW` FOR EACH ROW BEGIN
    DECLARE loanedOutStatusId TINYINT UNSIGNED DEFAULT 2;
    DECLARE returnedStatusId TINYINT UNSIGNED DEFAULT 3;
    
    DECLARE daysLate INT;
    DECLARE feePerDay DECIMAL(10, 2);
    DECLARE totalFine DECIMAL(10, 2);
    DECLARE user_role_id TINYINT UNSIGNED;

    IF NEW.status_id = returnedStatusId AND OLD.status_id = loanedOutStatusId THEN

        SET daysLate = DATEDIFF(NEW.return_date, OLD.due_date);

        IF daysLate > 0 THEN

            SELECT role_id INTO user_role_id
            FROM USER
            WHERE user_id = NEW.user_id
            LIMIT 1;

            SELECT lp.daily_late_fee INTO feePerDay
            FROM ITEM i
            JOIN LOAN_POLICY lp ON i.category = lp.category
            WHERE i.item_id = NEW.item_id AND lp.role_id = user_role_id;

            IF feePerDay > 0 THEN
                SET totalFine = daysLate * feePerDay;
                
                INSERT INTO FINE (borrow_id, user_id, fee_type, amount, notes)
                VALUES (
                    NEW.borrow_id,
                    NEW.user_id,
                    'LATE',
                    totalFine,
                    CONCAT('Returned ', daysLate, ' day(s) late.')
                );
            END IF;
        END IF;
    END IF;
END
```
### Trigger #2: Enforcement of Waitlist Priority
Semantic Constraint: If an item becomes available (e.g., returned by a previous borrower), it must not return to the general Available pool if a waitlist exists. Instead, it must be automically reserved for the highest-priority user on the waitlist.

This constraint requires intercepting a database operation before it completes, which is impossible using standard foreign keys or constraints. We implemented a `BEFORE UPDATE` trigger to enforce this rule. When the system attempts to increment the available count of an item:

1. The trigger checks the `WAITLIST` table for the highest-priority user.
2. If a user is found, the trigger modifies the update operation: it prevents the available count from increasing and instead increments the on_hold count.
3.  It simultaneously moves the user from the `WAITLIST` to the `HOLD` table and generates a `NOTIFICATION`.

This guarantees data integrity between the item’s status and the waitlist queue, and prevents a case where a returned item might be snatched by a random user borrowing our website before the waitlisted user can get it.

``` sql
CREATE DEFINER=`tan_group5`@`%` TRIGGER `trg_Process_Waitlist_On_Availability` BEFORE UPDATE ON `ITEM` FOR EACH ROW BEGIN
    DECLARE top_user_id VARCHAR(13);
    DECLARE top_waitlist_id INT;
    DECLARE item_title_or_name VARCHAR(255);

    IF NEW.available > OLD.available THEN

        SELECT user_id, waitlist_id INTO top_user_id, top_waitlist_id
        FROM `WAITLIST`
        WHERE item_id = NEW.item_id
        ORDER BY start_date ASC, waitlist_id ASC
        LIMIT 1;

        IF top_user_id IS NOT NULL THEN
        
            SET NEW.available = NEW.available - 1;  
            SET NEW.on_hold = NEW.on_hold + 1;    
            
            INSERT INTO `HOLD` (user_id, item_id, expires_at, status_id)
            VALUES (top_user_id, NEW.item_id, NOW() + INTERVAL 3 DAY, 1); 

            DELETE FROM `WAITLIST` WHERE waitlist_id = top_waitlist_id;

            SELECT COALESCE(b.title, m.title, d.device_name)
            INTO item_title_or_name
            FROM ITEM i
            LEFT JOIN BOOK b ON i.item_id = b.item_id
            LEFT JOIN MOVIE m ON i.item_id = m.item_id
            LEFT JOIN DEVICE d ON i.item_id = d.item_id
            WHERE i.item_id = NEW.item_id
            LIMIT 1;

            INSERT INTO `NOTIFICATION` (target_user_id, title, message, link)
            VALUES (
                top_user_id,
                'Your Waitlisted Item is Ready!',
                CONCAT('Your waitlisted item, "', COALESCE(item_title_or_name, 'Untitled Item'), '", is now ready for pickup. You have 3 days to collect it.'),
                '/account?section=holds'
            );
            
        END IF;
    END IF;
END
```
---
## Queries & Reports
### Revenue Report 
The revenue report is only accessible by the librarian. The library has two streams of income: memberships and fines. This revenue report summarizes how much revenue was generated and the split between membership fees and fines. This is useful for budgeting and monitoring the financial health of the subscription-based service (i.e. memberships).
Tables joined: `USER`, `FINE`, `MEMBERSHIP_PAYMENT`.

``` sql
SELECT 'Fine' AS type, u.email AS user_email, f.amount, f.date_paid
FROM FINE f
JOIN USER u ON f.user_id = u.user_id
WHERE f.date_paid IS NOT NULL
-- (Date filtering for Fines is inserted here)

UNION ALL

SELECT 'Membership' AS type, u.email AS user_email, m.amount, m.payment_date AS date_paid
FROM MEMBERSHIP_PAYMENT m
JOIN USER u ON m.user_id = u.user_id
WHERE m.payment_date IS NOT NULL
-- (Date filtering for Memberships is inserted here)
```
<img width="3414" height="1872" alt="revenue report 1/2" src="https://github.com/user-attachments/assets/17828eda-e944-4757-b2af-c4fa9b881215" />
<img width="3414" height="1894" alt="revenue report 2/2" src="https://github.com/user-attachments/assets/451eba9f-5667-41f1-8b6c-71859aad193e" />



---
## Hosted Weblink Information:

* Github Repository: https://github.com/tanzee1a/LibraryDB 
* Live Website: https://library-project-iota.vercel.app/


