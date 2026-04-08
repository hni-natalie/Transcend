CREATE TABLE roles (
    role_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name   VARCHAR(255) NOT NULL UNIQUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_role_name_not_empty CHECK (role_name <> '')
);


CREATE TABLE departments (
    dp_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dp_name     VARCHAR(255) NOT NULL UNIQUE,
    dp_lead     UUID DEFAULT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dp_name_not_empty CHECK (dp_name <> '')
);


CREATE TABLE users (
    user_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email        VARCHAR(255) NOT NULL UNIQUE,
    user_password     VARCHAR(255),
    user_name         VARCHAR(255) NOT NULL,
    user_status       VARCHAR(20) NOT NULL DEFAULT 'offline',
    role_id           UUID NOT NULL,
    dp_id             UUID NOT NULL,
    
    auth_provider     VARCHAR(20) DEFAULT 'email',
    google_id         VARCHAR(255) UNIQUE,
    email_verified    BOOLEAN DEFAULT FALSE,
    
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(role_id),
    CONSTRAINT fk_user_department FOREIGN KEY (dp_id) REFERENCES departments(dp_id),
    CONSTRAINT chk_email_format CHECK (user_email LIKE '%@%'),
    CONSTRAINT chk_user_name_not_empty CHECK (user_name <> ''),
    CONSTRAINT chk_user_status CHECK (user_status IN ('offline', 'online', 'busy', 'in_meeting')),
    CONSTRAINT chk_password_for_email_auth CHECK (
        (auth_provider = 'email' AND user_password IS NOT NULL AND user_password <> '') OR
        (auth_provider != 'email')
    )
);


ALTER TABLE departments
    ADD CONSTRAINT fk_department_lead FOREIGN KEY (dp_lead) REFERENCES users(user_id);


/* 
CREATE TABLE workspaces (
    workspace_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name               VARCHAR(255) NOT NULL,
    subdomain          VARCHAR(100) NOT NULL UNIQUE,
    url                VARCHAR(500) NOT NULL,
    logo_url           TEXT,
    
    default_permission VARCHAR(50) DEFAULT 'all_users',
    default_booking    VARCHAR(50) DEFAULT 'all_users',
    
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_subdomain_not_empty CHECK (subdomain <> '')
);


CREATE TABLE spaces (
    space_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_name         VARCHAR(255) NOT NULL,
    workspace_id       UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    access_level       VARCHAR(20) NOT NULL DEFAULT 'shared',
    department_id      UUID REFERENCES departments(dp_id) ON DELETE CASCADE,
    key_person_id      UUID REFERENCES users(user_id) ON DELETE SET NULL,

    width              INTEGER NOT NULL DEFAULT 50,
    height             INTEGER NOT NULL DEFAULT 50,
    
    is_public_view     BOOLEAN DEFAULT TRUE,
    is_public_book     BOOLEAN DEFAULT TRUE,
    
    capacity           INTEGER DEFAULT 0,
    sort_order         INTEGER DEFAULT 0,
    is_active          BOOLEAN DEFAULT TRUE,
    
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_access_level CHECK (access_level IN ('shared', 'department')),
    CONSTRAINT chk_private_space_has_department CHECK (
        (access_level = 'department' AND department_id IS NOT NULL) OR
        (access_level = 'shared' AND department_id IS NULL)
    ),
    CONSTRAINT chk_capacity_positive CHECK (capacity >= 0)
);


-- notion api
CREATE TABLE tasks (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notion_page_id    VARCHAR(100) UNIQUE NOT NULL,
    user_id           UUID NOT NULL REFERENCES users(user_id),
    cached_title      VARCHAR(255),
    cached_status     VARCHAR(20),
    last_synced       TIMESTAMP DEFAULT NOW(),
    created_at        TIMESTAMP DEFAULT NOW()
);


CREATE TABLE scheduled_events (
    meet_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id          UUID NOT NULL REFERENCES spaces(space_id) ON DELETE CASCADE,
    meet_title        VARCHAR(255) NOT NULL,
    meet_desc         VARCHAR(255) NOT NULL,
    meet_start_time   TIMESTAMP NOT NULL,
    meet_end_time     TIMESTAMP NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_meet_title_not_empty CHECK (meet_title <> ''),
    CONSTRAINT chk_meet_desc_not_empty CHECK (meet_desc <> ''),
    CONSTRAINT chk_event_time CHECK (meet_end_time > meet_start_time)
);


CREATE TABLE event_organisers (
    organiser_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meet_id           UUID NOT NULL REFERENCES scheduled_events(meet_id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(user_id),
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE event_participants (
    participant_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meet_id           UUID NOT NULL REFERENCES scheduled_events(meet_id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(user_id),
    attendance_status VARCHAR(10) NOT NULL DEFAULT 'present',
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_attendance_status CHECK (attendance_status IN ('absent', 'present'))
); 

CREATE TABLE user_logs
CREATE TABLE chat
CREATE TABLE faqs -- rag; pgvector
CREATE TABLE documents -- rag; pgvector

*/