from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Group
from models import User
from models import Event
from pydantic import BaseModel
from datetime import datetime, timedelta, time
from typing import Optional

import string
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def read_root( db:Session = Depends(get_db)):
    return {"Status": "connected"}

# get group
@app.get("/group/{group_code}")
def group(group_code: str, db: Session = Depends(get_db)):
    print("getting group")
    group=(
        db.query(Group)
        .options(joinedload(Group.users).joinedload(User.events))
        .filter(Group.code == group_code)
        .first()
    )
    if not group:
        raise HTTPException(status_code=404, detail="group not found")
    
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
                        "is_task": event.is_task
                    }
                    for event in user.events
                ]
            }
            for user in group.users
        ]
    }

# create group
def generate_group_code() -> str:
    length = 5
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def generate_unique_code(db: Session) -> str:
    while True:
        code = generate_group_code()
        print("generating code...")
        try:
            existing = db.query(Group).filter(Group.code == code).first()
        except Exception as e:
            print("query failed", e)
            raise
        if not existing:
                return code

@app.post("/group")
def create_group(db: Session = Depends(get_db)):
    code = generate_unique_code(db)
    new_group = Group(code = code)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return {"group_id": new_group.id, "group_code": new_group.code}

# get users from specific group
@app.get("/group/{group_code}/members")
def get_group_members(group_code: str, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.code == group_code).first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    users = db.query(User).filter(User.group_id == group.id).all()

    return {
        "users": [
            {
                "user_id": user.id,
                "name": user.name,
                "color": user.color
            }
            for user in users
        ]
    }

# get events from users

# make an event under a user
class EventCreate(BaseModel):
    title: str
    start_time: datetime | None = None
    end_time: datetime | None = None
    is_task: bool = False
    notes: str | None = None

@app.post("/members/{user_id}/events")
def add_event(user_id: int, event: EventCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    
    created_events=[]
    start = event.start_time
    end = event.end_time
    current_day = start.date()
    last_day = end.date()
    
    while current_day <= last_day:
        if current_day == start.date():
            day_start = start if not event.is_task else datetime.combine(current_day, time.min)
        else:
            day_start = datetime.combine(current_day, time.min)
        
        if current_day == end.date():
            day_end = end if not event.is_task else datetime.combine(current_day, time.max)
        else:
            day_end = datetime.combine(current_day, time.max)

        new_event = Event(
            title=event.title,
            start_time=day_start,
            end_time=day_end,
            notes=event.notes,
            user_id=user.id,
            is_task=event.is_task
        )
        db.add(new_event)
        created_events.append(new_event)

        current_day += timedelta(days=1)

    db.commit()

    # Refresh all new events
    for e in created_events:
        db.refresh(e)

    return [
        {
            "event_id": e.id,
            "title": e.title,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "notes": e.notes,
            "user_id": e.user_id,
            "is_task": e.is_task
        }
        for e in created_events
    ]

# remove an event
@app.delete("/members/{user_id}/events/{event_id}")
def delete_event(user_id: int, event_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    
    event = (
        db.query(Event)
        .filter(Event.id == event_id, Event.user_id == user_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="event not found")
    
    db.delete(event)
    db.commit()
    return("event deleted")

# remove a user
@app.delete("/members/{user_id}")
def delete_member(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    db.delete(user)
    db.commit()
    return("user deleted")

# update an event
class UpdateEvent(BaseModel):
    title: Optional[str] = None
    start_time: Optional[datetime] | None = None
    end_time: Optional[datetime] | None = None
    is_task: Optional[bool]
    notes: Optional[str] | None = None
    user_id: Optional[int] | None = None
    
@app.patch("/members/{user_id}/events/{event_id}")
def update_event(
        user_id: int,
        event_id: str,
        payload: UpdateEvent,
        db: Session = Depends(get_db)
    ):
    user = (db.query(User).filter(User.id == user_id).first())
    if not user:
        raise HTTPException(status_code=404, detail="User not found group")
    
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="event not found")
    
    update_data = payload.dict(exclude_unset=True)
        
    for key, value in update_data.items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)

    return {
        "user_id": user_id,
        "event_id": event.id,
        "title": event.title,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "notes": event.notes,
        "is_task": event.is_task
    }

# add user to group
class AddUserRequest(BaseModel):
    name: str
    color: str
    
@app.post("/group/{group_code}/members")
def add_user(group_code: str, payload: AddUserRequest, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.code == group_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    new_user = User(name=payload.name, color=payload.color, group_id=group.id)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "user_id": new_user.id,
        "name": new_user.name,
        "color": new_user.color,
        "group_id": new_user.group_id
    }
    
# edit user
class UpdateUser(BaseModel):
        name: Optional[str] = None
        color: Optional[str] = None
    
@app.patch("/group/{group_code}/members/{user_id}")
def update_user(
    group_code: str,
    user_id: int,
    payload: UpdateUser,
    db: Session = Depends(get_db)
):
    group = db.query(Group).filter(Group.code == group_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    user = (
        db.query(User)
        .filter(User.id == user_id, User.group_id == group.id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this group")

    
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return {
        "user_id": user.id,
        "name": user.name,
        "color": user.color,
        "group_id": user.group_id
    }