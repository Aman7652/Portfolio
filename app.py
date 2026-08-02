import sqlite3
import os
import secrets
from flask import Flask, request, jsonify, session, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder='assets')
app.secret_key = secrets.token_hex(24)

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create Messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            service TEXT NOT NULL,
            budget TEXT,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'Received',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Check if status column exists in messages for existing database
    try:
        cursor.execute("ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'Received'")
    except Exception:
        pass

    conn.commit()
    
    # Seed default user & admin if missing
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ("Aman Kesarwani (Admin)", "amankesarwani0928@gmail.com", generate_password_hash("admin123"), "admin")
        )
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ("John Client", "client@example.com", generate_password_hash("client123"), "customer")
        )
        conn.commit()
        print("Database initialized with seed users.")
        
    conn.close()

# Initialize DB on startup
init_db()

# --- Page Routes ---
@app.route('/')
def index_page():
    return send_from_directory('.', 'index.html')

@app.route('/login')
def login_page():
    return send_from_directory('.', 'login.html')

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)

# --- API Routes ---

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False, 'user': None})
    
    conn = get_db_connection()
    user = conn.execute("SELECT id, name, email, role, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    
    if not user:
        session.pop('user_id', None)
        return jsonify({'authenticated': False, 'user': None})
        
    return jsonify({
        'authenticated': True,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'created_at': user['created_at']
        }
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    role = 'admin' if email == 'amankesarwani0928@gmail.com' else 'customer'
    
    if not name or not email or not password:
        return jsonify({'success': False, 'error': 'All fields are required.'}), 400
        
    if len(password) < 4:
        return jsonify({'success': False, 'error': 'Password must be at least 4 characters.'}), 400

    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'success': False, 'error': 'Email is already registered. Please login.'}), 409

    pwd_hash = generate_password_hash(password)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", (name, email, pwd_hash, role))
    conn.commit()
    new_user_id = cursor.lastrowid
    conn.close()

    # Log in automatically after registration
    session['user_id'] = new_user_id

    return jsonify({
        'success': True,
        'user': {
            'id': new_user_id,
            'name': name,
            'email': email,
            'role': role
        },
        'message': 'Account created successfully!'
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required.'}), 400

    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'success': False, 'error': 'Invalid email or password.'}), 401

    session['user_id'] = user['id']

    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        },
        'message': f"Welcome back, {user['name']}!"
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True, 'message': 'Logged out successfully.'})

@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    service = data.get('service', '').strip()
    budget = data.get('budget', '').strip()
    message = data.get('message', '').strip()

    if not name or not email or not service or not message:
        return jsonify({'success': False, 'error': 'Please fill out all required fields.'}), 400

    user_id = session.get('user_id')

    conn = get_db_connection()
    conn.execute(
        "INSERT INTO messages (user_id, name, email, service, budget, message, status) VALUES (?, ?, ?, ?, ?, ?, 'Received')",
        (user_id, name, email, service, budget, message)
    )
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Thank you! Your message has been saved into Aman\'s database.'})

@app.route('/api/admin/messages', methods=['GET'])
def get_messages():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Authentication required.'}), 401

    conn = get_db_connection()
    user = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()

    if user and user['role'] == 'admin':
        messages = conn.execute("SELECT m.*, u.name as user_name FROM messages m LEFT JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC").fetchall()
    else:
        messages = conn.execute("SELECT * FROM messages WHERE user_id = ? OR email = (SELECT email FROM users WHERE id = ?) ORDER BY created_at DESC", (user_id, user_id)).fetchall()

    conn.close()

    messages_list = [dict(m) for m in messages]
    return jsonify({'success': True, 'messages': messages_list, 'is_admin': user['role'] == 'admin'})

@app.route('/api/admin/messages/<int:msg_id>/status', methods=['PUT'])
def update_message_status(msg_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Authentication required.'}), 401

    conn = get_db_connection()
    user = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()

    if not user or user['role'] != 'admin':
        conn.close()
        return jsonify({'success': False, 'error': 'Admin permission required.'}), 403

    data = request.get_json() or {}
    new_status = data.get('status', 'Received')

    conn.execute("UPDATE messages SET status = ? WHERE id = ?", (new_status, msg_id))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': f'Status updated to {new_status}'})

@app.route('/api/admin/messages/<int:msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'Authentication required.'}), 401

    conn = get_db_connection()
    user = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()

    if not user or user['role'] != 'admin':
        conn.close()
        return jsonify({'success': False, 'error': 'Admin permission required.'}), 403

    conn.execute("DELETE FROM messages WHERE id = ?", (msg_id,))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Message deleted successfully.'})

if __name__ == '__main__':
    print("Starting Aman Kesarwani Portfolio Server on http://127.0.0.1:5050...")
    app.run(host='0.0.0.0', port=5050, debug=True)
