# Файл: api/index.py (ОТЛАДОЧНАЯ ВЕРСИЯ для проверки маршрутизации)

import os
# import io <--- УДАЛИТЬ ИЛИ ЗАКОММЕНТИРОВАТЬ
import logging
from fastapi import FastAPI, HTTPException
# from fastapi.responses import FileResponse, JSONResponse <--- УДАЛИТЬ ИЛИ ЗАКОММЕНТИРОВАТЬ
from fastapi.responses import JSONResponse # Оставим только JSONResponse
from fastapi.middleware.cors import CORSMiddleware
# from gtts import gTTS <--- УДАЛИТЬ ИЛИ ЗАКОММЕНТИРОВАТЬ
import uvicorn 

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Vercel TTS API",
    description="API для генерации аудио из текста на Vercel"
)

# Разрешаем CORS (оставить)
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
    
    if not text:
        raise HTTPException(status_code=400, detail="Text field is required")

    # 🛑 ВРЕМЕННЫЙ ФИКС: Вместо gTTS возвращаем JSON
    logging.info(f"Received text for TTS: {text[:20]}...")
    
    # Возвращаем простой JSON-ответ 200 OK
    return JSONResponse(
        status_code=200,
        content={"message": "API route successful. TTS functionality is temporarily disabled."},
    )
