from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from config import settings
from db.fake_db import FAKE_USERS_DB

# 1. Настройка для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. Функции-помощники для паролей
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет, что введенный пароль соответствует хешу."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Создает хеш из пароля."""
    return pwd_context.hash(password)

# 3. Функции для работы с JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создает Access Token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # По умолчанию токен живет 15 минут
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# 4. Функция для "фейковой" аутентификации пользователя
def authenticate_user(username: str, password: str):
    """
    Ищет пользователя в БД и проверяет пароль.
    Возвращает данные пользователя, если все ОК, иначе False.
    """
    user = FAKE_USERS_DB.get(username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user