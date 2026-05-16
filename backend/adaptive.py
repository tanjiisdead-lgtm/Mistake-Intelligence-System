import random
from sqlalchemy.orm import Session
from . import models, schemas

def get_adaptive_question(db: Session):
    # Tier probabilities: 1:35%, 2:25%, 3:15%, 4:10%, 5:8%, 6:5%, 7:2%
    tiers = [1, 2, 3, 4, 5, 6, 7]
    weights = [0.35, 0.25, 0.15, 0.10, 0.08, 0.05, 0.02]

    selected_tier = random.choices(tiers, weights=weights, k=1)[0]

    # Try to get a question from the selected tier
    question = db.query(models.Question).filter(models.Question.virtual_tier == selected_tier).order_by(models.Question.frequency_score).first()

    # Fallback if tier is empty
    if not question:
        question = db.query(models.Question).order_by(models.Question.frequency_score).first()

    if question:
        question.frequency_score += 1
        db.commit()
        db.refresh(question)

    return question

def calculate_attempt_metrics(db: Session, attempt: schemas.AttemptCreate, question: models.Question):
    # Basic logic for Panic, Fatigue, and Momentum

    # Panic Score: High if time is low or high, and hesitation is high
    # Simulating a simple heuristic:
    panic_score = 0.0
    if attempt.time_spent > 120: # Over 2 mins
        panic_score += 0.3
    if attempt.tab_switches > 0:
        panic_score += 0.2
    if attempt.answer_changes > 2:
        panic_score += 0.2
    if attempt.hesitation_score > 10:
        panic_score += 0.3

    # Fatigue heuristic: Increases with total attempts
    total_attempts = db.query(models.Attempt).count()
    fatigue_score = min(1.0, total_attempts * 0.05)

    # Momentum Delta
    momentum_delta = 0.1 if attempt.is_correct else -0.2

    return panic_score, fatigue_score, momentum_delta

def process_attempt(db: Session, attempt_data: schemas.AttemptCreate):
    question = db.query(models.Question).filter(models.Question.id == attempt_data.question_id).first()
    if not question:
        raise Exception("Question not found")

    # Secure verification
    is_correct = attempt_data.selected_option == question.correct_option
    attempt_dict = attempt_data.dict()
    attempt_dict["is_correct"] = is_correct

    # Re-calculate metrics with verified correctness
    attempt_data_verified = schemas.AttemptCreate(**attempt_dict)

    panic_score, fatigue_score, momentum_delta = calculate_attempt_metrics(db, attempt_data_verified, question)

    db_attempt = models.Attempt(
        **attempt_dict,
        panic_score=panic_score,
        fatigue_score=fatigue_score,
        momentum_delta=momentum_delta
    )

    # Tier Transition Logic
    if is_correct:
        # Promote
        if attempt_data.confidence_score >= 4 and attempt_data.time_spent < 60:
            question.virtual_tier = min(7, question.virtual_tier + 2)
        else:
            question.virtual_tier = min(7, question.virtual_tier + 1)
    else:
        # Demote
        # Conceptual mistake -> reset to Tier 1 (simulated by low confidence)
        if attempt_data.confidence_score <= 2:
            question.virtual_tier = 1
        # Timeout/Panic -> drop by 2
        elif panic_score > 0.6:
            question.virtual_tier = max(1, question.virtual_tier - 2)
        # Careless -> drop by 1
        else:
            question.virtual_tier = max(1, question.virtual_tier - 1)

    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt
