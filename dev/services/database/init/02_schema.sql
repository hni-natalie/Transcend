-- ROLE
CREATE TABLE IF NOT EXISTS role (
	role_id    SERIAL PRIMARY KEY,
	role_name  VARCHAR(50) NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);

-- USERS
CREATE TABLE IF NOT EXISTS users (
	user_id        SERIAL PRIMARY KEY,
	user_email     VARCHAR(255) UNIQUE NOT NULL,
	user_name      VARCHAR(50) NOT NULL,
	user_password  VARCHAR(255),           -- NULL for OAuth users
	user_status    VARCHAR(20) DEFAULT 'offline'
					CHECK (user_status IN ('online', 'offline', 'busy', 'in_meeting')),
	oauth_provider VARCHAR(50),            -- 'google' or NULL for email users
	oauth_id       VARCHAR(255) UNIQUE,    -- NULL for email users
	avatar_url     VARCHAR(500),
	role_id        INTEGER NOT NULL REFERENCES role(role_id),
	dp_id          INTEGER,
	created_at     TIMESTAMP DEFAULT NOW()
);

-- DEPARTMENT
CREATE TABLE IF NOT EXISTS department (
	dp_id       SERIAL PRIMARY KEY,
	dp_name     VARCHAR(100) NOT NULL,
	dp_lead     INTEGER,              -- FK to users, add after users exist
	created_at  TIMESTAMP DEFAULT NOW()
);

-- -- ROOM
-- CREATE TABLE IF NOT EXISTS room (
-- 	room_id     SERIAL PRIMARY KEY,
-- 	room_name   VARCHAR(100) NOT NULL,
-- 	room_type   VARCHAR(20) DEFAULT 'meeting'
-- 				CHECK (room_type IN ('meeting', 'pantry', 'game')),
-- 	capacity    INTEGER DEFAULT 8,
-- 	is_occupied BOOLEAN DEFAULT false,
-- 	grid_x      INTEGER DEFAULT 0,
-- 	grid_y      INTEGER DEFAULT 0,
-- 	grid_w      INTEGER DEFAULT 1,
-- 	grid_h      INTEGER DEFAULT 1,
-- 	created_at  TIMESTAMP DEFAULT NOW()
-- );

-- -- DESK
-- CREATE TABLE IF NOT EXISTS desk (
-- 	desk_id     SERIAL PRIMARY KEY,
-- 	label       VARCHAR(20) NOT NULL,   -- 'D-01', 'D-02'
-- 	assigned_to INTEGER REFERENCES users(user_id),
-- 	grid_x      INTEGER NOT NULL,
-- 	grid_y      INTEGER NOT NULL,
-- 	created_at  TIMESTAMP DEFAULT NOW()
-- );

-- -- ROOM ATTENDEE (real-time — who's in which room)
-- CREATE TABLE IF NOT EXISTS room_attendee (
-- 	room_id     INTEGER REFERENCES room(room_id),
-- 	user_id     INTEGER REFERENCES users(user_id),
-- 	joined_at   TIMESTAMP DEFAULT NOW(),
-- 	PRIMARY KEY (room_id, user_id)
-- );

-- -- MEETING
-- CREATE TABLE IF NOT EXISTS meeting (
-- 	meet_id         SERIAL PRIMARY KEY,
-- 	meet_title      VARCHAR(200) NOT NULL,
-- 	meet_desc       TEXT,
-- 	meet_start_time TIMESTAMP,
-- 	meet_end_time   TIMESTAMP,
-- 	room_id         INTEGER REFERENCES room(room_id),
-- 	meeting_minutes TEXT,
-- 	created_at      TIMESTAMP DEFAULT NOW()
-- );

-- -- MEETING ORGANISER
-- CREATE TABLE IF NOT EXISTS meeting_organiser (
-- 	organiser_id  SERIAL PRIMARY KEY,
-- 	meet_id       INTEGER REFERENCES meeting(meet_id),
-- 	user_id       INTEGER REFERENCES users(user_id),
-- 	created_at    TIMESTAMP DEFAULT NOW()
-- );

-- -- MEETING PARTICIPANT
-- CREATE TABLE IF NOT EXISTS meeting_participant (
-- 	participant_id    SERIAL PRIMARY KEY,
-- 	meet_id           INTEGER REFERENCES meeting(meet_id),
-- 	user_id           INTEGER REFERENCES users(user_id),
-- 	attendance_status VARCHAR(10) DEFAULT 'absent'
-- 						CHECK (attendance_status IN ('absent', 'present')),
-- 	created_at        TIMESTAMP DEFAULT NOW()
-- );

-- -- CHAT ROOM
-- CREATE TABLE IF NOT EXISTS chat_room (
-- 	chat_room_id  SERIAL PRIMARY KEY,
-- 	room_type     VARCHAR(10) DEFAULT 'direct'
-- 					CHECK (room_type IN ('direct', 'group')),
-- 	room_name     VARCHAR(100),
-- 	created_at    TIMESTAMP DEFAULT NOW()
-- );

-- -- CHAT MEMBER
-- CREATE TABLE IF NOT EXISTS chat_member (
-- 	chat_room_id  INTEGER REFERENCES chat_room(chat_room_id),
-- 	user_id       INTEGER REFERENCES users(user_id),
-- 	PRIMARY KEY   (chat_room_id, user_id)
-- );

-- -- MESSAGE
-- CREATE TABLE IF NOT EXISTS message (
-- 	message_id    SERIAL PRIMARY KEY,
-- 	chat_room_id  INTEGER REFERENCES chat_room(chat_room_id),
-- 	sender_id     INTEGER REFERENCES users(user_id),
-- 	content       TEXT NOT NULL,
-- 	created_at    TIMESTAMP DEFAULT NOW()
-- );

-- -- NOTIFICATION
-- CREATE TABLE IF NOT EXISTS notification (
-- 	notification_id SERIAL PRIMARY KEY,
-- 	user_id         INTEGER REFERENCES users(user_id),
-- 	notif_type      VARCHAR(50),
-- 	message         TEXT,
-- 	is_read         BOOLEAN DEFAULT false,
-- 	ref_id          INTEGER,
-- 	ref_type        VARCHAR(50),
-- 	created_at      TIMESTAMP DEFAULT NOW()
-- );

-- -- FAQ (with pgvector for RAG)
-- CREATE TABLE IF NOT EXISTS faq (
-- 	faq_id      SERIAL PRIMARY KEY,
-- 	question    TEXT NOT NULL,
-- 	answer      TEXT NOT NULL,
-- 	embedding   vector(1536),
-- 	created_by  INTEGER REFERENCES users(user_id),
-- 	created_at  TIMESTAMP DEFAULT NOW()
-- );

-- -- Create vector similarity index
-- CREATE INDEX IF NOT EXISTS faq_embedding_idx
-- 	ON faq USING ivfflat (embedding vector_cosine_ops)
-- 	WITH (lists = 100);

-- -- AI LOG
-- CREATE TABLE IF NOT EXISTS ai_log (
-- 	log_id      SERIAL PRIMARY KEY,
-- 	user_id     INTEGER REFERENCES users(user_id),
-- 	log_type    VARCHAR(50),
-- 	input       TEXT,
-- 	output      TEXT,
-- 	created_at  TIMESTAMP DEFAULT NOW()
-- );
