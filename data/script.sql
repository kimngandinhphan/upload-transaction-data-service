DROP TABLE IF EXISTS transaction_status_mapping;

CREATE TABLE transaction_status_mapping
(
    id bigint NOT NULL,
    trans_status text NOT NULL,
    csv_format text NOT NULL,
    xml_format text NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO transaction_status_mapping VALUES (1, 'A', 'Approved', 'Approved');
INSERT INTO transaction_status_mapping VALUES (2, 'R', 'Failed', 'Rejected');
INSERT INTO transaction_status_mapping VALUES (3, 'D', 'Finished', 'Done');

DROP TABLE IF EXISTS transactions;

CREATE TABLE transactions
(
    transaction_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,0) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    transaction_date DATETIME NOT NULL,
    trans_status bigint NOT NULL,
    create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY FK_transaction_status_mapping(trans_status),
    CONSTRAINT FK_transaction_status_mapping FOREIGN KEY trans_status REFERENCES transaction_status_mapping.id,
    PRIMARY KEY (transaction_id)
);