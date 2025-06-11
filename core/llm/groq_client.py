# core/llm/groq_client.py

import groq
import json
from logger import logger
from config import settings
from schemas.llm import LLMResponse # <-- Импортируем нашу схему для JSON-ответа

# Инициализируем клиент один раз
client = groq.Groq(api_key=settings.GROQ_API_KEY)
MODEL_NAME = "llama3-8b-8192"

# --- НОВАЯ, ГЛАВНАЯ ФУНКЦИЯ ДЛЯ ГЕНЕРАЦИИ ОТВЕТОВ ---
async def get_structured_llm_response(prompt: str) -> LLMResponse | None:
    """
    Отправляет промпт в Groq, запрашивая структурированный JSON-ответ.
    """
    logger.info(f"Запрос на структурированный ответ от Groq. Модель: {MODEL_NAME}")
    
    json_prompt = (
        "Ты — Магомед, цифровой компаньон. Твоя задача — ответить на сообщение пользователя. "
        "Твой ответ ДОЛЖЕН БЫТЬ ТОЛЬКО в формате JSON, который соответствует схеме: "
        "{\"text\": \"string\", \"sticker_id\": \"string | null\"}.\n"
        "Поле 'text' - твой текстовый ответ. Поле 'sticker_id' - ID стикера (например, 'ok_hand'), или null.\n"
        "НЕ добавляй никаких объяснений или лишнего текста, только валидный JSON.\n\n"
        f"--- Исходный промпт ---\n{prompt}\n----------------------\n\n"
        "Твой JSON-ответ:"
    )
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": json_prompt}],
            model=MODEL_NAME,
            temperature=0.7, # Чуть больше креативности
            response_format={"type": "json_object"}, # Запрашиваем JSON
        )
        raw_json_string = chat_completion.choices[0].message.content
        
        # Валидируем JSON с помощью нашей Pydantic-модели
        parsed_response = LLMResponse.model_validate_json(raw_json_string)
        logger.success("Успешный структурированный ответ от Groq получен.")
        return parsed_response

    except Exception as e:
        logger.error(f"Ошибка обработки ответа от Groq: {e}")
        return None

# --- ТВОЯ ФУНКЦИЯ ДЛЯ ИЗВЛЕЧЕНИЯ ФАКТОВ - ОНА ИДЕАЛЬНА, ОСТАВЛЯЕМ ---
async def extract_facts_from_dialog(dialog: str) -> list[str]:
    # ... твой код для этой функции здесь ...
    # Он работает отлично, особенно с response_format={"type": "json_object"}
    logger.info("Запрос на извлечение фактов из диалога через Groq...")
    
    fact_extraction_prompt = (
        "Ты — 'Fact Extractor', аналитический модуль. Твоя задача — извлечь из диалога ключевые факты о пользователе. "
        "Ответь ТОЛЬКО в формате JSON с одним ключом 'facts', который содержит массив строк. Каждый факт должен быть коротким и от третьего лица (например, 'любит пиццу'). "
        "Если фактов нет, верни `{\"facts\": []}`.\n\n"
        f"Диалог для анализа:\n---\n{dialog}\n---\n\n"
        "Твой JSON-ответ:"
    )
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": fact_extraction_prompt}],
            model=MODEL_NAME, temperature=0, response_format={"type": "json_object"}
        )
        raw_response = chat_completion.choices[0].message.content
        response_data = json.loads(raw_response)
        facts = response_data.get("facts", [])
        
        if isinstance(facts, list):
            logger.success(f"Успешно извлечено фактов через Groq: {len(facts)}")
            return facts
        return []
    except Exception as e:
        logger.error(f"Ошибка при извлечении фактов через Groq: {e}")
        return []