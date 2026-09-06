# <Project Name>

<p align="center">
  <img src="./src/workfrom.png" alt="Project Logo" width="200">
</p>

*This project has been created as part of the 42 curriculum by rraja-az, hsim, yphang, hni-xuan*

<hr style="height:4px;border:none;color:#333;background-color:#333;">

## Description 

### WorkFrom — Virtual Workplace Platform

WorkFrom is a full-stack virtual workplace platform designed to support remote teams through a shared digital workspace. It combines a 3D virtual office, real-time communication, meeting management, task management, and AI-powered meeting insights into a single platform.

### Key Features
- 🏢 Virtual 3D Office — Interactive 3D workspace with real-time user presence and proximity-based voice communication.
- 🎥 Meetings — Schedule and conduct video meetings with participant tracking, in-meeting chat, and attendance management.
- 🎙️ Meeting Recording & AI Summarisation — Record meetings, generate transcripts using Faster-Whisper, and produce structured summaries using Google Gemini.
- 💬 Real-time Messaging — Direct and group messaging with attachments and real-time message delivery.
- ✅ Task Management — Assign tasks to users, set priorities and due dates, and track task progress.
- 📊 Admin Analytics Dashboard — Visualise user attendance and space usage, filter activity logs by time range, and export activity data.
- 🔐 Authentication & Role-Based Access — Secure authentication with JWT and Google OAuth 2.0, with different permissions for administrators and users.
- 📱 Progressive Web App — Installable application with service-worker support and offline capabilities.
- 🛡️ Privacy & Data Management — Supports user data requests, data export, and account deletion workflows.

## Instructions 
### Prerequisites
Ensure the following are installed before running the application:

- Node.js (LTS version recommended)
- npm
- Docker and Docker Compose
- Git

#### 1. Clone the Repository
```bash
git clone <repository-url> 
cd Transcend 
```

#### 2. Configure Environment Variables
```bash
make init
```
The initialization script creates the required data directories and prompts you to generate the required configuration files from the provided examples:

- `dev/.env.example` → `dev/.env`
- `dev/secrets.example` → `dev/secrets`
- `dev/data/backend/.env.example` → `dev/data/backend/.env`

Follow the prompts and confirm each configuration file you want to create.

#### 3. Start the Application
```bash
make up
```

To start the services in the background:
```bash
make up-build
```

#### Useful Commands
| Command | Description |
| --- | ----------- |
| make up | Start all services |
| make down | Stop all services |
| make logs | View service logs | 
| make ps | View running containers | 
| make fe | Start the frontend | 
| make be | Start the backend | 
| make fe-re | Rebuild frontend dependencies | 
| make be-re | Rebuild backend dependencies | 
| make build-re | Rebuild all dependencies without cache | 

## Resources 
- [Realtime communication with Socket.io](https://videosdk.live/developer-hub/socketio/expressjs-socketio)
- [Comparison of database](https://medium.com/@peymaan.abedinpour/mariadb-vs-mysql-vs-postgresql-vs-sqlite-a-comprehensive-comparison-for-web-applications-0523cc3bc9d8)
- [nginx websocket proxying](https://nginx.org/en/docs/http/websocket.html?_x_tr_sch=http)
- [Realtime audio streaming with livekit](https://github.com/livekit/livekit)
- [Fixing positionalAudio with webRTC](https://discourse.threejs.org/t/positionalaudio-setmediastreamsource-with-webrtc-question-not-hearing-any-sound/14301/40)
- [ThreeJS Positional Audio Documentation](https://threejs.org/docs/#PositionalAudio)
- [Raycasting move to mouse click](https://github.com/WaelYasmina/spaceship/blob/main/src/js/scripts.js)
- [d3 for tree layout](https://d3js.org/d3-hierarchy/tree)

## Team Information
| Team Member | Role                                | Module Tech Lead                        |
| ------------ | ------------------------------------ | ---------------------------------------- |
| [Lyara](https://github.com/rplra) | Product Manager, Developer, UXUI Designer | Admin/Auth/Users/Database module |
| [Hoi Ling](https://github.com/holickka) | Product Owner, Developer | 3D Office/LiveKit/Socket infra module |
| [Yee Joo](https://github.com/Joophang) | Technical Lead, Developer | Messages/Chat module |
| [Natalie](https://github.com/hni-natalie) | Technical Lead, Developer | Meetings/Recording/AI Summary module |

*Roles overlap by design — each member leads architecture decisions within their own feature module.*

## Project Management 
- *Task Organisation*: Notion was used to assign tasks and track development progress.
- *Communication*: Discord was used for updates, meetings, discussions, bug reporting, and information sharing.
- *Version Control*: Git and GitHub were used with separate feature branches, merging completed changes into `main` to maintain a stable codebase.

## Technical Stack

| Layer      | Tech                                                                                     |
| ---------- | -----------------------------------------------------------------------------------------|
| Frontend | React 19, Vite, TypeScript, TailwindCSS 4, react-router-dom 7, TanStack Query 5   |
| 3D | Three.js, @react-three/fiber, @react-three/drei, @react-three/cannon |
| Backend | Node.js, Express |
| Authentication | JWT (jsonwebtoken), bcrypt |
| File Upload | Multer |
| Database | Supabase / PostgreSQL |
| Real-time Communication | LiveKit, Socket.IO |
| Speech-to-Text | Faster-Whisper (Whisper model, Python) |
| Speech-to-Text | Whisper (self-hosted in Docker) |
| Reverse Proxy | Nginx |
| Containerization | Docker, Docker Compose |
| Integrations | LiveKit Server SDK, Google Gemini SDK, Supabase, Nodemailer |
| Scheduling | node-cron |

## Database Schema 
The application uses PostgreSQL with Prisma ORM. The database schema consists of
entities supporting users, meetings, tasks, messaging, spaces, recordings, and
activity tracking.

![alt text](/src/database.svg)



## Features List

| Features | Description | Team |
| --- | --- | --- |
| **LogIn & Google OAuth2** | JWT-based login/session, role-based access (admin vs user) | Lyara |
| **Virtual 3D Office** | Three.js/react-three-fiber office scene with avatar movement (raycasting move-to-click), multiple rooms/spaces, live occupancy | Hoi Ling |
| **Realtime presence & audio** | Socket.io for live user status/position sync; LiveKit + Three.js PositionalAudio for proximity voice chat in the office | Hoi Ling |
| **Meetings** | Schedule/start/end meetings, video conferencing (LiveKit), in-meeting chat modal, participant tracking (organiser/participant, attendance) | Natalie |
| **Meeting recording & AI summary** | Record meetings, store via Supabase, transcribe with a self-hosted Whisper service, then generate structured summaries (discussion points, decisions, action items, deadlines) via Google Gemini | Natalie |
| **Messaging/Chat** | Direct & group conversations, message attachments (upload/download/validation), read receipts, socket-driven live delivery | Lyara, Yee Joo |
| **Task management** | Create/assign/track tasks, due-today/this-week/this-month views, urgency sorting, validation on both FE and BE | Yee Joo |
| **User dashboard** | Meeting countdown, task summary widgets, status display | Lyara |
| **Admin dashboard** | Org-wide metrics (users, departments, space occupancy), user management (roles, departments), activity log with export | Lyara |
| **Legal/static pages** | Public pages including legal/terms content | Lyara |
| **Settings & Profile** | Allow users to view and update their profile information and account settings | Lyara |

## Modules 
### Major Modules - 18 points 
*Each module is worth 2 points.*
| No | Modules | Team | Justification | Implementation |
| --- | --- | --- | --- | --- |
| 1. | *Framework for Frontend and Backend - React, Vite, Node.js, Express* | All | Provides a consistent and scalable foundation for developing the client-side interface and server-side API. | React and Vite are used for the frontend application, while Node.js and Express are used to implement the backend REST API. |
| 2. | *Real-time Features - Socket.IO, LiveKit* | All | Real-time communication is required across the virtual 3D office, meetings, messaging, and dashboard. | *Socket.IO*: Real-time updates for task changes, meeting scheduling, messages, dashboard data, and virtual 3D office. *LiveKit*: Real-time voice and video communication for the virtual office and meetings. |
| 3. | *User Interaction (Chat, Profile)* | Lyara, Yee Joo | Provides communication and user identity features that allow users to interact and collaborate within the platform. | Chat: Socket.IO provides real-time message delivery, while conversation and message data are persisted in PostgreSQL using Prisma. Profile: User profiles are stored and managed through the backend, supporting personal information. |
| 4. | Public API | All | Provides a structured interface for the frontend and external clients to interact with the application's backend and database through RESTful HTTP endpoints. | Implemented using Node.js and Express, with RESTful endpoints exposed under `/api`. The API provides endpoints for users, authentication, roles, departments, spaces, tasks, meetings, recordings, messages, and activities. `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` methods are used for CRUD operations. |
| 5. | *Browser Compatibility* | All | Ensures the application works across major browsers, including Chrome, Safari, and Firefox. | Built using standard React, TypeScript, HTML, and CSS features, then tested across Chrome, Safari, and Firefox to verify consistent functionality and appearance. |
| 6. | *Standard User Management* | Lyara | Provides secure authentication and allows users to manage their personal profiles and account information. | Implemented user authentication with JWT. Users can update their profile information, upload avatars with a default avatar fallback, and view their profile information. Socket.IO provides real-time online presence. |
| 7. | *Advanced Permissions* | Lyara | Provides role-based access control with different permissions and views for administrators and regular users. | Implemented role-based access control with admin and user roles. Admins can view organisation-wide activity logs and manage users, while regular users can access features such as creating tasks, scheduling meetings, and using chat. Protected routes enforce access based on the user's assigned role. |
| 8. | *Advanced 3D feature* | Hoi Ling | Provides an immersive 3D virtual office environment with real-time collaboration and communication features. | Implemented a 3D office scene using Three.js and React Three Fiber, allowing users to navigate the space, interact with objects, and communicate with others in real-time. Socket.IO synchronizes user presence and positions, while LiveKit provides proximity-based voice communication. |
| 9. | *Advanced Analytic Dashboard* | Lyara | Provides organisation-wide insights into user activity, attendance, and space utilisation through interactive data visualisations and activity analytics. | Implemented an admin analytics dashboard with graphs for user attendance and space usage, as well as activity logs covering user activity, meetings, tasks, and user entry and exit events. Administrators can filter activity logs by time range and export the filtered activity data for further analysis. |

---- 

### Custom Major Modules - 2 points
*Each module is worth 2 points.*

| No | Modules | Team | Why Chosen | Key Challenges | How it adds value | Why deserve 2 points | 
| --- | --- | --- | --- | --- | --- | --- |
| 1. | *Advanced Meeting System* | Natalie | Meetings are a core part of WorkFrom's virtual workplace. | Integrates LiveKit video/audio, Egress recording, Socket.IO chat, attendance tracking, Faster-Whisper transcription, and Gemini summarisation. | Enables real-time collaboration while preserving and transforming meetings into useful transcripts and summaries. | Combines multiple complex real-time, media-processing, speech-to-text, and AI components into an end-to-end meeting workflow, making it substantially more complex than a basic CRUD feature. | 

--- 

### Minor Modules - 9 points 
*Each module is worth 1 point.*
| No | Modules | Team | Justification | Implementation |
| --- | --- | --- | --- | --- |
| 1. | *ORM* | All | Prisma ORM is used to interact with the PostgreSQL database, providing a type-safe and efficient way to manage data models and queries. | Prisma is integrated into the backend, allowing for easy database schema management and query execution. |
| 2. | *Real-time Collaboration* | Hoi Ling, Natalie | Enables users to collaborate and communicate within shared virtual spaces and meetings through real-time synchronization and communication. | *Virtual 3D Office*: Socket.IO synchronizes user presence and positions, allowing multiple users to share the same virtual workspace, while LiveKit and positional audio enable proximity-based voice communication. *Meetings*: LiveKit provides real-time audio and video communication for multi-user meetings, with Socket.IO supporting real-time meeting, chat and recording updates. | 
| 3. | *Progressive Web App (PWA)* | Natalie | Enables an installable application with offline support. | Integrated `vite-plugin-pwa` into the Vite configuration and enabled automatic service-worker updates using `registerType: 'autoUpdate'`.| 
| 4. | *Custom Design System* | All | Provides a consistent and reusable UI foundation across the application through shared components, icons, typography, and visual styling. | Implemented a shared frontend component library under dev/data/frontend/src/shared/, providing reusable UI components, icons, and consistent styling across the application. | 
| 5. | *Browser Compatibility* | Lyara | Ensures the application works across major browsers, including Chrome, Safari, and Firefox. | Built using standard React, TypeScript, HTML, and CSS features, then tested across Chrome, Safari, and Firefox to verify consistent functionality and appearance. |
| 6. | *Remote Authentication - Google OAuth2.0* | Lyara | Allows users to securely authenticate using their Google account | Integrated Google OAuth 2.0 with the backend authentication system to authenticate users through Google and issue a JWT session for accessing protected application features. |
| 7. | *User Analytics Dashboard* | Lyara | Provides insights into user activity and engagement within the application. | Implemented an admin dashboard that displays organisation-wide metrics and recent activities, including user activity, meeting activity, task creation, and user entry and exit events. Data is aggregated from the PostgreSQL database and presented in a user-friendly interface. |
| 8. | *Voice & Speech Integration* | Natalie | Enables speech-based functionality through meeting audio recording and transcription. | Integrated LiveKit meeting recordings with a self-hosted Faster-Whisper service to convert recorded speech into text for meeting transcripts and subsequent AI summarisation. |
| 9. | *GDPR Compliance* | Lyara | Provides users with control over their personal data through data access, export, and deletion features. | Implemented data export and account deletion requests with confirmation steps, readable data reports, and confirmation emails for data operations. |

--- 

### Custom Minor Modules - 1 points
*Each module is worth 1 points.*

| No | Modules | Team | Why Chosen | Key Challenges | How it adds value | Why deserve 1 points | 
| --- | --- | --- | --- | --- | --- | --- |
| 1. | *Task Management* | Yee Joo | Provides a structured way for users to assign and manage work within the virtual workplace. | Supports task assignment, priority levels, due dates, status tracking, and validation across the frontend and backend. | Helps teams organise responsibilities, monitor progress, and keep track of deadlines. | It has multiple useful task-management capabilities without needing the same level of technical complexity as your Advanced Meeting System. | 

#### Total Points: 30 points

---- 

### Project Structure 
```
dev
├── data/
|   ├── frontend/
|   └──  backend/
├── docker-complse.yml
├── secrets/
├── secrets.example/
└── services/
    ├── backend/
    │   └── tools/
    ├── frontend/
    │   └── tools/
    ├── nginx/
    │   ├── conf/
    │   └── tools/
    └── whisper/
```
- `data/` — Contains the main application source code for the frontend and backend.
- `services/` — Contains the Docker-related files and configurations used to build and run each service as a container.
- `docker-compose.yml` — Defines and orchestrates the containers and their configurations.
- `secrets/` — Stores environment-specific secrets and sensitive configuration.
- `secrets.example` — Provides an example/template of the required secrets configuration.

## Individual Contributors
| Team Member | Contributions |
|-------------|---------------|
| [Lyara](https://github.com/rplra) | Prisma schema, admin dashboard, user management, google OAuth2, auth (login/JWT), Messages feature (FE), settings (frontend/backend), public/admin pages, UX/UI designs |
| [Hoi Ling](https://github.com/holickka) | 3D office scene (Three.js/React Three Fiber), LiveKit voice/video integration, Socket.IO real-time layer (frontend/backend), shared UI components, meetings UI, calling and video call features, Docker/build tooling, Prisma schema |
| [Yee Joo](https://github.com/Joophang) | Messaging feature (frontend/backend), message backend, attachment upload and validation, Socket.IO message handling, task feature (frontend/backend), Prisma schema |
| [Natalie](https://github.com/hni-natalie) | Meetings feature (scheduling, chat modal, recording), LiveKit integration with Faster-Whisper, recording transcription, AI summarisation, meetings feature (frontend/backend), Prisma schema, PWA, README documentation |

## Asset credits

### Flaticon

- Magnific