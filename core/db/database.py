import chromadb
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from config import settings
from logger import logger

# --- Настройка SQLite (Реляционная база) ---

# Путь к файлу нашей базы данных. Он будет лежать внутри Docker-контейнера.
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./magomed_memory.db"

# Создаем "движок" для асинхронной работы с базой
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# Создаем "фабрику сессий", через которую мы будем отправлять запросы
AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


# --- Настройка ChromaDB (Векторная база) ---

# Создаем клиент, который будет подключаться к нашему Chroma-серверу
# Мы используем HTTP-клиент, так как ChromaDB - это отдельный сервис
chroma_client = chromadb.HttpClient(
    host=settings.CHROMA_HOST,  # Мы добавим CHROMA_HOST в config.py
    port=settings.CHROMA_PORT
)

logger.info("Настроено подключение к SQLite и ChromaDB.")

# Функция для создания таблиц при старте приложения
async def init_db():
    from .models import Base
    async with engine.begin() as conn:
        logger.info("Проверка и создание таблиц в SQLite...")
        await conn.run_sync(Base.metadata.create_all)
        logger.success("Таблицы в SQLite успешно проверены/созданы.")