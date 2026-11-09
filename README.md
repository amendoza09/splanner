# 📅 Splanner — Shared Group Calendar

A real-time shared calendar and chore tracker for households. Built with React + Electron on the frontend and FastAPI + PostgreSQL on the backend. No accounts — a group is identified by a short code that anyone in the household can use to join.

---

## Features

- **Shared group calendar** — join or create a group with a 5-character code, no accounts needed
- **Weekly & monthly views** — a time-grid week view (with prev/next week navigation) and a full month overview
- **Events & tasks** — create timed events or all-day tasks, assigned to any group member
- **Chore tracker** — per-member checklist tab with add, complete, and delete support
- **Real-time sync** — all changes broadcast instantly to every connected device via Socket.IO
- **Weather widget** — shows current local temperature in the calendar toolbar (US locations only — backed by the National Weather Service API)
- **Group settings** — regenerate the group's join code or delete the group entirely, both gated behind a confirmation step
- **Mobile friendly** — responsive layout with a slide-in hamburger menu on small screens
- **Marketing site + self-host guide** — a landing page (`/`) and an in-app guide (`/self-host`) for running your own instance
- **Built for a Raspberry Pi + touchscreen** — the Electron app can launch in fullscreen kiosk mode for a wall-mounted display, though any machine that runs Node and Python works
- **Offline-capable desktop app** — packaged as an Electron app for Windows/Mac/Linux

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop app | Electron |
| Frontend | React, Tailwind CSS, React Router |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Supabase) |
| Realtime | Socket.IO |
| HTTP client | Axios |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A PostgreSQL database (Supabase recommended)

---

### Frontend Setup

```bash
# 1. Clone the repo
git clone https://github.com/amendoza09/splanner.git
cd splanner/frontend/splanner

# 2. Install dependencies
npm install

# 3. Create your environment file (see Environment Variables below)
echo "REACT_APP_API_URL=http://localhost:8000" > .env

# 4. Start in development mode
npm start

# 5. Or run as an Electron desktop app
npm run electron-dev
```

#### Build for production

```bash
npm run electron-prod
```

> If you hit a `heap out of memory` error during build, increase Node's memory limit:
> ```bash
> NODE_OPTIONS=--max-old-space-size=4096 npm run electron-prod
> ```

> `REACT_APP_API_URL` is baked into the app at build time, not read at runtime — set it before running `electron-prod` and rebuild if it changes.

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your environment file (see Environment Variables below)
echo "DB_URL=postgresql://user:password@host:port/dbname" > .env

# 5. Create the database tables
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"

# 6. Start the server
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

---

### Environment Variables

Both `backend/.env` and `frontend/splanner/.env` are gitignored — create them yourself as shown above.

#### Frontend — `frontend/splanner/.env`

```
REACT_APP_API_URL=https://your-backend-url.com
```

#### Backend — `backend/.env`

```
DB_URL=postgresql://user:password@host:port/dbname
```

---

## Database Schema

```sql
CREATE TABLE public.groups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE
);

CREATE TABLE public.members (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  color text,
  group_id bigint NOT NULL REFERENCES public.groups(id)
);

CREATE TABLE public.events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  start_time timestamp without time zone,
  end_time timestamp without time zone,
  notes text DEFAULT '',
  is_task boolean DEFAULT false,
  user_id bigint NOT NULL REFERENCES public.members(id)
);

CREATE TABLE public.chores (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  user_id bigint NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  group_id bigint NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE
);
```

---

## API Reference

All routes are prefixed with your backend base URL.

### Groups

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/group` | Create a new group |
| `GET` | `/group/{group_code}` | Get group with all members and events |
| `GET` | `/group/{group_code}/members` | Get all members in a group |
| `POST` | `/group/{group_code}/regenerate-code` | Generate a new code for the group, invalidating the old one |
| `DELETE` | `/group/{group_code}` | Delete a group and all of its members, events, and chores |

### Members

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/group/{group_code}/members` | Add a member to a group |
| `PATCH` | `/group/{group_code}/members/{user_id}` | Update a member's name or color |
| `DELETE` | `/members/{user_id}` | Remove a member and their events |

### Events

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/members/{user_id}/events` | Create an event or task for a member |
| `PATCH` | `/members/{user_id}/events/{event_id}` | Update an event |
| `DELETE` | `/members/{user_id}/events/{event_id}` | Delete an event |

### Chores

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/group/{group_code}/chores` | Get all chores for a group |
| `POST` | `/group/{group_code}/chores` | Add a chore assigned to a member |
| `PATCH` | `/chores/{chore_id}` | Toggle a chore's completed status |
| `DELETE` | `/chores/{chore_id}` | Delete a chore |

#### Example request bodies

**Create event** `POST /members/{user_id}/events`
```json
{
  "title": "Team meeting",
  "start_time": "2025-04-10T09:00:00",
  "end_time": "2025-04-10T10:00:00",
  "is_task": false,
  "notes": "Zoom link in email"
}
```

**Add chore** `POST /group/{group_code}/chores`
```json
{
  "user_id": 3,
  "title": "Take out trash",
  "completed": false
}
```

**Toggle chore** `PATCH /chores/{chore_id}`
```json
{
  "completed": true
}
```

---

## Realtime Events

The backend broadcasts Socket.IO events to every client in a group's room (joined via `join_group` with a valid `group_code`).

| Event | Payload | When |
|---|---|---|
| `refresh` | `{ reason }` | A member, event, or chore was added/updated/deleted — the reason is one of `member-added`, `member-updated`, `member-deleted`, `event-added`, `event-updated`, `event-deleted`, `chore-added`, `chore-toggled`, `chore-deleted` |
| `group_code_changed` | `{}` | The group's code was regenerated. The new code is only returned in the HTTP response to whoever requested it — every other connected client should treat this as a forced logout and prompt for the new code |
| `group_deleted` | `{}` | The group was deleted — connected clients should clear local state and return to the join/create screen |

---

## 1.2.0 Update

### Calendar

- **Multi-day all-day events** — all-day events can have an optional end date. Each day is saved separately, so it can be edited or deleted on its own
- **Today button** — jump back to the current week or month after navigating away
- **Monthly view** — day boxes stay the same size. Each day shows up to three events, with a grey `+n` box for the rest
- **Weekly view** — taller hour rows, light vertical lines between days, a full-height layout, and a 12a label that is no longer cut off

### Chores

- **Chore count badge** — the chores button shows how many chores are not done
- **Faster chores tab** — opening the tab no longer refetches the list, and changes from other devices appear while it is open

### Usability

- **Confirmation popups** — removing a person or deleting an event now asks for confirmation first
- **Loading state** — the Create button shows progress while an event saves and blocks duplicate submissions
- **Mobile navigation** — the hamburger menu is now part of the top toolbar instead of a floating button

### Desktop app

- **No ads** — the desktop app no longer loads the ad script or shows ad rails
- **Automatic recovery** — the app reloads itself if the page crashes
- **Nightly reload** — the app reloads once during the 3 AM hour, device time, to stay healthy when left running

### Fixes

- Event edit forms and the automatic end time now use local time instead of UTC
- Changing an all-day event's date no longer moves it to the previous day
- The panel for a removed person now closes after they are removed
- A saved group now waits and retries when the server is unreachable, instead of dropping to the join screen

---
