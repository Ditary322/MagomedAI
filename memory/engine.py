import os
import json
import sys

BASE_PATH = os.path.join(os.path.dirname(__file__), '../../data/memory')
os.makedirs(BASE_PATH, exist_ok=True)

_memory = {}
_world_id = None

def set_world(world_id):
    global _world_id, _memory
    _world_id = world_id
    path = _get_path()
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            _memory = json.load(f)
    else:
        _memory = {}

def _get_path():
    return os.path.join(BASE_PATH, f'{_world_id}.json')

def save():
    if _world_id is None:
        raise RuntimeError("World ID не установлен")
    with open(_get_path(), 'w', encoding='utf-8') as f:
        json.dump(_memory, f, indent=2, ensure_ascii=False)

def remember(key, value):
    _memory[key] = value
    save()

def forget(key):
    if key in _memory:
        del _memory[key]
        save()

# ⬇ CLI
if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or len(args) < 4:
        print("⚠️ Использование:")
        print("  remember <world_id> <key> <x> <y> <z>")
        print("  remember_area <world_id> <key> <x> <y> <z> <radius>")
        sys.exit(1)

    cmd = args[0]
    world_id = args[1]
    set_world(world_id)

    if cmd == "remember" and len(args) == 6:
        key, x, y, z = args[2], int(args[3]), int(args[4]), int(args[5])
        remember(key, {"x": x, "y": y, "z": z})
        print(f"✅ Запомнил {key} @ {x}, {y}, {z}")
        sys.exit(0)

    if cmd == "remember_area" and len(args) == 7:
        key, x, y, z, radius = args[2], int(args[3]), int(args[4]), int(args[5]), int(args[6])
        remember(key, {"x": x, "y": y, "z": z, "radius": radius})
        print(f"✅ Отметил зону {key} @ {x}, {y}, {z} + radius {radius}")
        sys.exit(0)

    print("❌ Неверные аргументы")
    sys.exit(1)
