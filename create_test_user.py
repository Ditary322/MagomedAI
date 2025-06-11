from passlib.context import CryptContext

# Создаем контекст для хеширования, указываем, что используем bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

# Придумай пароль для своего ПК-агента
test_password = "supersecret"
hashed_password = get_password_hash(test_password)

print(f"Пароль: {test_password}")
print(f"Хеш для него: {hashed_password}")