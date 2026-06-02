from sqlalchemy.orm import Session
from . import models, schemas
import json
import os

def get_question(db: Session, question_id: int):
    return db.query(models.Question).filter(models.Question.id == question_id).first()

def get_questions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Question).offset(skip).limit(limit).all()

def create_question(db: Session, question: schemas.QuestionCreate):
    db_question = models.Question(**question.dict())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def sync_to_files(db: Session):
    questions = db.query(models.Question).all()
    # Group by tier
    tiers = {i: [] for i in range(1, 8)}
    for q in questions:
        q_data = {
            "id": q.id,
            "code": q.question_code,
            "text": q.text,
            "subject": q.subject,
            "chapter": q.chapter,
            "tier": q.virtual_tier
        }
        tiers[q.virtual_tier].append(q_data)

    os.makedirs("exports", exist_ok=True)
    for tier, qs in tiers.items():
        with open(f"exports/tier_{tier}.json", "w") as f:
            json.dump(qs, f, indent=2)
    return True
