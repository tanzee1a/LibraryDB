CREATE TABLE ITEM (
    item_id CHAR(13) PRIMARY KEY,
    available INT NOT NULL DEFAULT 0,
    on_hold INT NOT NULL DEFAULT 0,
    loaned_out INT NOT NULL DEFAULT 0,
    quantity INT GENERATED ALWAYS AS (available + on_hold + loaned_out) STORED,
    thumbnail BLOB,
    earliest_available_date DATE,
    category ENUM('BOOK', 'MOVIE', 'DEVICE')
);