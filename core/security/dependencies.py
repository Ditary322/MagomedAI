# core/security/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from . import auth_logic
from schemas.auth import TokenData
from logger import logger

# Это "схема" для FastAPI, которая говорит: "Ищи токен в заголовке Authorization: Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Зависимость для проверки токена и получения данных пользователя.
    """
    # Создаем исключение, которое будем кидать, если что-то не так
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Декодируем токен с помощью нашей логики
    payload = auth_logic.decode_access_token(token)
    if payload is None:
        logger.warning("Невалидный токен, отказано в доступе.")
        raise credentials_exception

    # Извлекаем имя пользователя из "начинки" токена
    username: str = payload.get("sub")
    if username is None:
        logger.warning("В токене отсутствует имя пользователя (sub).")
        raise credentials_exception

    # Возвращаем данные о пользователе
    # В будущем здесь мы можем достать пользователя из реальной БД
    logger.info(f"Доступ разрешен для пользователя: {username}")
    return {"username": username} # Пока просто вернем словарь