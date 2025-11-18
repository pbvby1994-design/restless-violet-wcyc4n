# Файл: api/index.py (Финальная версия с StreamingResponse)

import os
import io
import logging
from fastapi import FastAPI, HTTPException
# 🛑 ИЗМЕНЕНИЕ: Используем StreamingResponse вместо FileResponse
from fastapi.responses import StreamingResponse, JSONResponse 
from fastapi.middleware.cors import CORSMiddleware
from gtts import gTTS
import uvicorn 

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Vercel TTS API",
    description="API для генерации аудио из текста на Vercel"
)

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

# ✅ ИСПРАВЛЕНО: Убран конечный слэш
@app.post("/api/tts/generate") 
async def generate_speech(data: dict):
    """Эндпоинт для генерации речи из текста."""
    text = data.get("text")
    voice_name = data.get("voice", "default") 
    
    if not text:
        raise HTTPException(status_code=400, detail="Text field is required")

    if len(text) > 5000:
        raise HTTPException(status_code=400, detail="Text is too long.")

    try:
        # Бесплатная генерация через gTTS 
        tts = gTTS(text=text, lang='ru', slow=False) 
        
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        # ✅ ИСПРАВЛЕНИЕ: Возвращаем StreamingResponse
        return StreamingResponse(
            mp3_fp, 
            media_type="audio/mp3", 
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        logging.error(f"TTS generation error: {e}")
        # Возвращаем 500 ошибку с деталями для отладки
        raise HTTPException(status_code=500, detail=f"TTS generation error: {e}")
