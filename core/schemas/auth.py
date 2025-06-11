from pydantic import BaseModel

# Чертеж того, что мы будем отправлять пользователю в ответ на успешный логин
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# Чертеж информации, которую мы "зашиваем" внутрь токена
class TokenData(BaseModel):
    username: str | None = None