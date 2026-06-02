from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QuestionBase(BaseModel):
    question_code: str
    text: str
    options: List[str]
    # correct_option: int  <-- Removed from Base to prevent leaking
    subject: str
    chapter: str
    difficulty: Optional[float] = 0.0
    virtual_tier: Optional[int] = 1

class QuestionCreate(QuestionBase):
    correct_option: int

class Question(QuestionBase):
    id: int
    image_url: Optional[str] = None
    frequency_score: int
    panic_weight: float
    # correct_option: int  # Removed for security

    class Config:
        from_attributes = True

class AttemptBase(BaseModel):
    question_id: int
    selected_option: Optional[int] = None
    is_correct: Optional[bool] = None
    time_spent: float
    confidence_score: int
    hesitation_score: float
    tab_switches: int
    answer_changes: int

class AttemptCreate(AttemptBase):
    pass

class AttemptResponse(AttemptBase):
    id: int
    panic_score: float
    fatigue_score: float
    momentum_delta: float
    timestamp: datetime
    is_correct: bool

    class Config:
        from_attributes = True

class Attempt(AttemptBase):
    id: int
    panic_score: float
    fatigue_score: float
    momentum_delta: float
    timestamp: datetime

    class Config:
        from_attributes = True
