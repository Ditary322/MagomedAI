import httpx
from logger import logger
from config import settings
from schemas.llm import LLMResponse
import json

# Собираем полный адрес нашего Мозга из настроек
OLLAMA_API_URL = f"{settings.OLLAMA_HOST}:{settings.OLLAMA_PORT}/api/generate"

async def get_structured_llm_response(prompt: str) -> LLMResponse | None:
    logger.info(f"Запрос на структурированный ответ от LLM. Модель: {settings.OLLAMA_DEFAULT_MODEL}")
    
    # Промпт, заставляющий LLM отвечать в формате JSON
    json_prompt = (
        "Ты — Магомед, цифровой компаньон. Твоя задача — ответить на сообщение пользователя. "
        "Твой ответ ДОЛЖЕН БЫТЬ ТОЛЬКО в формате JSON, который соответствует следующей схеме: "
        "{\"text\": \"string\", \"sticker_id\": \"string | null\"}.\n"
        "Поле 'text' - это твой текстовый ответ. Поле 'sticker_id' - это ID стикера, который подходит к ответу (например, 'ok_hand', 'thumbs_up'), или null, если стикер не нужен.\n"
        "НЕ добавляй никаких объяснений или лишнего текста, только валидный JSON.\n\n"
        f"--- Исходный промпт ---\n{prompt}\n----------------------\n\n"
        "Твой JSON-ответ:"
    )
    
    payload = {"model": settings.OLLAMA_DEFAULT_MODEL, "prompt": json_prompt, "stream": False, "format": "json"}
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OLLAMA_API_URL, json=payload)
            response.raise_for_status()
            
            response_data = response.json()
            raw_json_string = response_data.get("response", "{}")
            
            # Парсим JSON и валидируем его с помощью Pydantic
            parsed_response = LLMResponse.model_validate_json(raw_json_string)
            logger.success("Успешный структурированный ответ от LLM получен.")
            return parsed_response

    except httpx.RequestError as e:
        logger.error(f"Ошибка при запросе к Ollama: {e}")
        return None
    except Exception as e:
        logger.error(f"Ошибка обработки ответа от LLM: {e}. Ответ был: {response_data.get('response', '')}")
        return None

async def get_llm_response(prompt: str) -> str | None:
    """
    Отправляет промпт в Ollama и возвращает текстовый ответ.
    Возвращает None в случае ошибки.
    """
    logger.info(f"Отправка запроса к LLM. Модель: {settings.OLLAMA_DEFAULT_MODEL}")
    
    # Формируем тело запроса для API Ollama
    payload = {
        "model": settings.OLLAMA_DEFAULT_MODEL,
        "prompt": prompt,
        "stream": False # Важно: stream=False означает, что мы ждем полного ответа
    }
    
    # Используем асинхронный HTTP-клиент
    try:
        async with httpx.AsyncClient(timeout=3600.0) as client:
            response = await client.post(OLLAMA_API_URL, json=payload)
            
            # Проверяем, что запрос прошел успешно (код 2xx)
            response.raise_for_status() 
            
            response_data = response.json()
            logger.success("Успешный ответ от LLM получен.")
            return response_data.get("response", "").strip()

    except httpx.RequestError as e:
        logger.error(f"Ошибка при запросе к Ollama: {e}")
        return None
    except Exception as e:
        logger.error(f"Неожиданная ошибка при работе с LLM: {e}")
        return None
    
async def extract_facts_from_dialog(dialog: str) -> list[str]:
    """
    Анализирует диалог и извлекает из него факты о пользователе.
    Возвращает список фактов.
    """
    logger.info("Запрос на извлечение фактов из диалога...")
    
    # Наш хитрый промпт для LLM, который заставляет ее думать в формате JSON
    fact_extraction_prompt = (
        "Ты — 'Fact Extractor', аналитический модуль. Твоя задача — извлечь из диалога ключевые факты о пользователе. "
        "Ответь ТОЛЬКО в формате JSON-массива строк. Каждый факт должен быть коротким, ёмким и от третьего лица (например, 'любит пиццу', а не 'я люблю пиццу'). "
        "Если фактов нет, верни пустой массив [].\n\n"
        "Примеры:\n"
        "Диалог: 'Меня зовут Артур, я из Москвы.' -> Ответ: [\"его зовут Артур\", \"живет в Москве\"]\n"
        "Диалог: 'Я обожаю играть в Доту 2 по вечерам.' -> Ответ: [\"играет в Dota 2\", \"играет по вечерам\"]\n"
        "Диалог: 'Какая сегодня погода?' -> Ответ: []\n\n"
        f"Диалог для анализа:\n---\n{dialog}\n---\n\n"
        "Твой JSON-ответ:"
    )
    
    # Используем нашу существующую функцию для получения ответа от LLM
    raw_response = await get_llm_response(fact_extraction_prompt)
    
    if not raw_response:
        logger.error("Не удалось получить ответ от LLM для извлечения фактов.")
        return []

    try:
        # Пытаемся распарсить JSON из ответа LLM
        # Иногда LLM может добавить лишний текст, ищем сам JSON
        json_part = raw_response[raw_response.find('['):raw_response.rfind(']')+1]
        facts = json.loads(json_part)
        if isinstance(facts, list):
            logger.success(f"Успешно извлечено фактов: {len(facts)}")
            return facts
        return []
    except json.JSONDecodeError:
        logger.error(f"Ошибка декодирования JSON при извлечении фактов. Ответ LLM: {raw_response}")
        return []