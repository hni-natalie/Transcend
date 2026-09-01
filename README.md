# <Project Name>

*This project has been created as part of the 42 curriculum by rraja-az, hsim, yphang, hni-xuan*

<hr style="height:4px;border:none;color:#333;background-color:#333;">

## Description 
WorkFrom is a virtual office platform designed to help remote teams collaborate and stay productive in a centralized digital workspace. It provides employees and managers with the tools they need to communicate, coordinate tasks, and monitor progress regardless of their physical location.

The platform allows users to schedule and join meetings, assign and manage tasks, track task progress, and view the real-time availability and status of team members. By bringing these essential collaboration features together, WorkFrom helps improve communication, accountability, and team coordination.

WorkFrom is particularly beneficial for companies with hybrid or fully remote workforces, enabling employees to work efficiently while maintaining the visibility and collaboration typically found in a physical office environment.

## Instructions 

### Prerequisties 
Before running this project, ensure the following is installed:
- Docker 

### Execution 


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


## Technical Stack

| Layer      | Tech                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------- |
| Frontend   | React 19, Vite, TypeScript, TailwindCSS 4, react-router-dom 7, TanStack Query 5           |
| 3D / Voice | Three.js, @react-three/fiber, @react-three/drei, @react-three/cannon, LiveKit (client)     |
| Realtime   | Socket.io (client + server)                                                                |
| Backend    | Node.js, Express 5, Prisma 5 (PostgreSQL), JWT auth (jsonwebtoken + bcrypt), Multer         |
| Integrations | LiveKit server SDK, OpenAI SDK, Google Gemini SDK, Supabase, Nodemailer, node-cron        |
| Infra      | Docker Compose, Nginx                                                                       |

## Database Schema 


## Features List

| Features | Description |
| --- | --- |
| **Virtual 3D Office** | Three.js/react-three-fiber office scene with avatar movement (raycasting move-to-click), multiple rooms/spaces, live occupancy |
| **Realtime presence & audio** | Socket.io for live user status/position sync; LiveKit + Three.js PositionalAudio for proximity voice chat in the office |
| **Meetings** | Schedule/start/end meetings, video conferencing (LiveKit), in-meeting chat modal, participant tracking (organiser/participant, attendance) |
| **Meeting recording & AI summary** | Record meetings, store via Supabase, transcribe with a self-hosted Whisper service, then generate structured summaries (discussion points, decisions, action items, deadlines) via Google Gemini |
| **Messaging/Chat** | Direct & group conversations, message attachments (upload/download/validation), read receipts, socket-driven live delivery |
| **Task management** | Create/assign/track tasks, due-today/this-week/this-month views, urgency sorting, validation on both FE and BE |
| **User dashboard** | Meeting countdown, task summary widgets, status display |
| **Admin dashboard** | Org-wide metrics (users, departments, space occupancy), user management (roles, departments), activity log with export |
| **Auth** | JWT-based login/session, role-based access (admin vs user) |
| **Legal/static pages** | Public pages including legal/terms content |

## Modules 

## Additional Information

### Project Structure 

## Contributors
| Team Member | Contributions |
|-------------|---------------|
| [Lyara](https://github.com/rplra) | Prisma schema, admin dashboard, user management, auth (login/JWT), Messages feature (FE), public/admin pages, UX/UI designs |
| [Hoi Ling](https://github.com/holickka) | 3D Office scene (Three.js/react-three-fiber), LiveKit voice/video integration, Socket.io realtime layer (FE+BE), shared UI components, meetings UI, Docker/build tooling |
| [Yee Joo](https://github.com/Joophang) | Messages/chat feature (BE+FE) — message controller/service/routes, attachment upload & validation, socket message handling, task validators |
| [Natalie](https://github.com/hni-natalie) | Meetings feature (scheduling, chat modal, recording), LiveKit integration with OpenAI SDK, meeting backend (service/controller/routes/validator), Prisma schema |

## Asset credits

### Flaticon

- Magnific