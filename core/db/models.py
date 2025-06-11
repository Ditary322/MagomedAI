# core/db/models.py

import datetime
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base, relationship

# Создаем базовый класс для всех наших моделей.
# Все наши таблицы будут наследоваться от него.
Base = declarative_base()

# --- Модель №1: "Личное дело" (Таблица Контактов) ---
class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    main_name = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="знакомый") # Например, "братан", "друг", "знакомый"
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))

    # Устанавливаем "связи" с другими таблицами.
    # Это говорит SQLAlchemy: "У одного контакта может быть много никнеймов и много фактов".
    # back_populates="contact" создает двустороннюю связь.
    nicknames = relationship("Nickname", back_populates="contact")
    facts = relationship("Fact", back_populates="contact")

    def __repr__(self):
        return f"<Contact(id={self.id}, name='{self.main_name}')>"


# --- Модель №2: "Алиасы" (Таблица Никнеймов) ---
class Nickname(Base):
    __tablename__ = "nicknames"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String, unique=True, index=True)
    platform = Column(String) # Например, "telegram", "discord", "minecraft"
    
    # Устанавливаем "связь" с таблицей контактов.
    # ForeignKey указывает, что это поле ссылается на id в таблице 'contacts'.
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    
    contact = relationship("Contact", back_populates="nicknames")

    def __repr__(self):
        return f"<Nickname(id={self.id}, nick='{self.nickname}', platform='{self.platform}')>"


# --- Модель №3: "Факты и Истории" (Таблица Фактов) ---
class Fact(Base):
    __tablename__ = "facts"

    id = Column(Integer, primary_key=True, index=True)
    fact_text = Column(String, nullable=False)
    added_by = Column(String, default="user_command") # "user_command" или "magomed_inference"
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))

    # Устанавливаем "связь" с таблицей контактов
    contact_id = Column(Integer, ForeignKey("contacts.id"))

    contact = relationship("Contact", back_populates="facts")

    def __repr__(self):
        return f"<Fact(id={self.id}, text='{self.fact_text[:20]}...')>"