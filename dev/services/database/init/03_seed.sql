-- ============================================================
-- WORKFROM SEED DATA - Postgres
-- NOTE: Passwords are plain text here — hash them before production
-- ============================================================

-- Roles
INSERT INTO ROLE (role_id, role_name, created_at) VALUES
(1,  'HR',           '2026-03-29 02:18:14'),
(3,  'IT',           '2026-03-29 02:18:31'),
(5,  'CEO',          '2026-03-29 02:47:06'),
(6,  'Account',      '2026-03-29 02:47:14'),
(7,  'Finance',      '2026-04-05 07:19:44'),
(8,  'Frontend Dep', '2026-04-05 07:33:43');

-- Keep serial sequence in sync after manual ID inserts
SELECT setval('role_role_id_seq', (SELECT MAX(role_id) FROM ROLE));

-- Department (dp_lead is NULL first — USER doesn't exist yet)
INSERT INTO DEPARTMENT (dp_id, dp_name, dp_lead, created_at) VALUES
(2, 'IT', NULL, '2026-03-29 02:45:58');

SELECT setval('department_dp_id_seq', (SELECT MAX(dp_id) FROM DEPARTMENT));

-- Users
INSERT INTO "USER" (user_id, user_email, user_password, user_name, user_status, role_id, dp_id, created_at) VALUES
(4, 'natalieho061@gmail.com', '123',  'Nat', 'inactive', 1, 2, '2026-03-29 02:53:42'),
(6, 'natalieho@gmail.com',    '2345', 'Nat', 'inactive', 7, 2, '2026-04-05 07:22:20');

SELECT setval('"USER"_user_id_seq', (SELECT MAX(user_id) FROM "USER"));

-- Now update dp_lead on DEPARTMENT now that USER exists
UPDATE DEPARTMENT SET dp_lead = 4 WHERE dp_id = 2;

-- Task
INSERT INTO TASK (task_id, task_title, task_desc, task_overall_status, assigned_date, due_date, completed_date, created_at) VALUES
(1, 'r', 'f', 'pending', '2026-03-29 03:06:56', '2026-03-29 02:53:42', '2026-04-29 02:53:42', '2026-03-29 03:06:56');

SELECT setval('task_task_id_seq', (SELECT MAX(task_id) FROM TASK));

-- Created Task
INSERT INTO CREATED_TASK (created_id, user_id, task_id, created_at) VALUES
(1, 4, 1, '2026-03-29 03:07:08');

SELECT setval('created_task_created_id_seq', (SELECT MAX(created_id) FROM CREATED_TASK));

-- Meeting
INSERT INTO MEETING (meet_id, meet_title, meet_desc, meet_start_time, meet_end_time, created_at) VALUES
(1, 'f', 'y', '2026-03-29 02:18:14', '2026-03-29 04:18:14', '2026-03-29 03:22:56');

SELECT setval('meeting_meet_id_seq', (SELECT MAX(meet_id) FROM MEETING));

-- Meeting Organiser
INSERT INTO MEETING_ORGANISER (organiser_id, meet_id, user_id, created_at) VALUES
(1, 1, 4, '2026-03-29 03:28:34');

SELECT setval('meeting_organiser_organiser_id_seq', (SELECT MAX(organiser_id) FROM MEETING_ORGANISER));

-- Meeting Participant
INSERT INTO MEETING_PARTICIPANT (participant_id, meet_id, user_id, attendance_status, created_at) VALUES
(1, 1, 4, 'present', '2026-03-29 03:26:24');

SELECT setval('meeting_participant_participant_id_seq', (SELECT MAX(participant_id) FROM MEETING_PARTICIPANT));