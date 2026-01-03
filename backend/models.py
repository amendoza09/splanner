from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Group(Base):
    __tablename__ = "groups"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    users = relationship("User", back_populates="group", cascade="all, delete-orphan")
    
class User(Base):
    __tablename__ = "members"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    
    group = relationship("Group", back_populates="users")
    events = relationship("Event", back_populates="user", cascade="all, delete-orphan")
    
class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    notes = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    
    user = relationship("User", back_populates="events")