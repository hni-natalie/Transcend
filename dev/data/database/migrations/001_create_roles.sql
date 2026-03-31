CREATE TABLE IF NOT EXISTS role (
    role_id    INT AUTO_INCREMENT PRIMARY KEY,
    role_name  VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- seed the two roles immediately
INSERT INTO role (role_name) VALUES ('admin');
INSERT INTO role (role_name) VALUES ('user');