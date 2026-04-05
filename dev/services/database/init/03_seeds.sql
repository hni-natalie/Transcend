-- runs once automatically when Docker starts
-- only for static default data that never changes
INSERT INTO role (role_name) VALUES ('admin');
INSERT INTO role (role_name) VALUES ('user');
