## API 

To test with Postman, follow these steps:
1. **LOGIN** : workfrom > auth > admin / user login
2. **GET TOKEN** : copy the access token from the response  
![alt text](image.png)
3. **SET TOKEN** : set the access token as a header in Postman
    - Key: Authorization
    - Value: Bearer <access_token>
![alt text](image-1.png)
4. **TEST ENDPOINTS** : feel free to test any endpoints you want

If you wish to GET specific role / user / department / etc,
1. Run GET all users / roles / departments
2. Copy the id from the response
3. append to the url and run the GET request
![alt text](image-2.png)

<br>

---

## Endpoints Overview

All routes are prefixed with `/api`.  
Most endpoints require a JWT token in the Authorization header:
```http
Authorization: Bearer <your-token>
```

---

### 1. System & Health (`/api`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/` | Base API welcome / ping message | Public |
| `GET` | `/api/health` | Health check & database connection status | Public |

---

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `POST` | `/api/auth/login` | Login with email and password | Public |
| `POST` | `/api/auth/google` | Login / authenticate with Google OAuth credential | Public |
| `GET` | `/api/auth/me` | Validate session and get current authenticated user profile | Authenticated |
| `POST` | `/api/auth/logout` | Logout user, clear session and update presence | Authenticated |

---

### 3. Users (`/api/users`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/users/me` | Get current user's profile | Authenticated |
| `PATCH` | `/api/users/me` | Update current user's profile (name, title, timezone, city, etc.) | Authenticated |
| `GET` | `/api/users/dashboard` | Get current user's personal dashboard summary and stats | Authenticated |
| `PATCH` | `/api/users/status` | Update current user's presence status (`offline`, `online`, `focus`, `in_meeting`, `away`) | Authenticated |
| `GET` | `/api/users/status/:status` | Get all users filtered by presence status | Authenticated |
| `GET` | `/api/users/password-rules` | Get password validation rules and constraints | Authenticated |
| `POST` | `/api/users/change-password` | Change password for current authenticated user | Authenticated |
| `POST` | `/api/users/avatar` | Upload and update profile avatar image (multipart form data) | Authenticated |
| `GET` | `/api/users/me/data-export` | Request and download personal data export (GDPR) | Authenticated |
| `POST` | `/api/users/me/deletion-request` | Request account deletion (GDPR compliance) | Authenticated |
| `GET` | `/api/users` | List all active users in workspace | Authenticated |
| `GET` | `/api/users/:id` | Get user details by ID | Authenticated |
| `GET` | `/api/users/dashboard/metrics` | Get workspace admin dashboard metrics & analytics | Admin only |
| `POST` | `/api/users` | Create a new user account | Admin only |
| `PATCH` | `/api/users/:id` | Update user details, assigned role, or department | Admin only |
| `DELETE` | `/api/users/:id` | Soft-delete / remove user account | Admin only |
| `POST` | `/api/users/avatar/:id` | Upload avatar image for a specific user | Admin only |
| `POST` | `/api/users/:userId/reset-password` | Admin reset user password | Admin only |

---

### 4. Roles (`/api/roles`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/roles` | List all roles | Authenticated |
| `GET` | `/api/roles/:roleId` | Get role details by ID | Authenticated |
| `POST` | `/api/roles` | Create a new role | Admin only |

---

### 5. Departments (`/api/departments`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/departments` | List all departments with members and lead info | Authenticated |
| `GET` | `/api/departments/dpName` | List all department names | Authenticated |
| `GET` | `/api/departments/:dpId` | Get department details by ID | Authenticated |
| `POST` | `/api/departments` | Create a new department | Admin only |

---

### 6. Spaces (`/api/spaces`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/spaces` | List all virtual collaboration spaces | Authenticated |
| `GET` | `/api/spaces/spaceName` | List all space names | Authenticated |
| `GET` | `/api/spaces/:spaceId` | Get space details by ID | Authenticated |
| `POST` | `/api/spaces` | Create a new space | Admin only |
| `PUT` | `/api/spaces` | Update space information | Admin only |
| `DELETE` | `/api/spaces/:spaceId` | Delete a space | Admin only |

---

### 7. Tasks (`/api/tasks`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/tasks` | List tasks in workspace (supports filtering) | Authenticated |
| `GET` | `/api/tasks/:id` | Get task details by ID | Authenticated |
| `POST` | `/api/tasks` | Create a new task and assign users | Authenticated |
| `PUT` | `/api/tasks/:id` | Update task details, status, priority, or assignees | Authenticated |
| `DELETE` | `/api/tasks/:id` | Soft-delete a task | Authenticated |

---

### 8. Meetings (`/api/meetings`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/meetings` | List all scheduled/active meetings | Authenticated |
| `GET` | `/api/meetings/user/:userId` | Get meetings organized by/associated with a user | Authenticated |
| `GET` | `/api/meetings/participant/:userId` | Get meetings where user is an invited participant | Authenticated |
| `GET` | `/api/meetings/pin` | Get all pinned meetings for current user | Authenticated |
| `GET` | `/api/meetings/:meetingId` | Get meeting details by ID | Authenticated |
| `POST` | `/api/meetings` | Create a new meeting | Authenticated |
| `PATCH` | `/api/meetings` | Update meeting details | Authenticated |
| `PATCH` | `/api/meetings/participants` | Sync meeting participants and update attendance status | Authenticated |
| `PATCH` | `/api/meetings/pin/:meetId` | Toggle pinned state for a meeting | Authenticated |
| `DELETE` | `/api/meetings/:meetId` | Delete a meeting | Authenticated |
| `PATCH` | `/api/meetings/:meetId/start` | Start meeting (marks status as `started`) | Authenticated |
| `PATCH` | `/api/meetings/:meetId/end` | End active meeting | Authenticated |
| `GET` | `/api/meetings/:meetId/chat` | Get in-meeting chat message history | Authenticated |
| `POST` | `/api/meetings/:meetId/chat` | Send a real-time message in meeting chat | Authenticated |

---

### 9. Chat & Direct Messaging (`/api/messages`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/messages` | List all active conversations (direct and group) | Authenticated |
| `POST` | `/api/messages/direct` | Start or get existing 1:1 direct conversation | Authenticated |
| `POST` | `/api/messages/group` | Create a new group chat conversation | Authenticated |
| `POST` | `/api/messages/:id/avatar` | Upload avatar for a group conversation (multipart, `avatar`) | Authenticated |
| `DELETE` | `/api/messages/:id` | Soft-delete a conversation | Authenticated |
| `GET` | `/api/messages/:id/messages` | Get paginated message history for a conversation | Authenticated |
| `POST` | `/api/messages/:id/messages` | Send message (text, callNote, linkUrl) in conversation | Authenticated |
| `POST` | `/api/messages/:id/participants` | Add participant to group conversation | Authenticated |
| `DELETE` | `/api/messages/:id/participants/:userId` | Remove participant from group conversation | Authenticated |
| `POST` | `/api/messages/:id/pin` | Pin conversation | Authenticated |
| `DELETE` | `/api/messages/:id/pin` | Unpin conversation | Authenticated |
| `POST` | `/api/messages/:id/attachments` | Upload file attachment to conversation (multipart) | Authenticated |
| `DELETE` | `/api/messages/attachments/:id` | Delete attachment | Authenticated |
| `POST` | `/api/messages/:id/read` | Mark conversation as read (updates `lastReadAt`) | Authenticated |

---

### 10. Recordings & AI Summaries (`/api/recordings`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `POST` | `/api/recordings/start` | Start LiveKit Egress recording for a meeting | Authenticated |
| `PATCH` | `/api/recordings/stop/:meetId` | Stop active LiveKit Egress recording | Authenticated |
| `POST` | `/api/recordings/finalize` | Trigger processing/finalization of recordings and AI summaries | Authenticated |
| `GET` | `/api/recordings/:meetId` | Get recordings and AI summaries for a meeting | Authenticated |
| `GET` | `/api/recordings/status/:meetId` | Get live recording status for a meeting | Authenticated |

---

### 11. Activity & Audit Logs (`/api/activity`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/activity` | List workspace audit logs (with filters & pagination) | Admin only |
| `GET` | `/api/activity/recent` | Get recent workspace activity feed | Admin only |
| `GET` | `/api/activity/export` | Export activity logs (CSV / JSON format) | Admin only |

---

### 12. LiveKit RTC Services (`/api/lk`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/lk/token?roomName=...&participantName=...` | Generate LiveKit JWT room connection token | Authenticated / Public |
| `POST` | `/api/lk/mute-user` | Server-side mute participant track in LiveKit room | Authenticated |
| `POST` | `/api/lk/create-room` | Create a room on LiveKit server with custom settings | Authenticated |

---

### 13. Multiplayer Presence (`/api/player`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/api/player` | Debug endpoint to retrieve active socket player count and locations | Authenticated / Public |