# core/db/crud.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from . import models
from logger import logger

# --- Функции-помощники для поиска с ЖАДНОЙ ЗАГРУЗКОЙ ---

async def get_contact_by_name(db: AsyncSession, name: str) -> models.Contact | None:
    """Найти контакт по его основному имени, сразу подгрузив связанные данные."""
    logger.info(f"Поиск контакта в БД по имени: {name}")
    result = await db.execute(
        select(models.Contact)
        .options(selectinload(models.Contact.facts), selectinload(models.Contact.nicknames))
        .filter(models.Contact.main_name == name)
    )
    return result.scalars().first()

async def get_contact_by_nickname(db: AsyncSession, nickname: str) -> models.Contact | None:
    """Найти контакт по никнейму, сразу подгрузив связанные данные."""
    logger.info(f"Поиск контакта в БД по никнейму: {nickname}")
    result = await db.execute(
        select(models.Contact)
        .options(selectinload(models.Contact.facts), selectinload(models.Contact.nicknames))
        .join(models.Nickname)
        .filter(models.Nickname.nickname == nickname)
    )
    return result.scalars().first()


# --- Функции для создания и изменения данных ---

async def create_contact(db: AsyncSession, name: str, status: str = "знакомый") -> models.Contact:
    """Создать новый контакт (личное дело)."""
    logger.info(f"Создание нового контакта: Имя='{name}', Статус='{status}'")
    
    existing_contact = await get_contact_by_name(db, name=name)
    if existing_contact:
        logger.warning(f"Контакт с именем '{name}' уже существует. Возвращаем существующий.")
        return existing_contact

    db_contact = models.Contact(main_name=name, status=status)
    db.add(db_contact)
    await db.commit()
    await db.refresh(db_contact)
    
    logger.success(f"Контакт '{name}' успешно создан с ID: {db_contact.id}")
    return db_contact

# ... (остальные функции add_nickname_to_contact и add_fact_to_contact остаются БЕЗ ИЗМЕНЕНИЙ) ...
async def add_nickname_to_contact(db: AsyncSession, contact: models.Contact, nickname: str, platform: str) -> models.Nickname:
    logger.info(f"Добавление никнейма '{nickname}' ({platform}) для контакта '{contact.main_name}'")
    db_nickname = models.Nickname(nickname=nickname, platform=platform, contact_id=contact.id)
    db.add(db_nickname)
    await db.commit()
    await db.refresh(db_nickname)
    logger.success(f"Никнейм '{nickname}' успешно добавлен.")
    return db_nickname

async def add_fact_to_contact(db: AsyncSession, contact: models.Contact, fact_text: str, added_by: str) -> models.Fact:
    logger.info(f"Добавление факта для '{contact.main_name}': {fact_text}")
    db_fact = models.Fact(fact_text=fact_text, added_by=added_by, contact_id=contact.id)
    db.add(db_fact)
    await db.commit()
    await db.refresh(db_fact)
    logger.success(f"Факт '{fact_text[:30]}...' успешно добавлен.")
    return db_fact

# core/db/crud.py
# ...

async def add_multiple_facts_to_contact(db: AsyncSession, contact: models.Contact, facts: list[str], added_by: str):
    """Добавить список фактов существующему контакту."""
    logger.info(f"Добавление {len(facts)} фактов для '{contact.main_name}'")
    
    # Создаем список объектов-моделей
    db_facts = [models.Fact(fact_text=fact, added_by=added_by, contact_id=contact.id) for fact in facts]
    
    # .add_all() - эффективный способ добавить много записей сразу
    db.add_all(db_facts)
    await db.commit()
    
    logger.success("Факты успешно добавлены.")