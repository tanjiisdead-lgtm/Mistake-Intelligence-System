from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_code = Column(String, unique=True, index=True)
    text = Column(Text)
    image_url = Column(String, nullable=True)
    options = Column(JSON) # List of options
    correct_option = Column(Integer) # Index of correct option
    subject = Column(String)
    chapter = Column(String)

    # IRT Parameters
    difficulty = Column(Float, default=0.0) # b
    discrimination = Column(Float, default=1.0) # a
    guessing = Column(Float, default=0.2) # c

    virtual_tier = Column(Integer, default=1) # 1 to 7
    frequency_score = Column(Integer, default=0)
    panic_weight = Column(Float, default=0.0) # How much stress this question usually causes
    memory_value = Column(Integer, default=0) # 0: unappeared, 100: correct, 50: unattempted, -50: incorrect

    attempts = relationship("Attempt", back_populates="question")

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    selected_option = Column(Integer, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    time_spent = Column(Float) # in seconds

    # Behavioral metrics
    confidence_score = Column(Integer) # User reported 1-5
    hesitation_score = Column(Float) # Derived from time to first interaction
    tab_switches = Column(Integer, default=0)
    answer_changes = Column(Integer, default=0)

    # Derived metrics
    panic_score = Column(Float)
    fatigue_score = Column(Float)
    momentum_delta = Column(Float)

    timestamp = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question", back_populates="attempts")

class SubjectPerformance(Base):
    __tablename__ = "subject_performance"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, unique=True, index=True)
    highest_difficulty_reached = Column(Integer, default=50)
    current_title = Column(String, default="The Academy Student (Gifted)")
    streak = Column(Integer, default=0)
