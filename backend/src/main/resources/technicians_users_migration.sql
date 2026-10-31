-- 1. Add user_id column to technicians table if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'solar_db' AND TABLE_NAME = 'technicians' AND COLUMN_NAME = 'user_id');
SET @alter_sql = IF(@col_exists = 0, 'ALTER TABLE technicians ADD COLUMN user_id BIGINT UNIQUE, ADD CONSTRAINT fk_technicians_user FOREIGN KEY (user_id) REFERENCES users(id)', 'SELECT 1');
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Link Karthik Raja (tech 1) to existing user 4 (technician)
UPDATE technicians SET user_id = 4 WHERE id = 1;

-- 3. Insert user accounts for technicians 2 to 15 with BCrypt hash for 'password123'
-- Hash: $2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO
INSERT IGNORE INTO users (id, username, password, full_name, email, phone, active, created_at, updated_at) VALUES
(102, 'tech.ganesh', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Ganesh Moorthy', 'ganesh.tech@sunpower.com', '9840112234', 1, NOW(), NOW()),
(103, 'tech.selva', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Selvakumar R', 'selva.tech@sunpower.com', '9840112235', 1, NOW(), NOW()),
(104, 'tech.praveen', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Praveen Kumar', 'praveen.tech@sunpower.com', '9840112236', 1, NOW(), NOW()),
(105, 'tech.dinesh', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Dinesh Babu', 'dinesh.tech@sunpower.com', '9840112237', 1, NOW(), NOW()),
(106, 'tech.manoj', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Manoj Prabhakar', 'manoj.tech@sunpower.com', '9840112238', 1, NOW(), NOW()),
(107, 'tech.saravanan', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Saravanan V', 'saravanan.tech@sunpower.com', '9840112239', 1, NOW(), NOW()),
(108, 'tech.anand', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Anand Raj', 'anand.tech@sunpower.com', '9840112240', 1, NOW(), NOW()),
(109, 'tech.vijay', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Vijay Anand', 'vijay.tech@sunpower.com', '9840112241', 1, NOW(), NOW()),
(110, 'tech.muthu', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Muthukumar K', 'muthu.tech@sunpower.com', '9840112242', 1, NOW(), NOW()),
(111, 'tech.bala', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Balamurugan P', 'bala.tech@sunpower.com', '9840112243', 1, NOW(), NOW()),
(112, 'tech.senthil', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Senthil Nathan', 'senthil.tech@sunpower.com', '9840112244', 1, NOW(), NOW()),
(113, 'tech.hari', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Hariharan S', 'hari.tech@sunpower.com', '9840112245', 1, NOW(), NOW()),
(114, 'tech.ravi', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Ravi Chandran', 'ravi.tech@sunpower.com', '9840112246', 1, NOW(), NOW()),
(115, 'tech.vignesh', '$2a$10$VaQh7JhfeINpDLRZSR9NL.e.jFGUlWx2yJ63Ng.nYCQIvxa7pIqHO', 'Vigneshwar M', 'vignesh.tech@sunpower.com', '9840112247', 1, NOW(), NOW());

-- 4. Assign ROLE_TECHNICIAN (role_id 4)
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
(102, 4), (103, 4), (104, 4), (105, 4), (106, 4), (107, 4), (108, 4),
(109, 4), (110, 4), (111, 4), (112, 4), (113, 4), (114, 4), (115, 4);

-- 5. Update technicians.user_id foreign keys
UPDATE technicians SET user_id = 102 WHERE id = 2;
UPDATE technicians SET user_id = 103 WHERE id = 3;
UPDATE technicians SET user_id = 104 WHERE id = 4;
UPDATE technicians SET user_id = 105 WHERE id = 5;
UPDATE technicians SET user_id = 106 WHERE id = 6;
UPDATE technicians SET user_id = 107 WHERE id = 7;
UPDATE technicians SET user_id = 108 WHERE id = 8;
UPDATE technicians SET user_id = 109 WHERE id = 9;
UPDATE technicians SET user_id = 110 WHERE id = 10;
UPDATE technicians SET user_id = 111 WHERE id = 11;
UPDATE technicians SET user_id = 112 WHERE id = 12;
UPDATE technicians SET user_id = 113 WHERE id = 13;
UPDATE technicians SET user_id = 114 WHERE id = 14;
UPDATE technicians SET user_id = 115 WHERE id = 15;
