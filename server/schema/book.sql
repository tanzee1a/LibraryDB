CREATE TABLE BOOK (
    item_id CHAR(13) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    publisher VARCHAR(255),
    published_year YEAR,
    shelf_location VARCHAR(100),
    FOREIGN KEY (item_id) REFERENCES ITEM(item_id) ON DELETE CASCADE
);

CREATE TABLE BOOK_AUTHOR (
    item_id CHAR(13),
    author_name VARCHAR(255),
    PRIMARY KEY (item_id, author_name),
    FOREIGN KEY (item_id) REFERENCES BOOK(item_id) ON DELETE CASCADE
);

CREATE TABLE BOOK_GENRE (
    item_id CHAR(13),
    genre_name VARCHAR(100),
    PRIMARY KEY (item_id, genre_name),
    FOREIGN KEY (item_id) REFERENCES BOOK(item_id) ON DELETE CASCADE
);

CREATE TABLE BOOK_TAG (
    item_id CHAR(13),
    tag_name VARCHAR(100),
    PRIMARY KEY (item_id, tag_name),
    FOREIGN KEY (item_id) REFERENCES BOOK(item_id) ON DELETE CASCADE
);
