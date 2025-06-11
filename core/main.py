# core/main.py

from fastapi import FastAPI
from contextlib import asynccontextmanager
from security.dependencies import get_current_user
from fastapi import Depends
from logger import logger
from pydantic import BaseModel
from db import database
from config import settings
from security import auth_api
from security.dependencies import get_current_user
from llm import groq_client as llm_client
from db import crud, database, models
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import FastAPI, Depends, HTTPException

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    logger.info(f"MAGOMED AI CORE v{settings.APP_VERSION} - Application Startup")
    logger.info(f"Connecting to Redis: redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}")
    logger.info(f"Connecting to ChromaDB: http://{settings.CHROMA_HOST}:{settings.CHROMA_PORT}")
    logger.info("Database connections established and tables initialized.")
    logger.info("Authentication module router has been included.")
    logger.info("Service is now operational and ready to accept requests.")
    
    yield
    logger.info("Application shutdown sequence initiated...")
    logger.info("Service has been successfully shut down.")

app = FastAPI(
    title="Magomed AI Core",
    description="Core API for the Magomed digital companion. Handles logic, memory, and integrations.",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

app.include_router(auth_api.router)

async def get_db() -> AsyncSession:
    async with database.AsyncSessionLocal() as session:
        yield session

class ChatRequest(BaseModel):
    nickname: str
    platform: str # "telegram", "discord", etc.
    text: str

# Корневой эндпоинт для проверки статуса
@app.get("/", tags=["System Status"])
async def root():
    """Provides a simple health check endpoint for the service."""
    logger.info("Health check request received at root endpoint.")
    return {"status": "ok", "service": "Magomed AI Core", "version": settings.APP_VERSION}

@app.get("/users/me", tags=["Users"])
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """
    Защищенный эндпоинт.
    Возвращает информацию о текущем пользователе, вошедшем в систему.
    Требует валидный Access Token.
    """
    return current_user

@app.post("/chat", tags=["LLM Chat"])
async def smart_chat_with_llm(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    "Умный" чат, который использует память И ОБУЧАЕТСЯ в процессе диалога.
    """
    logger.info(f"Получено сообщение от '{request.nickname}' ({request.platform}): '{request.text}'")

    # --- ШАГ 1: ИДЕНТИФИКАЦИЯ И СБОР ДАННЫХ ---
    contact = await crud.get_contact_by_nickname(db, nickname=request.nickname)
    if not contact:
        contact = await crud.create_contact(db, name=request.nickname)
        await crud.add_nickname_to_contact(db, contact=contact, nickname=request.nickname, platform=request.platform)

    # --- ВОТ ОН, ФИКС! ---
    # Сохраняем ID контакта в переменную ДО того, как мы что-либо коммитим дальше.
    contact_id = contact.id
    # ----------------------

    # Собираем существующие факты
    facts_text = "\n".join([f"- {fact.fact_text}" for fact in contact.facts])
    
    # --- ШАГ 2: ПОЛУЧЕНИЕ ОТВЕТА ОТ LLM ---
    # (Здесь твоя логика общения с Groq, она у тебя правильная)
    response_payload = await groq_client.get_structured_llm_response(
        contact=contact,
        facts_text=facts_text,
        user_text=request.text
    )
    response_text = response_payload.get("response", "Что-то я задумался...")
    
    # --- ШАГ 3: АНАЛИЗ ДИАЛОГА И СОХРАНЕНИЕ НОВЫХ ФАКТОВ ---
    dialog_to_analyze = f"Пользователь: {request.text}\nМагомед: {response_text}"
    extracted_facts = await groq_client.extract_facts_from_dialog(dialog_to_analyze)
    
    if extracted_facts:
        await crud.add_multiple_facts_to_contact(
            db=db, 
            contact=contact, 
            facts=extracted_facts, 
            added_by="magomed_inference"
        )
    
    # В конце используем переменную, которую сохранили ранее
    return {
        "response": response_text,
        "contact_id": contact_id, # <-- Используем нашу безопасную переменную
        "extracted_facts": extracted_facts
    }

@app.post("/contacts/create", tags=["Memory Management"])
async def create_new_contact(
    name: str,
    status: str = "знакомый",
    db: AsyncSession = Depends(get_db), # <-- Магия FastAPI: получаем сессию
    current_user: dict = Depends(get_current_user) # <-- Проверяем авторизацию
):
    """
    Тестовый эндпоинт для создания нового контакта в памяти Магомеда.
    """
    contact = await crud.create_contact(db=db, name=name, status=status)
    return {"message": "Contact created successfully", "contact_id": contact.id, "name": contact.main_name}

@app.post("/facts/add", tags=["Memory Management"])
async def add_new_fact(contact_id: int, fact_text: str, db: AsyncSession = Depends(get_db)):
    contact = await db.get(models.Contact, contact_id)
    if not contact:
        raise HTTPException(404, "Contact not found")
    await crud.add_fact_to_contact(db, contact, fact_text, "user_command")
    return {"message": "Fact added"}