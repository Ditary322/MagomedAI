# core/security/auth_api.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

# Импортируем нашу логику, схемы и логгер
from security import auth_logic
from schemas.auth import Token
from logger import logger

# Создаем "роутер" - это как отдельная глава в книге наших API.
# Так мы не сваливаем все в один файл main.py
router = APIRouter(
    prefix="/auth",         # Все адреса в этом файле будут начинаться с /auth
    tags=["Authentication"] # Для красивой документации FastAPI (/docs)
)

# --- ВРЕМЕННАЯ БАЗА ДАННЫХ ---
# В будущем мы заменим это на настоящую базу данных SQLite.
# А пока что, для отладки, нам хватит и простого словаря.

# ВАЖНО: Пароль 'supersecret' здесь должен быть уже в виде хеша!
# Чтобы получить хеш, нужно один раз выполнить в терминале:
# docker-compose exec core python
# >>> from security.auth_logic import get_password_hash
# >>> print(get_password_hash("supersecret"))
# >>> exit()
# И вставить полученную строку в 'hashed_password'.
FAKE_USERS_DB = {
    "pc_agent": {
        "username": "pc_agent",
        "hashed_password": "$2b$12$DLWFPjT.JFJL2l1B7PykYON5R5N/KQYq5Izu2I4MjsdGSIqL2Rctq", # Пример хеша для 'supersecret'
        "roles": ["pc_control"],
    },
    "minecraft_agent": {
        "username": "minecraft_agent",
        "hashed_password": "$2b$12$DLWFPjT.JFJL2l1B7PykYON5R5N/KQYq5Izu2I4MjsdGSIqL2Rctq", # Пример хеша для 'another_pass'
        "roles": ["game_interact"],
    }
}

# Функция-помощник для "поиска" пользователя в нашей временной базе
def get_user(db, username: str):
    logger.info(f"Попытка найти пользователя: {username}")
    if username in db:
        return db[username]
    return None

# --- КОНЕЧНАЯ ТОЧКА (ЭНДПОИНТ) ДЛЯ ВХОДА ---

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Эндпоинт для получения JWT токенов.
    Принимает 'username' и 'password' в виде form-data.
    """
    logger.info(f"Получен запрос на выдачу токена для пользователя: {form_data.username}")

    # 1. Ищем пользователя в нашей "базе"
    user = get_user(FAKE_USERS_DB, form_data.username)

    # 2. Проверяем, что пользователь найден И что пароль, который он прислал, верный.
    # Для этого используем нашу функцию-помощник verify_password.
    if not user or not auth_logic.verify_password(form_data.password, user["hashed_password"]):
        logger.warning(f"Неудачная попытка входа для пользователя: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Если все проверки пройдены, создаем для него токены.
    # В 'sub' (subject) записываем его имя пользователя. Это стандарт.
    logger.success(f"Успешный вход для пользователя: {form_data.username}. Выдаю токены.")
    access_token = auth_logic.create_access_token(data={"sub": user["username"]})
    refresh_token = auth_logic.create_refresh_token(data={"sub": user["username"]})

    # 4. Отдаем клиенту оба токена
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }