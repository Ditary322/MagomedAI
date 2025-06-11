from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt

# Импортируем наши настройки, где лежит секретный ключ
from config import settings

# 1. Создаем "контекст" для хеширования паролей.
# Мы говорим ему: "Используй алгоритм bcrypt".
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. Функция для проверки пароля
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Сравнивает обычный пароль с хешированным."""
    return pwd_context.verify(plain_password, hashed_password)

# 3. Функция для создания хеша пароля
def get_password_hash(password: str) -> str:
    """Создает хеш из обычного пароля."""
    return pwd_context.hash(password)

# 4. Главная функция для создания Access токена
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Создает новый Access Token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # По умолчанию токен живет 15 минут
        expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    
    to_encode.update({"exp": expire})
    
    # Кодируем токен с нашим секретным ключом и алгоритмом
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# 5. Функция для создания Refresh токена (отличается только временем жизни)
def create_refresh_token(data: dict):
    """Создает новый Refresh Token."""
    # Время жизни берем из настроек
    expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return create_access_token(data=data, expires_delta=expires)

def decode_access_token(token: str) -> dict | None:
    """
    Декодирует access токен. Возвращает payload или None если токен невалидный.
    """
    try:
        # Пытаемся раскодировать токен с тем же секретом и алгоритмом
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        # Если подпись неверная или токен просрочен, библиотека выдаст ошибку
        return None