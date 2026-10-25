CREATE TABLE catalog.showcase
(
    id          VARCHAR(16) PRIMARY KEY,
    name        VARCHAR(128) NOT NULL,
    description TEXT         NOT NULL
);

INSERT INTO catalog.showcase (id, name, description)
VALUES ('K01',
        'Fibonacci',
        'Calculate Fibonacci numbers using different algorithms.');
