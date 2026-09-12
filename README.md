<p align="center"> <img src="assets/workfrom.png" alt="WorkFrom" width="400"> </p>
<p align="center"><em>This project has been created as part of the 42 curriculum by rraja-az, hsim, yphang, hni-xuan</em></p>
<hr style="height:4px;border:none;color:#333;background-color:#333;">
<p >

## Description 

### WorkFrom, The Virtual Workspace App.

WorkFrom is a full-stack virtual workspace that brings remote teams together in one shared digital space. <br>
Instead of relying on separate tools for communication, collaboration, and meetings, WorkFrom combines a 3D virtual office with real-time messaging, task and meeting management, user management, activity feeds, and AI-powered meeting insights — **streamlining workflows and keeping everything in one centralized workspace.**



### Key Features
- 🏢 **Virtual 3D Office** — Interactive 3D workspace with real-time user presence and proximity-based voice communication.
- 🎥 **Meetings** — Schedule and conduct video meetings with participant tracking, in-meeting chat, and attendance management.
- 🎙️ **Meeting Recording & AI Summarisatio**n — Record meetings, generate transcripts using Faster-Whisper, and produce structured summaries using Google Gemini.
- 💬 **Real-time Messaging** — Direct and group messaging with attachments and real-time message delivery.
- ✅ **Task Management** — Assign tasks to users, set priorities and due dates, and track task progress.
- 👤 **User Dashboard** — Status update, personal calendar with task and meeting overview and stats, and team presence.
- 📊 **Admin Dashboard** — Presence and attendance metrics, office and space occupancy, recent activities
- 👥 **User Management** — Manage user profiles, roles, departments, and account status with role-based administrative controls.
- 🔐 **Authentication & Role-Based Access** — Secure authentication with JWT and Google OAuth 2.0, with different permissions for administrators and users.

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

- [express rate limiter](https://express-rate-limit.mintlify.app/reference/configuration#standardheaders)
- [nginx limit request directive](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html#limit_req)

## Team Information
| Team Member | Role                                | Module Tech Lead                        |
| ------------ | ------------------------------------ | ---------------------------------------- |
| [Lyara](https://github.com/rplra) | Product Manager, Designer, Developer | UI/UX, Authentication, User Management, Database |
| [Hoi Ling](https://github.com/holickka) | Product Owner, Developer | 3D Virtual Office, LiveKit, Socket.IO, Docker, Frontend UI |
| [Yee Joo](https://github.com/Joophang) | Technical Lead, Developer | Task, Messaging/Chat, Validation |
| [Natalie](https://github.com/hni-natalie) | Technical Lead, Developer | Meetings, Recording, AI Summary |

*Roles overlap by design — each member leads architecture decisions within their own feature module.*

## Project Management 
- *Task Organisation*: Notion was used to assign tasks and track development progress.
- *Communication*: Discord was used for updates, meetings, discussions, bug reporting, and information sharing.
- *Version Control*: Git and GitHub were used with separate feature branches, merging completed changes into `main` to maintain a stable codebase.
- *Product Design*: [Figjam](https://www.figma.com/board/E7snUuu3txVRbXlixAVGgB/WorkFrom-?node-id=0-1&p=f) was used for site map, user flows and [Figma](https://www.figma.com/design/DfoxSKX9mltDSvKB5sTAWz/UI---WorkFrom-?node-id=64452-100&p=f) for rapid high-fidelity design iteration.

## Technical Stack

| Layer  | Tech | Justification |
| --- | --- | --- |
| Frontend | React 19, Vite, TypeScript, TailwindCSS 4, react-router-dom 7, TanStack Query 5  | React provides reusable components and has strong industry adoption, providing relevant industry experience. Vite enables fast development, TypeScript improves type safety, Tailwind enables custom UI, and TanStack Query manages API state. |
| 3D | Three.js, @react-three/fiber, @react-three/drei, @react-three/cannon | Provides 3D rendering, React integration, reusable helpers, and physics. Chosen over Babylon.js for better React ecosystem integration. |
| Backend | Node.js, Express | Lightweight and efficient for APIs and real-time services. Preferred over heavier frameworks such as NestJS to reduce complexity. | 
| Authentication | JWT (jsonwebtoken), bcrypt | JWT provides stateless authentication, while bcrypt securely hashes passwords. |
| File Upload | Multer | Simple and reliable file upload handling for Express. |
| Database | Supabase / PostgreSQL | PostgreSQL provides relational data management and strong consistency. Supabase reduces database management overhead. Preferred over MongoDB due to the relational nature of the data. |
| Real-time Communication | LiveKit, Socket.IO | LiveKit simplifies WebRTC video/audio, while Socket.IO handles real-time events. Preferred over building WebRTC/WebSocket functionality from scratch. |
| Speech-to-Text | Faster-Whisper (Whisper model, Python) | Provides efficient local transcription and avoids recurring cloud API costs. |
| Meeting Recording | LiveKit Egress | LiveKit Egress provides built-in meeting recording with minimal implementation effort. Its limited free usage is sufficient for the project's development and demonstration requirements. | 
| Reverse Proxy | Nginx | Provides request routing, TLS termination, and a single entry point for services. | 
| Containerization | Docker, Docker Compose | Ensures consistent environments and simplifies multi-service deployment. Preferred over Kubernetes due to lower project complexity. | 
| Integrations | LiveKit Server SDK, Google Gemini SDK, Supabase, Nodemailer | Official SDKs simplify integration with meeting, AI, database, and email services. |
| Scheduling | node-cron | Checks recording processing status every minute because transcription and AI summarisation require asynchronous processing time. It periodically updates the backend without requiring users to wait for completion. | 

---

## Database Schema 
The application uses PostgreSQL with Prisma ORM.<br>
The database schema consists of entities supporting users, meetings, tasks, messaging, spaces, recordings, and activity tracking.

[Database Documentation](dev/data/backend/docs/DB_DOC.md)


## Features List

| Features | Description | Team |
| --- | --- | --- |
| **Authentication & Role-Based Access** | Secure authentication with JWT and Google OAuth 2.0, with role-based permissions for administrators and users | Lyara |
| **User Dashboard** | Personal status, meeting countdown, calendar, task and meeting overview, and team presence | Lyara |
| **Virtual 3D Office** | Three.js/react-three-fiber office scene with avatar movement (raycasting move-to-click), multiple rooms/spaces, and live occupancy | Hoi Ling |
| **Real-time Presence & Audio** | Socket.io for live user status/position sync; LiveKit + Three.js PositionalAudio for proximity voice chat in the office | Hoi Ling |
| **Meetings** | Schedule/start/end meetings, video conferencing (LiveKit), in-meeting chat, and attendance management | Natalie |
| **Meeting Recording & AI Summary** | Record meetings, store via Supabase, transcribe with a self-hosted Whisper service, then generate structured summaries (discussion points, decisions, action items, deadlines) via Google Gemini | Natalie |
| **Task Management** | Create/assign/track tasks, due-today/this-week/this-month views, urgency sorting, validation on both FE and BE | Yee Joo |
| **Messaging/Chat** | Direct & group conversations, audio/video calling, group meeting scheduling, message attachments (upload/download/validation), read receipts, real-time message live delivery | Yee Joo, Hoi Ling, Lyara |
| **User Settings** | Allow users to view and update their profile information and account settings | Lyara |
| **Admin Dashboard** | Organisation-wide metrics including presence, attendance, departments, space occupancy, and recent activities | Lyara |
| **User Management** | Manage user profiles, roles, departments, and account status with administrative controls | Lyara |
| **Activity Logs** | Real-time activity feed covering user presence, spaces, tasks, and meetings, with filtering and export | Lyara |
| **GDPR & Data Management** | Allows users to request, export, and delete their personal data, with confirmation steps and soft account deletion | Lyara |
| **Notification System** | Provides consistent success and error feedback for actions such as creating, updating, and deleting users, tasks, meetings, and messages. Includes audio/video call indicators within conversations | All |
| **Public Pages** | Public pages including Landing, Login, Terms, and Privacy | Lyara |



## Modules 
*Each major module is worth 2 points. Each minor module is worth 2 points.*

### General Modules 
| Module | Modules | Team | Justification | Implementation |
| --- | --- | --- | --- | --- |
| Major | *Framework for Frontend and Backend - React, Vite, Node.js, Express* | All | Provides a consistent and scalable foundation for developing the client-side interface and server-side API. | React and Vite are used for the frontend application, while Node.js and Express are used to implement the backend REST API. |
| Major | *Real-time Features - Socket.IO, LiveKit* | All | Real-time communication is required across the virtual 3D office, meetings, messaging, and dashboard. | *Socket.IO*: Real-time updates for task changes, meeting scheduling, messages, dashboard data, and virtual 3D office. *LiveKit*: Real-time voice and video communication for the virtual office and meetings. |
| Major | *Public API* | All | Provides a structured interface for the frontend and external clients to interact with the application's backend and database through RESTful HTTP endpoints. | Implemented using Node.js and Express, with RESTful endpoints exposed under `/api`. The API provides endpoints for users, authentication, roles, departments, spaces, tasks, meetings, recordings, messages, and activities. `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` methods are used for CRUD operations. |
| Major | *Advanced Permissions* | Lyara | Provides role-based access control with different permissions and views for administrators and regular users. | Implemented role-based access control with admin and user roles. Admins can view organisation-wide activity logs and manage users, while regular users can access features such as creating tasks, scheduling meetings, and using chat. Protected routes enforce access based on the user's assigned role. |
| Minor | *ORM* | All | Prisma ORM is used to interact with the PostgreSQL database, providing a type-safe and efficient way to manage data models and queries. | Prisma is integrated into the backend, allowing for easy database schema management and query execution. |
| Minor | *Progressive Web App (PWA)* | Natalie | Enables an installable application with offline support. | Integrated `vite-plugin-pwa` into the Vite configuration and enabled automatic service-worker updates using `registerType: 'autoUpdate'`.| 
| Minor | *Custom Design System* | All | Provides a consistent and reusable UI foundation across the application through shared components, icons, typography, and visual styling. | Implemented a shared frontend component library under dev/data/frontend/src/shared/, providing reusable UI components, icons, and consistent styling across the application. | 
| Minor | *Browser Compatibility* | Hoi Ling, Lyara | Ensures the application works across major browsers, including Chrome, Edge, and Firefox. | Built using standard React, TypeScript, HTML, and CSS features, then tested across Chrome, Edge, and Firefox to verify consistent functionality and appearance. |


--- 

### Feature Modules - 10 points 
*Each module is worth 1 point.*
| Module| Modules | Team | Justification | Implementation |
| --- | --- | --- | --- | --- |
| Major | *Standard User Management* | Lyara | Provides secure authentication and allows users to manage their personal profiles and account information. | Implemented user authentication with JWT. Users can update their profile information, upload avatars with a default avatar fallback, and view their profile information. Socket.IO provides real-time online presence. |
| Major | *User Interaction (Chat, Profile)* | Yee Joo, Hoi Ling, Lyara | Provides communication and user identity features that allow users to interact and collaborate within the platform. | Chat: Socket.IO provides real-time message delivery, while conversation and message data are persisted in PostgreSQL using Prisma. Profile: User profiles are stored and managed through the backend, supporting personal information. |
| Major | *Advanced 3D feature* | Hoi Ling | Provides an immersive 3D virtual office environment with real-time collaboration and communication features. | Implemented a 3D office scene using Three.js and React Three Fiber, allowing users to navigate the space, interact with objects, and communicate with others in real-time. Socket.IO synchronizes user presence and positions, while LiveKit provides proximity-based voice communication. |
| Major | *Advanced Analytic Dashboard* | Lyara | Provides organisation-wide insights into user activity, attendance, and space utilisation through interactive data visualisations and activity analytics. | Implemented an admin analytics dashboard with graphs for user attendance and space usage, as well as activity logs covering user activity, meetings, tasks, and user entry and exit events. Administrators can filter activity logs by time range and export the filtered activity data for further analysis. |
| Minor | *Real-time Collaboration* | Hoi Ling, Natalie | Enables users to collaborate and communicate within shared virtual spaces and meetings through real-time synchronization and communication. | *Virtual 3D Office*: Socket.IO synchronizes user presence and positions, allowing multiple users to share the same virtual workspace, while LiveKit and positional audio enable proximity-based voice communication. *Meetings*: LiveKit provides real-time audio and video communication for multi-user meetings, with Socket.IO supporting real-time meeting, chat and recording updates. | 
| Minor | *Remote Authentication - Google OAuth2.0* | Lyara | Allows users to securely authenticate using their Google account | Integrated Google OAuth 2.0 with the backend authentication system to authenticate users through Google and issue a JWT session for accessing protected application features. |
| Minor | *User Analytics Dashboard* | Lyara | Provides insights into user activity and engagement within the application. | Implemented an admin dashboard that displays organisation-wide metrics and recent activities, including user activity, meeting activity, task creation, and user entry and exit events. Data is aggregated from the PostgreSQL database and presented in a user-friendly interface. |
| Minor | *Voice & Speech Integration* | Natalie | Enables speech-based functionality through meeting audio recording and transcription. | Integrated LiveKit meeting recordings with a self-hosted Faster-Whisper service to convert recorded speech into text for meeting transcripts and subsequent AI summarisation. |
| Minor | *GDPR Compliance* | Lyara | Provides users with control over their personal data through data access, export, and deletion features. | Implemented data export and account deletion requests with confirmation steps, readable data reports, and confirmation emails for data operations. |
| Minor | *Notification System* | All | Provides consistent user feedback for creation, update, and deletion actions across the application. | Implemented a reusable toast notification system for creation, update, and deletion actions across users, tasks, meetings, and messages, with consistent success and error feedback. |


---- 

### Custom Major Modules - 2 points


| No | Modules | Team | Why Chosen | Key Challenges | How it adds value | Why deserve 2 points | 
| --- | --- | --- | --- | --- | --- | --- |
| 1. | *Advanced Meeting System* | Natalie | Meetings are a core part of WorkFrom's virtual workspace. | Integrates LiveKit video/audio, Egress recording, Socket.IO chat, attendance tracking, Faster-Whisper transcription, and Gemini summarisation. | Enables real-time collaboration while preserving and transforming meetings into useful transcripts and summaries. | Combines multiple complex real-time, media-processing, speech-to-text, and AI components into an end-to-end meeting workflow, making it substantially more complex than a basic CRUD feature. | 

--- 

### Custom Minor Modules - 1 points
*Each module is worth 1 points.*

| No | Modules | Team | Why Chosen | Key Challenges | How it adds value | Why deserve 1 points | 
| --- | --- | --- | --- | --- | --- | --- |
| 1. | *Task Management* | Yee Joo | Provides a structured way for users to assign and manage work within the virtual workspace. | Supports task assignment, priority levels, due dates, status tracking, and validation across the frontend and backend. | Helps teams organise responsibilities, monitor progress, and keep track of deadlines. | It provides straightforward task management capabilities designed for ease of use. | 

#### Total Points: 29 points

---- 

### Project Structure 
```
dev
├── data/
|   ├── frontend/
|   └──  backend/
├── docker-compose.yml
├── secrets/
├── secrets.example/
└── services/
    ├── backend/
    ├── frontend/
    ├── nginx/
    └── whisper/
```
- `data/` — Contains the main application source code for the frontend and backend.
- `services/` — Contains the Docker-related files and configurations used to build and run each service as a container.
- `docker-compose.yml` — Defines and orchestrates the containers and their configurations.
- `secrets/` — Stores environment-specific secrets and sensitive configuration.
- `secrets.example` — Provides an example/template of the required secrets configuration.

----

## Documentation

- [API Documentation](dev/data/backend/docs/API_DOC.md)
- [Frontend Documentation](dev/data/frontend/FE_DOC.md)
- [Database Documentation](dev/data/backend/docs/DB_DOC.md)

----

### Known Limitations
- **Meeting Recording** — Meeting recordings are limited to a maximum of 20 minutes due to the storage and bandwidth constraints of the Supabase free tier used for the project.

- **Mailer** — Email functionality is currently configured using a personal Gmail account via SMTP because the project does not have a dedicated domain or production email service. As a result, emails are sent from the configured Gmail account rather than from a dedicated @workfrom.com address. This setup is intended for development and demonstration purposes and may not be suitable for production use due to account, sending-volume, and deliverability limitations.

- **Support Email** — support@workfrom.com is a placeholder email address intended for demonstration purposes only. Since the project does not currently have an active workfrom.com domain or dedicated support mailbox, emails sent to this address will not be delivered to an actual support inbox.

--- 

## Individual Contributors
| Team Member | Contributions |
|-------------|---------------|
| [Lyara](https://github.com/rplra) | Product Design, Prisma Schema, Authentication (JWT,  Google OAuth2), User (Dashboard, Settings, Messages UI), Admin (Dashboard, User Mgmt, Activity Feed), GDPR, Public pages, Shared UI Components, Documentations |
| [Hoi Ling](https://github.com/holickka) | 3D Office Scene (Three.js/React Three Fiber), LiveKit Audio/Video integration, Socket.IO real-time layer (frontend/backend), Shared UI components, Meetings UI, Audio/Video Call feature, Docker/Build tooling, Prisma Schema, Documentations |
| [Yee Joo](https://github.com/Joophang) | Messaging feature (frontend/backend), Attachment upload and validation, Socket.IO message handling, Task feature (frontend/backend), Prisma Schema |
| [Natalie](https://github.com/hni-natalie) | Meetings feature (frontend/backend - Scheduling, Chat modal, Recording), LiveKit integration with Faster-Whisper, Recording transcription, AI summarisation, Shared UI Components, Prisma schema, PWA, README documentation |

## Asset Credits

- **[Flaticon](https://www.flaticon.com/)** - Magnific
- **[mont gomery](https://www.figma.com/@designproduct?fuid=1180451303293992827)** - [Stratis UI Icons](https://www.figma.com/community/file/1177180791780461401/stratis-ui-icons-1000-free-figma-icons?q_id=4bb3bea7-7efd-40ec-82e3-9fb5fb21e6b7&fuid=1180451303293992827)
- **[Adobe Firefly](https://firefly.adobe.com/)** - AI-generated visual asset (WorkFrom Landing Page Illustration)

## References 
- [Real-time communication with Socket.io](https://videosdk.live/developer-hub/socketio/expressjs-socketio)
- [Comparison of database](https://medium.com/@peymaan.abedinpour/mariadb-vs-mysql-vs-postgresql-vs-sqlite-a-comprehensive-comparison-for-web-applications-0523cc3bc9d8)
- [nginx websocket proxying](https://nginx.org/en/docs/http/websocket.html?_x_tr_sch=http)
- [Real-time audio streaming with livekit](https://github.com/livekit/livekit)
- [Fixing positionalAudio with webRTC](https://discourse.threejs.org/t/positionalaudio-setmediastreamsource-with-webrtc-question-not-hearing-any-sound/14301/40)
- [ThreeJS Positional Audio Documentation](https://threejs.org/docs/#PositionalAudio)
- [Raycasting move to mouse click](https://github.com/WaelYasmina/spaceship/blob/main/src/js/scripts.js)
- [d3 for tree layout](https://d3js.org/d3-hierarchy/tree)