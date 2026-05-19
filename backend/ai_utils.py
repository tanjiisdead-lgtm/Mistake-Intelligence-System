import google.generativeai as genai
import os
import json
from PIL import Image
import io

def parse_question_with_ai(image_bytes: bytes, api_key: str):
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    prompt = """
    Analyze this image of a JEE question.
    Extract the question text, options, subject, and chapter.
    Also estimate the difficulty.

    RATING INSTRUCTIONS:
    - Standard JEE Mains: 0.0 to 0.6
    - Standard JEE Advanced: 0.6 to 1.0
    - If the question requires multi-step synthesis across multiple chapters, or introduces Olympiad/RMO-level mathematical rigour, you are authorized to break the 1.0 ceiling.
    - Rate up to 2.0 for Olympiad level.
    - Rate up to 10.0 ONLY if the question is a historically famous unsolved or unquantifiable problem adapted for a JEE template.

    Return the result in JSON format:
    {
      "text": "question text here",
      "options": ["A", "B", "C", "D"],
      "correct_option": index_of_correct_option_if_known_else_-1,
      "subject": "Physics/Chemistry/Mathematics",
      "chapter": "Chapter Name",
      "difficulty": 0.85
    }
    """

    image = Image.open(io.BytesIO(image_bytes))
    response = model.generate_content([prompt, image])

    try:
        # Clean up JSON response in case AI adds markdown
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        return json.loads(text)
    except Exception as e:
        print(f"Error parsing AI response: {e}")
        return None
