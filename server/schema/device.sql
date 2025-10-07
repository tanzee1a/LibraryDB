CREATE TABLE DEVICE (
    item_id CHAR(13) PRIMARY KEY,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    description TEXT,
    type VARCHAR(50),
    FOREIGN KEY (item_id) REFERENCES ITEM(item_id) ON DELETE CASCADE
);