from flask import Flask, request, jsonify, g
import sqlite3
import threading
from werkzeug.security import generate_password_hash, check_password_hash
import json
from functools import wraps

app = Flask(__name__)
DATABASE = 'database.db'
lock = threading.Lock()

# Блокировка для работы с базой данных
def synchronized(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        with lock:
            return f(*args, **kwargs)
    return wrapper

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        # Создание таблицы пользователей
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            photo_url TEXT,
            balance INTEGER DEFAULT 1000,
            fans TEXT DEFAULT '[]'
        )
        ''')
        
        # Создание таблицы фанатов
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS fans (
            id INTEGER PRIMARY KEY,
            owner_id INTEGER,
            name TEXT,
            photo_url TEXT,
            price INTEGER DEFAULT 100,
            income INTEGER DEFAULT 10,
            FOREIGN KEY (owner_id) REFERENCES users (id)
        )
        ''')
        
        # Создание таблицы товаров
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            name TEXT,
            price INTEGER,
            image_url TEXT,
            description TEXT
        )
        ''')
        
        db.commit()

# Инициализация базы данных с тестовыми данными
def seed_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        # Добавляем тестовые товары
        products = [
            ('Золотая монета', 100, '/static/images/coin.png', 'Увеличивает доход на 10%'),
            ('Серебряная монета', 50, '/static/images/silver_coin.png', 'Увеличивает доход на 5%'),
            ('Бриллиант', 500, '/static/images/diamond.png', 'Увеличивает доход на 25%'),
            ('Супер-ускоритель', 300, '/static/images/booster.png', 'Удваивает доход на 1 час')
        ]
        
        cursor.executemany('INSERT INTO products (name, price, image_url, description) VALUES (?, ?, ?, ?)', products)
        
        # Добавляем тестовых фанатов
        fans = [
            (None, 'Джон', '/static/images/fan1.png'),
            (None, 'Майк', '/static/images/fan2.png'),
            (None, 'Сара', '/static/images/fan3.png'),
            (None, 'Эмма', '/static/images/fan4.png'),
            (None, 'Том', '/static/images/fan5.png')
        ]
        
        cursor.executemany('INSERT INTO fans (owner_id, name, photo_url) VALUES (?, ?, ?)', fans)
        
        db.commit()

@app.route('/api/user', methods=['GET'])
@synchronized
def get_user():
    user_id = request.args.get('id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Получаем фанатов пользователя
    cursor.execute('SELECT * FROM fans WHERE owner_id = ?', (user_id,))
    fans = cursor.fetchall()
    
    # Получаем список ID фанатов из JSON строки
    fan_ids = json.loads(user[6]) if user[6] else []
    
    user_data = {
        'id': user[0],
        'username': user[1],
        'first_name': user[2],
        'last_name': user[3],
        'photo_url': user[4],
        'balance': user[5],
        'fans': [{
            'id': fan[0],
            'name': fan[2],
            'photo_url': fan[3],
            'price': fan[4],
            'income': fan[5]
        } for fan in fans]
    }
    
    return jsonify(user_data)

@app.route('/api/user/update', methods=['POST'])
@synchronized
def update_user():
    data = request.json
    user_id = data.get('id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    # Обновляем баланс пользователя
    if 'balance' in data:
        cursor.execute('UPDATE users SET balance = ? WHERE id = ?', (data['balance'], user_id))
    
    # Обновляем список фанатов
    if 'fans' in data:
        cursor.execute('UPDATE users SET fans = ? WHERE id = ?', (json.dumps(data['fans']), user_id))
    
    db.commit()
    
    return jsonify({'status': 'success'})

@app.route('/api/fans/available', methods=['GET'])
@synchronized
def get_available_fans():
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT * FROM fans WHERE owner_id IS NULL')
    fans = cursor.fetchall()
    
    fan_list = [{
        'id': fan[0],
        'name': fan[2],
        'photo_url': fan[3],
        'price': fan[4],
        'income': fan[5]
    } for fan in fans]
    
    return jsonify(fan_list)

@app.route('/api/fans/buy', methods=['POST'])
@synchronized
def buy_fan():
    data = request.json
    user_id = data.get('user_id')
    fan_id = data.get('fan_id')
    
    if not user_id or not fan_id:
        return jsonify({'error': 'User ID and Fan ID are required'}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    # Получаем данные пользователя
    cursor.execute('SELECT balance FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    balance = user[0]
    
    # Получаем данные фаната
    cursor.execute('SELECT price, income FROM fans WHERE id = ?', (fan_id,))
    fan = cursor.fetchone()
    
    if not fan:
        return jsonify({'error': 'Fan not found'}), 404
    
    price = fan[0]
    income = fan[1]
    
    # Проверяем баланс
    if balance < price:
        return jsonify({'error': 'Not enough balance'}), 400
    
    # Обновляем баланс пользователя
    new_balance = balance - price
    cursor.execute('UPDATE users SET balance = ? WHERE id = ?', (new_balance, user_id))
    
    # Назначаем фаната пользователю
    cursor.execute('UPDATE fans SET owner_id = ?, price = ? WHERE id = ?', 
                   (user_id, int(price * 1.5), fan_id))  # Увеличиваем цену для следующей покупки
    
    # Добавляем фаната в список пользователя
    cursor.execute('SELECT fans FROM users WHERE id = ?', (user_id,))
    fans = cursor.fetchone()[0]
    fan_list = json.loads(fans) if fans else []
    fan_list.append(fan_id)
    cursor.execute('UPDATE users SET fans = ? WHERE id = ?', (json.dumps(fan_list), user_id))
    
    db.commit()
    
    return jsonify({
        'status': 'success',
        'new_balance': new_balance,
        'fan': {
            'id': fan_id,
            'price': int(price * 1.5),
            'income': income
        }
    })

@app.route('/api/products', methods=['GET'])
def get_products():
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT * FROM products')
    products = cursor.fetchall()
    
    product_list = [{
        'id': product[0],
        'name': product[1],
        'price': product[2],
        'image_url': product[3],
        'description': product[4]
    } for product in products]
    
    return jsonify(product_list)

@app.route('/api/products/buy', methods=['POST'])
@synchronized
def buy_product():
    data = request.json
    user_id = data.get('user_id')
    product_id = data.get('product_id')
    
    if not user_id or not product_id:
        return jsonify({'error': 'User ID and Product ID are required'}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    # Получаем данные пользователя
    cursor.execute('SELECT balance FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    balance = user[0]
    
    # Получаем данные товара
    cursor.execute('SELECT price FROM products WHERE id = ?', (product_id,))
    product = cursor.fetchone()
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    price = product[0]
    
    # Проверяем баланс
    if balance < price:
        return jsonify({'error': 'Not enough balance'}), 400
    
    # Обновляем баланс пользователя
    new_balance = balance - price
    cursor.execute('UPDATE users SET balance = ? WHERE id = ?', (new_balance, user_id))
    
    db.commit()
    
    return jsonify({
        'status': 'success',
        'new_balance': new_balance
    })

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT id, username, first_name, last_name, photo_url, balance FROM users ORDER BY balance DESC LIMIT 10')
    leaders = cursor.fetchall()
    
    leaderboard = [{
        'id': leader[0],
        'username': leader[1],
        'first_name': leader[2],
        'last_name': leader[3],
        'photo_url': leader[4],
        'balance': leader[5]
    } for leader in leaders]
    
    return jsonify(leaderboard)

if __name__ == '__main__':
    init_db()
    seed_db()
    app.run(debug=True)
