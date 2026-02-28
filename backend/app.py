from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import time
import re
from functools import wraps
import jwt
from datetime import datetime, timedelta
import requests
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# ==================== LOAD ENV ====================
load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

LOCK_DURATION = 30
HUGGINGFACE_MODEL = "meta-llama/Llama-3.2-1B-Instruct"

# ==================== DATABASE ====================

def get_connection():
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=RealDictCursor
    )

def setup_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            failed_attempts INTEGER DEFAULT 0,
            lock_time DOUBLE PRECISION
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS equipment (
            id SERIAL PRIMARY KEY,
            name TEXT,
            price DOUBLE PRECISION,
            is_active BOOLEAN DEFAULT TRUE
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rentals (
            id SERIAL PRIMARY KEY,
            username TEXT,
            equipment_id INTEGER REFERENCES equipment(id),
            days INTEGER,
            total DOUBLE PRECISION,
            status TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            username TEXT,
            action TEXT,
            timestamp DOUBLE PRECISION
        )
    """)

    conn.commit()
    cur.close()
    conn.close()

# ==================== SECURITY ====================

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def log_action(username, action):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO audit_logs(username, action, timestamp) VALUES (%s,%s,%s)",
        (username, action, time.time())
    )
    conn.commit()
    cur.close()
    conn.close()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]

            data = jwt.decode(
                token,
                app.config['SECRET_KEY'],
                algorithms=["HS256"]
            )
            current_user = data['username']
            current_role = data['role']
        except:
            return jsonify({'message': 'Token is invalid'}), 401

        return f(current_user, current_role, *args, **kwargs)

    return decorated

# ==================== AI HELPER ====================

def call_huggingface_api(prompt, max_length=300):
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": HUGGINGFACE_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_length,
        "temperature": 0.7
    }

    response = requests.post(
        "https://router.huggingface.co/v1/chat/completions",
        headers=headers,
        json=payload
    )

    if response.status_code == 200:
        result = response.json()
        content = result["choices"][0]["message"]["content"]

        # Remove think block
        content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
        return content

    return None

# ==================== AUTH ====================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO users(name, username, password, role) VALUES (%s,%s,%s,%s)",
        (
            data['name'],
            data['username'],
            hash_password(data['password']),
            data.get('role', 'customer')
        )
    )

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM users WHERE username=%s",
        (data['username'],)
    )

    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({"message": "Invalid credentials"}), 401

    if user['password'] != hash_password(data['password']):
        return jsonify({"message": "Invalid credentials"}), 401

    token = jwt.encode({
        "username": user['username'],
        "role": user['role'],
        "exp": datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({
        "token": token,
        "role": user['role'],
        "username": user['username']
    })

# ==================== AI CHAT ====================

@app.route('/api/ai/chat', methods=['POST'])
@token_required
def ai_chat(current_user, current_role):
    data = request.get_json()
    question = data.get("question")

    prompt = f"""
You are AgriBot, a professional farming equipment rental assistant.
Answer clearly and concisely.

User Question: {question}
"""

    response = call_huggingface_api(prompt)

    return jsonify({
        "response": response or "Service unavailable",
        "timestamp": time.time()
    })

# ==================== MAIN ====================

if __name__ == "__main__":
    setup_db()
    app.run(host="0.0.0.0", port=5000)