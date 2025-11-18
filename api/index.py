# Файл: api/index.py (Для запуска на Vercel)

import os
import io
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from gtts import gTTS
import uvicorn # Vercel использует uvicorn

logging.basicConfig(level=logging.INFO)

# --- Настройка Web App API (FastAPI) ---
# Vercel ищет переменную "app" для запуска
app = FastAPI(
    title="Vercel TTS API",
    description="API для генерации аудио из текста на Vercel"
)

# Разрешаем CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "TTS API is running on Vercel"}

@app.post("/api/tts/generate/")
async def generate_speech(data: dict):
    """Эндпоинт для генерации речи из текста."""
    text = data.get("text")
    voice_name = data.get("voice", "default") 

    if not text:
        raise HTTPException(status_code=400, detail="Text field is required")

    # Ограничение длины текста для gTTS
    if len(text) > 5000:
        raise HTTPException(status_code=400, detail="Text is too long.")

    try:
        # Бесплатная генерация через gTTS 
        tts = gTTS(text=text, lang='ru', slow=False) 
        
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        # Возвращаем аудиофайл
        return FileResponse(
            mp3_fp, 
            media_type="audio/mp3", 
            filename="speech.mp3",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        logging.error(f"TTS generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal TTS error: Could not generate audio.")

# Этот блок необходим для локального тестирования, но Vercel его игнорирует
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
