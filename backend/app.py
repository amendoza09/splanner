from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Group
from models import User
from models import Event
from pydantic import BaseModel
from datetime import datetime

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
@app.get("/group/code/{group_code}/members")
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

@app.post("/members/{user_id}/events")
def add_event(user_id: int, event: EventCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    
    new_event = Event(
        title=event.title, 
        start_time=event.start_time,
        end_time=event.end_time,
        user_id=user.id
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return {
        "event_id": new_event.id,
        "title": new_event.title,
        "start_time": new_event.start_time,
        "end_time": new_event.end_time,
        "user_id": new_event.user_id
    }

# add user to group
class AddUserRequest(BaseModel):
    name: str
    color: str
    
@app.post("/group/code/{group_code}/members")
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
    
# delete user from group

# edit user