CREATE TABLE IF NOT EXISTS user (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    user_email    VARCHAR(255) UNIQUE NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    user_name     VARCHAR(50) NOT NULL,
    user_status   ENUM('online', 'offline', 'busy', 'in_meeting') DEFAULT 'offline',
    role_id       INT NOT NULL,
    dp_id         INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES role(role_id)
);
