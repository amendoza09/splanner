import os
import string
import random
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from database import get_db
from models import Group, User, Event, Chore
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, time
from typing import Optional
from dotenv import load_dotenv
import socketio

load_dotenv()

# ── Socket.IO setup ──────────────────────────────────────────────────────────
# AsyncServer is required for ASGI (FastAPI/uvicorn)
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

_app = FastAPI()

_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wrap the FastAPI app so Socket.IO and HTTP share the same port
app = socketio.ASGIApp(sio, _app)

# ── Socket.IO events ─────────────────────────────────────────────────────────
@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")

# Client joins a room identified by their group code
@sio.event
async def join_group(sid, data):
    group_code = data.get("group_code")
    if group_code:
        await sio.enter_room(sid, group_code)
        print(f"Client {sid} joined room {group_code}")

@sio.event
async def leave_group(sid, data):
    group_code = data.get("group_code")
    if group_code:
        await sio.leave_room(sid, group_code)

# Helper — emit to every client in a group room
async def broadcast(group_code: str, event: str, data: dict):
    await sio.emit(event, data, room=group_code)

# ── Helper functions ──────────────────────────────────────────────────────────
def generate_group_code() -> str:
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(5))

def generate_unique_code(db: Session) -> str:
    while True:
        code = generate_group_code()
        if not db.query(Group).filter(Group.code == code).first():
            return code

def verify_group_code(user_id: int, group_code: str, db: Session) -> User:
    """Fetch the user and confirm group_code is the one for their group, else 403/404."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    group = db.query(Group).filter(Group.id == user.group_id).first()
    if not group or group.code != group_code:
        raise HTTPException(status_code=403, detail="Invalid group code for this user")
    return user

def verify_chore_group_code(chore_id: int, group_code: str, db: Session) -> Chore:
    """Fetch the chore and confirm group_code is the one for its group, else 403/404."""
    chore = db.query(Chore).filter(Chore.id == chore_id).first()
    if not chore:
        raise HTTPException(status_code=404, detail="Chore not found")
    group = db.query(Group).filter(Group.id == chore.group_id).first()
    if not group or group.code != group_code:
        raise HTTPException(status_code=403, detail="Invalid group code for this chore")
    return chore

# ── Routes ────────────────────────────────────────────────────────────────────

@_app.get("/group/{group_code}")
def get_group(group_code: str, db: Session = Depends(get_db)):
    group = (
        db.query(Group)
        .options(joinedload(Group.users).joinedload(User.events))
        .filter(Group.code == group_code)
        .first()
    )
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return {
        "group_id": group.id,
        "group_code": group.code,
        "users": [
            {
                "user_id": user.id,
                "name": user.name,
                "color": user.color,
                "events": [
                    {
                        "event_id": event.id,
                        "title": event.title,
                        "start_time": event.start_time,
                        "end_time": event.end_time,
                        "notes": event.notes,
                        "is_task": event.is_task,
                    }
                    for event in user.events
                ],
            }
            for user in group.users
        ],
    }

@_app.post("/group")
def create_group(db: Session = Depends(get_db)):
    # generate_unique_code only checks-then-acts, so a concurrent request can still
    # grab the same code first; retry on the resulting unique-constraint violation.
    for _ in range(5):
        code = generate_unique_code(db)
        new_group = Group(code=code)
        db.add(new_group)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            continue
        db.refresh(new_group)
        return {"group_id": new_group.id, "group_code": new_group.code}
    raise HTTPException(status_code=500, detail="Could not generate a unique group code")

@_app.post("/group/{group_code}/regenerate-code")
async def regenerate_group_code(group_code: str, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.code == group_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    for _ in range(5):
        new_code = generate_unique_code(db)
        group.code = new_code
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            continue
        db.refresh(group)
        # Broadcast to the old room name — connected clients haven't rejoined
        # under the new code yet, so this is the only room they're still in.
        await broadcast(group_code, "group_code_changed", {"new_code": new_code})
        return {"group_id": group.id, "group_code": new_code}
    raise HTTPException(status_code=500, detail="Could not generate a unique group code")

@_app.delete("/group/{group_code}")
async def delete_group(group_code: str, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.code == group_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    db.delete(group)
    db.commit()

    await broadcast(group_code, "group_deleted", {})

    return "group deleted"

@_app.get("/group/{group_code}/members")
def get_group_members(group_code: str, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.code == group_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    users = db.query(User).filter(User.group_id == group.id).all()
    return {
        "users": [
            {"user_id": u.id, "name": u.name, "color": u.color}
            for u in users
        ]
    }

# ── Events ────────────────────────────────────────────────────────────────────

MAX_EVENT_SPAN_DAYS = 366

class EventCreate(BaseModel):
    title: str = Field(..., max_length=200)
    start_time: datetime | None = None
    end_time: datetime | None = None
    is_task: bool = False
    notes: str | None = Field(None, max_length=2000)

@_app.post("/members/{user_id}/events")
async def add_event(user_id: int, event: EventCreate, group_code: str, db: Session = Depends(get_db)):
    user = verify_group_code(user_id, group_code, db)

    created_events = []
    start = event.start_time
    end = event.end_time
    current_day = start.date()
    last_day = end.date()

    if (last_day - current_day).days > MAX_EVENT_SPAN_DAYS:
        raise HTTPException(
            status_code=400,
            detail=f"Event span cannot exceed {MAX_EVENT_SPAN_DAYS} days",
        )

    while current_day <= last_day:
        day_start = start if current_day == start.date() else datetime.combine(current_day, time.min)
        day_end = end if current_day == end.date() else datetime.combine(current_day, time.max)
        if event.is_task:
            day_start = datetime.combine(current_day, time.min)
            day_end = datetime.combine(current_day, time.max)

        new_event = Event(
            title=event.title,
            start_time=day_start,
            end_time=day_end,
            notes=event.notes,
            user_id=user.id,
            is_task=event.is_task,
        )
        db.add(new_event)
        created_events.append(new_event)
        current_day += timedelta(days=1)

    db.commit()
    for e in created_events:
        db.refresh(e)

    await broadcast(group_code, "refresh", {"reason": "event-added"})

    return [
        {
            "event_id": e.id,
            "title": e.title,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "notes": e.notes,
            "user_id": e.user_id,
            "is_task": e.is_task,
        }
        for e in created_events
    ]

@_app.delete("/members/{user_id}/events/{event_id}")
async def delete_event(user_id: int, event_id: int, group_code: str, db: Session = Depends(get_db)):
    verify_group_code(user_id, group_code, db)
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()

    await broadcast(group_code, "refresh", {"reason": "event-deleted"})

    return "event deleted"

class UpdateEvent(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_task: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=2000)
    user_id: Optional[int] = None

@_app.patch("/members/{user_id}/events/{event_id}")
async def update_event(
    user_id: int, event_id: int, payload: UpdateEvent, group_code: str, db: Session = Depends(get_db)
):
    user = verify_group_code(user_id, group_code, db)
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = payload.dict(exclude_unset=True)
    new_user_id = update_data.get("user_id")
    if new_user_id is not None:
        new_user = db.query(User).filter(User.id == new_user_id).first()
        if not new_user or new_user.group_id != user.group_id:
            raise HTTPException(status_code=400, detail="Target user must belong to the same group")

    for key, value in update_data.items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)

    await broadcast(group_code, "refresh", {"reason": "event-updated"})

    return {
        "user_id": event.user_id,
        "event_id": event.id,
        "title": event.title,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "notes": event.notes,
        "is_task": event.is_task,
    }

# ── Members ───────────────────────────────────────────────────────────────────

class AddUserRequest(BaseModel):
    name: str = Field(..., max_length=100)
    color: str = Field(..., max_length=30)

@_app.post("/group/{group_code}/members")
async def add_user(group_code: str, payload: AddUserRequest, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.code == group_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    new_user = User(name=payload.name, color=payload.color, group_id=group.id)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    await broadcast(group_code, "refresh", {"reason": "member-added"})

    return {
        "user_id": new_user.id,
        "name": new_user.name,
        "color": new_user.color,
        "group_id": new_user.group_id,
    }

@_app.delete("/members/{user_id}")
async def delete_member(user_id: int, group_code: str, db: Session = Depends(get_db)):
    user = verify_group_code(user_id, group_code, db)

    db.delete(user)
    db.commit()

    await broadcast(group_code, "refresh", {"reason": "member-deleted"})

    return "user deleted"

class UpdateUser(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=30)

@_app.patch("/group/{group_code}/members/{user_id}")
async def update_user(
    group_code: str, user_id: int, payload: UpdateUser, db: Session = Depends(get_db)
):
    group = db.query(Group).filter(Group.code == group_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    user = db.query(User).filter(User.id == user_id, User.group_id == group.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this group")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    await broadcast(group_code, "refresh", {"reason": "member-updated"})

    return {
        "user_id": user.id,
        "name": user.name,
        "color": user.color,
        "group_id": user.group_id,
    }

# ── Chores ────────────────────────────────────────────────────────────────────

class ChoreCreate(BaseModel):
    user_id: int
    title: str = Field(..., max_length=200)
    completed: bool = False

class ChoreToggle(BaseModel):
    completed: bool

@_app.get("/group/{group_code}/chores")
def get_chores(group_code: str, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.code == group_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    chores = db.query(Chore).filter(Chore.group_id == group.id).all()
    return [
        {
            "chore_id": c.id,
            "title": c.title,
            "completed": c.completed,
            "user_id": c.user_id,
            "group_id": c.group_id,
        }
        for c in chores
    ]

@_app.post("/group/{group_code}/chores")
async def add_chore(group_code: str, payload: ChoreCreate, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.code == group_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    user = db.query(User).filter(User.id == payload.user_id, User.group_id == group.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this group")

    chore = Chore(
        title=payload.title,
        completed=payload.completed,
        user_id=payload.user_id,
        group_id=group.id,
    )
    db.add(chore)
    db.commit()
    db.refresh(chore)

    await broadcast(group_code, "refresh", {"reason": "chore-added"})

    return {
        "chore_id": chore.id,
        "title": chore.title,
        "completed": chore.completed,
        "user_id": chore.user_id,
        "group_id": chore.group_id,
    }

@_app.patch("/chores/{chore_id}")
async def toggle_chore(chore_id: int, payload: ChoreToggle, group_code: str, db: Session = Depends(get_db)):
    chore = verify_chore_group_code(chore_id, group_code, db)

    chore.completed = payload.completed
    db.commit()
    db.refresh(chore)

    await broadcast(group_code, "refresh", {"reason": "chore-toggled"})

    return {
        "chore_id": chore.id,
        "title": chore.title,
        "completed": chore.completed,
        "user_id": chore.user_id,
        "group_id": chore.group_id,
    }

@_app.delete("/chores/{chore_id}")
async def delete_chore(chore_id: int, group_code: str, db: Session = Depends(get_db)):
    chore = verify_chore_group_code(chore_id, group_code, db)

    db.delete(chore)
    db.commit()

    await broadcast(group_code, "refresh", {"reason": "chore-deleted"})

    return "chore deleted"