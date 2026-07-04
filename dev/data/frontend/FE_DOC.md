## 1. Architecture Overview

### High-Level Frontend Architecture
The application runs as a modern single-page application (SPA) powered by **Vite**, **React**, and **TypeScript**. 

```
               [ User Browser ]
                      │
            ┌─────────▼─────────┐
            │   App (Routes)    │ (Routing & Global Contexts)
            └─────────┬─────────┘
                      │
            ┌─────────▼─────────┐
            │   Layouts & Pages │ (AdminDashboard, UserDashboard, etc.)
            └─────────┬─────────┘
                      │
            ┌─────────▼─────────┐
            │  Feature Modules  │ (users, auth, admin, livekit, office)
            └─────────┬─────────┘
                      │
            ┌─────────┴─────────┐
            │ Shared Components │ (Button, Modal, Input fields, etc.)
            └───────────────────┘
```

### Folder Structure
All frontend source code resides inside `src/`. We follow a **feature-driven folder structure** coupled with a shared core layer:

```
src/
├── api/                  # Axios HTTP client setup & endpoint configuration
│   ├── api.client.ts     # Configured Axios instance with request/response interceptors
│   └── api.config.ts     # Base URLs, timeouts, and API routes mapping
│
├── config/               # Global routing & menu navigation manifests
│
├── context/              # Global React Contexts (Socket, Toast, Auth)
│
├── features/             # Feature-based modular directories
│   ├── auth/             # Session management (login, protected routes, hooks)
│   ├── admin/            # Admin workflows (forms, logs, user table)
│   ├── office/           # The virtual office interactive canvas
│   ├── livekit/          # Voice/Video rooms using WebRTC
│   ├── meetings/         # Meeting scheduling and management
│   ├── tasks/            # Task creation and tracking
│   └── users/            # User settings, profiles, and dashboard metrics
│
├── pages/                # High-level entry components matching route paths
│
├── shared/               # Reusable utilities used across multiple features
│   ├── assets/           # Icons and images
│   ├── hooks/            # Shared custom hooks (useUserLocation, useAvatarUpload)
│   ├── types/            # App-wide TypeScript definitions
│   └── ui/               # Modular primitive UI components
│
├── App.tsx               # Main entry root component (Providers + Routes)
├── index.css             # Main styling entry (Tailwind CSS v4 config)
└── main.tsx              # React DOM mounting
```

---

## 2. Design System

### Colors (`index.css`, Tailwind v4 `@theme` tokens)

| Token | Value | Usage |
|---|---|---|
| `bg-background` / `-1` / `-2` | `#111111` / `#1A1A1A` / `#242424` | Base / cards / sidebar |
| `text-foreground` / `-3` | `#FFFFFF` / `#A3A3A3` | Primary / muted text |
| `text-accent-lime` | `#D0F05C` | Primary accent |
| `text-accent-teal` | `#68D1BF` | Status: Focus, Tasks |
| `text-accent-gold` | `#EECA5C` | Status: In Meeting, Meetings |
| `text-accent-purple` | `#B4A0FF` | Status: Away |
| `text-danger` | `#FF5F5F` | Errors, destructive |

Always use `@apply` with these tokens — never arbitrary hex values.

### Buttons

```css
.btn-lime            	/* Primary: Create, Save, Confirm */
.btn-lime-outline    	/* Secondary: Edit, Cancel */
.btn-danger-outline  	/* Destructive: Delete, Remove */
.btn-header             /* Header actions */
```

### Status

```typescript
type UserBackendStatus = 'online' | 'offline' | 'focus' | 'in_meeting' | 'away';
```

Never hardcode status colors/labels — always use:

```tsx
import { getStatusColors, getStatusDisplay } from '@shared';
// or the pre-built badge:
import { UserStatusBadge } from '@features/users';
<UserStatusBadge status="online" />
```

---

## 3. Shared Components (`@shared/ui`)

| Component | Key Props |
|---|---|
| `Modal` | `isOpen`, `onClose`, `children`, `closeOnOutsideClick?` |
| `PageHeader` | `icon`, `title`, `action?` |
| `InputText` | `title`, `value`, `onChange`, `required?`, `error?` |
| `InputDropdown` | `title`, `choices: {id, name}[]`, `value`, `onChange` |
| `PasswordField` | `value`, `onChange`, `title?` |
| `ButtonLoading` | `isLoading`, `text?` |
| `TruncatedText` | `text`, `maxWidth?`, `tooltipPosition?` |
| `LoadingState` / `EmptyState` / `ErrorState` | `message`/`error`, `size?: 'full'\|'medium'\|'small'`, `onRetry?` |
| `UserStatusBadge` | `status`, `showDot?` |
| `FilterLayout` | `searchQuery`, `onSearchChange`, `filterTabs`, `children` |

---

## 4. Shared Hooks (`@shared/hooks`)

| Hook | Returns / Notes |
|---|---|
| `useAuth` | `{ user, isLoading, login, logout, updateUserStatus }` |
| `useSocket` | `{ socket, isConnected }` — from `@/context/SocketContext` |
| `useToast` | `{ showToast }` — `showToast('success' \| 'error', message)` |
| `useAvatarUpload` | `{ isUploading, handleAvatarUpload }` — args: `userId`, `onSuccess` |
| `useUserLocation` | `{ location, city, country, isLoading, error }` — browser geolocation w/ IP fallback |
| `useRolesAndDepartments` | `{ roles, departments, departmentOptions, roleOptions, isLoading }` |

---

## 5. API Patterns

All REST calls go through `apiClient`; endpoints are registered in `api.config.ts`.

```typescript
export const API_CONFIG = {
  baseURL: '/api',
  endpoints: { users: { base: '/users' }, roles: '/roles' }
};
```

```typescript
// features/users/users.services.ts
import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';

export async function fetchAllUsers(): Promise<User[]> {
  return apiClient.get<User[]>(API_CONFIG.endpoints.users.base);
}

export async function createUser(userData: CreateUserDto): Promise<User> {
  return apiClient.post<User>(API_CONFIG.endpoints.users.base, userData);
}
```

> [!WARNING]
> Never call `fetch` directly or read tokens from `localStorage` — always go through `apiClient` and service functions.

---

## 6. Socket.io Patterns

Global, app-wide socket events live in `context/SocketContext.tsx`; one-off/local events can be handled directly in a component.

```tsx
import { useSocket } from '@/context/SocketContext';

const { socket } = useSocket();

useEffect(() => {
  if (!socket) return;
  socket.on('user:status:update', (data) => { /* update state */ });
  return () => socket.off('user:status:update');
}, [socket]);

socket.emit('update-status', { userId, status });
```

**Common events:**

| Event | Direction | Purpose |
|---|---|---|
| `register` | Client → Server | Register connection |
| `update-status` | Client → Server | User changes status |
| `user:status:update` | Server → Client | Broadcast status change |
| `player-move` / `player-moved` | Client ↔ Server | Office canvas movement |

---

## 7. Component Patterns

Three strict categories: **Pages** (routing, thin), **Features** (state + logic + presentation), **Forms** (isolated, local loading state).

```tsx
// Example utilizing InputText, InputDropdown, LoadingState, and useToast
import React, { useState } from 'react';
import { InputText, InputDropdown, LoadingState, ButtonLoading } from '@shared';
import { useToast } from '@/context/ToastContext';
import { createUser } from '@features/users';

export const UserCreationFeature = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);

  const handleCreate = async () => {
    if (!name || !role) {
      showToast('error', 'Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createUser({ name, email: 'user@example.com', roleId: role });
      showToast('success', 'User successfully created!');
      setName('');
      setRole('');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitialData) {
    return <LoadingState size="medium" message="Loading form configuration..." />;
  }

  return (
    <div className="space-y-4 p-4 bg-background-1 rounded-xl">
      <InputText 
        title="Full Name" 
        placeholder="Enter user name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        required 
      />
      
      <InputDropdown 
        title="Role" 
        name="role" 
        choices={options} 
        value={role} 
        onChange={(e) => setRole(e.target.value)} 
        required 
      />

      <button onClick={handleCreate} disabled={isSubmitting} className="btn-lime w-full">
        {isSubmitting ? <ButtonLoading isLoading text="Submitting..." /> : 'Submit'}
      </button>
    </div>
  );
};
```

```tsx
// Form: features/admin/forms/UserForm.tsx
export const UserForm = ({ onSuccess, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', email: '', roleId: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try { await createUser(formData); onSuccess(); onClose(); }
    finally { setIsSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputText title="Email" value={formData.email} onChange={handleChange} required />
      <button type="submit" className="btn-lime" disabled={isSubmitting}>
        {isSubmitting ? <ButtonLoading isLoading text="Creating..." /> : 'Create User'}
      </button>
    </form>
  );
};

// Usage:
<Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)}>
  <UserForm onSuccess={handleSuccess} onClose={() => setShowAddForm(false)} />
</Modal>
```

---

## 8. Quick Reference

```tsx
import { Modal, InputText, InputDropdown, ButtonLoading, LoadingState, EmptyState, ErrorState } from '@shared';
import { useAuth, useToast, useUserLocation, useAvatarUpload, useRolesAndDepartments } from '@shared';
import { getStatusColors, getStatusDisplay } from '@shared/lib/constants/userStatus';
import { useSocket } from '@/context/SocketContext';
import { apiClient } from '@api/api.client';
import { ROUTE_PATH } from '@config/routes.manifest';
```

| Task | Pattern |
|---|---|
| Fetch data | `useState` + `useEffect` |
| Modal | `<Modal isOpen={} onClose={}>` — never a custom overlay div |
| Status | `getStatusColors()` / `getStatusDisplay()` — never hardcoded |
| Button | `btn-lime`, `btn-lime-outline`, `btn-danger-outline`, `btn-header` |
| Toast | `showToast('success' \| 'error', message)` |
| Real-time | `useSocket()` + `socket.on()` / `.emit()` |
| API call | `apiClient` via a service function — never raw `fetch` |

### Checklist

1. Style with `@apply` + theme tokens — no arbitrary hex.
2. Register new endpoints in `api.config.ts`; write service functions per feature.
3. Global socket logic → `SocketContext.tsx`; local one-offs → in-component.

---

*Last updated : July 4th, 2026*