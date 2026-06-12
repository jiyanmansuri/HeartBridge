import os
import json
import urllib.request
import urllib.parse
from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter(prefix="/api", tags=["translate"])

class TranslateRequest(BaseModel):
    text: str
    target_lang: str

@router.post("/translate")
def translate_text(req: TranslateRequest):
    if not req.text.strip():
        return {"translated_text": ""}
    
    if os.environ.get("GEMINI_API_KEY"):
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            target = "Gujarati" if req.target_lang == "gu" else "English"
            prompt = f"Translate the following text into {target}. Return ONLY the direct translation text without comments, explanations, markdown quotes or intros:\n\n{req.text}"
            response = model.generate_content(prompt)
            if response and response.text:
                return {"translated_text": response.text.strip()}
        except Exception as e:
            print("Gemini translate error:", e)
            
    try:
        source_code = "en" if req.target_lang == "gu" else "gu"
        target_code = "gu" if req.target_lang == "gu" else "en"
        encoded_text = urllib.parse.quote(req.text)
        url = f"https://api.mymemory.translated.net/get?q={encoded_text}&langpair={source_code}|{target_code}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        url_req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(url_req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data and data.get("responseData"):
                translated = data["responseData"].get("translatedText")
                if translated:
                    return {"translated_text": translated}
    except Exception as e:
        print("MyMemory translation fallback error:", e)

    words_map = {
        "hello": "નમસ્તે",
        "how are you": "કેમ છો",
        "good morning": "શુભ સવાર",
        "good night": "શુભ રાત્રિ",
        "water": "પાણી",
        "food": "ખોરાક",
        "medicine": "દવા",
        "thank you": "આભાર",
        "નમસ્તે": "Hello",
        "કેમ છો": "How are you",
        "શુભ સવાર": "Good morning",
        "શુભ રાત્રિ": "Good night",
        "પાણી": "Water",
        "ખોરાક": "Food",
        "દવા": "Medicine",
        "આભાર": "Thank you"
    }
    
    normalized_text = req.text.strip().lower().rstrip("?").rstrip("!").rstrip(".")
    if normalized_text in words_map:
        return {"translated_text": words_map[normalized_text]}
        
    return {"translated_text": f"({req.target_lang.upper()} Translation) {req.text}"}
