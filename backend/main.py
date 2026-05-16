from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import crud, models, schemas, adaptive, ai_utils
from .database import SessionLocal, engine
import os

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/questions/", response_model=schemas.Question)
def create_question(question: schemas.QuestionCreate, db: Session = Depends(get_db)):
    return crud.create_question(db=db, question=question)

@app.get("/questions/", response_model=list[schemas.Question])
def read_questions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    questions = crud.get_questions(db, skip=skip, limit=limit)
    return questions

@app.post("/sync/")
def sync_data(db: Session = Depends(get_db)):
    crud.sync_to_files(db)
    return {"message": "Synced to files"}

@app.get("/next-question/", response_model=schemas.Question)
def get_next_question(db: Session = Depends(get_db)):
    question = adaptive.get_adaptive_question(db)
    if not question:
        raise HTTPException(status_code=404, detail="No questions available")
    return question

@app.post("/submit-attempt/", response_model=schemas.AttemptResponse)
def submit_attempt(attempt: schemas.AttemptCreate, db: Session = Depends(get_db)):
    return adaptive.process_attempt(db, attempt)

@app.post("/upload-question/")
async def upload_question(
    file: UploadFile = File(...),
    api_key: str = Form(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    parsed_data = ai_utils.parse_question_with_ai(contents, api_key)

    if not parsed_data:
        raise HTTPException(status_code=400, detail="Failed to parse question with AI")

    # Generate a code
    question_code = f"AUTO_{os.urandom(4).hex().upper()}"

    question_create = schemas.QuestionCreate(
        question_code=question_code,
        text=parsed_data["text"],
        options=parsed_data["options"],
        correct_option=parsed_data["correct_option"] if parsed_data["correct_option"] != -1 else 0,
        subject=parsed_data["subject"],
        chapter=parsed_data["chapter"],
        difficulty=parsed_data["difficulty"],
        virtual_tier=1
    )

    return crud.create_question(db, question_create)
