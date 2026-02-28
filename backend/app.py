from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import time
import re
from functools import wraps
import jwt
from datetime import datetime, timedelta
import requests

app = Flask(__name__)
CORS(app)

# Configuration
import os
from dotenv import load_dotenv
load_dotenv()

app.config['SECRET_KEY'] = os.getenv("SECRET_URL")
app.config['DATABASE_URL'] = os.getenv("DATABASE_URL")

# Hugging Face API Configuration (100% FREE!)
# Get your FREE API key from: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Using Hugging Face Router API - required for free tier
HUGGINGFACE_MODEL = "deepseek-ai/DeepSeek-R1:sambanova"

# ==================== DATABASE ==========================

def get_connection():
    return psycopg2.connect(
        app.config['DATABASE_URL'],
        sslmode="require",
        cursor_factory=RealDictCursor
    )

def setup_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name TEXT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            failed_attempts INTEGER DEFAULT 0,
            lock_time REAL
        )
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS rentals(
            id SERIAL PRIMARY KEY,
            username TEXT,
            equipment_id INTEGER,
            days INTEGER,
            total REAL,
            status TEXT
        )
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS equipment(
            id SERIAL PRIMARY KEY,
            name TEXT,
            price REAL,
            is_active INTEGER DEFAULT 1
        )
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs(
            id SERIAL PRIMARY KEY,
            username TEXT,
            action TEXT,
            timestamp REAL
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()

# ====================== SECURITY =========================

def validate_password(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    if not re.search(r"[@$!%*?&]", password):
        return False, "Password must contain at least one special character (@$!%*?&)"
    return True, "Valid"

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def sanitize_input(text):
    if text is None:
        return ""
    return str(text).replace("<", "").replace(">", "").replace("/", "")

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

# JWT Authentication Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['username']
            current_role = data['role']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user, current_role, *args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, current_role, *args, **kwargs):
        if current_role != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return f(current_user, current_role, *args, **kwargs)
    return decorated

# Helper function for AI routes
def get_current_season():
    month = time.localtime().tm_mon
    if 2 <= month <= 5:
        return "Spring"
    elif 6 <= month <= 9:
        return "Monsoon"
    elif 10 <= month <= 11:
        return "Autumn"
    else:
        return "Winter"

# ==================== AI HELPER FUNCTIONS ==========================

def call_huggingface_api(prompt, max_length=300):
    try:
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

        print("Status:", response.status_code)
        print("Response:", response.text)

        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            return None

    except Exception as e:
        print("HF Exception:", str(e))
        return None

def parse_ai_recommendations(ai_text, equipment_list):
    try:
        recommendations = []
        
        priority = 1
        for eq in equipment_list[:3]:
            if eq['name'].lower() in ai_text.lower():
                recommendations.append({
                    "equipment": eq['name'],
                    "reason": f"Recommended for your farm based on requirements. Price: ₹{eq['price']}/day",
                    "priority": priority,
                    "estimatedDays": 3 if priority == 1 else 2
                })
                priority += 1
        
        if len(recommendations) == 0:
            for i, eq in enumerate(equipment_list[:3]):
                recommendations.append({
                    "equipment": eq['name'],
                    "reason": f"Suitable for your farming needs. Daily rate: ₹{eq['price']}",
                    "priority": i + 1,
                    "estimatedDays": 3 - i
                })
        
        total_cost = sum([eq['price'] * rec['estimatedDays'] 
                         for eq in equipment_list 
                         for rec in recommendations 
                         if eq['name'] == rec['equipment']])
        
        return {
            "recommendations": recommendations,
            "totalEstimatedCost": total_cost,
            "seasonalTips": "Consider weather conditions and soil preparation for best results.",
            "costAnalysis": f"Estimated total cost: ₹{total_cost}. Renting is cost-effective for seasonal farming."
        }
        
    except Exception as e:
        print(f"Parse error: {str(e)}")
        return None

# ==================== AUTH ROUTES ==========================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    name = sanitize_input(data.get('name'))
    username = sanitize_input(data.get('username'))
    password = data.get('password')
    role = data.get('role', 'customer')
    
    if not all([name, username, password]):
        return jsonify({'message': 'All fields are required'}), 400
    
    is_valid, message = validate_password(password)
    if not is_valid:
        return jsonify({'message': message}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT 1 FROM users WHERE username = %s", (username,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({'message': 'Username already exists'}), 400
    
    try:
        cur.execute(
            "INSERT INTO users (name, username, password, role) VALUES (%s, %s, %s, %s)",
            (name, username, hash_password(password), role)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        log_action(username, 'USER_REGISTERED')
        return jsonify({'message': 'Registration successful'}), 201
    except Exception as e:
        conn.close()
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not all([username, password]):
        return jsonify({'message': 'Username and password required'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "SELECT role, password, failed_attempts, lock_time, name FROM users WHERE username = %s",
        (username,)
    )
    
    row = cur.fetchone()
    
    if not row:
        conn.close()
        return jsonify({'message': 'Invalid credentials'}), 401
    
    role = row['role']
    db_pass = row['password']
    attempts = row['failed_attempts']
    lock_time = row['lock_time']
    name = row['name']
    
    if lock_time and time.time() < lock_time:
        conn.close()
        remaining = int(lock_time - time.time())
        return jsonify({'message': f'Account locked. Try again in {remaining} seconds'}), 423
    
    if db_pass == hash_password(password):
        cur.execute(
            "UPDATE users SET failed_attempts=0, lock_time=NULL WHERE username=%s",
            (username,)
        )
        conn.commit()
        conn.close()
        
        token = jwt.encode({
            'username': username,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        log_action(username, 'LOGIN_SUCCESS')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'role': role,
            'username': username,
            'name': name
        }), 200
    else:
        attempts += 1
        if attempts >= 3:
            lock_until = time.time() + 30
            cur.execute(
                "UPDATE users SET failed_attempts=%s, lock_time=%s WHERE username=%s",
                (attempts, lock_until, username)
            )
            conn.commit()
            conn.close()
            log_action(username, 'LOGIN_FAIL_LOCKED')
            return jsonify({'message': 'Account locked for 30 seconds due to multiple failed attempts'}), 423
        else:
            cur.execute(
                "UPDATE users SET failed_attempts=%s WHERE username=%s",
                (attempts, username)
            )
            conn.commit()
            conn.close()
            log_action(username, 'LOGIN_FAIL')
            return jsonify({'message': 'Invalid credentials'}), 401

# ==================== EQUIPMENT ROUTES ==========================

@app.route('/api/equipment', methods=['GET'])
@token_required
def get_equipment(current_user, current_role):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id, name, price, is_active FROM equipment WHERE is_active = 1")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    equipment = [dict(row) for row in rows]
    return jsonify(equipment), 200

@app.route('/api/equipment', methods=['POST'])
@token_required
@admin_required
def add_equipment(current_user, current_role):
    data = request.get_json()
    
    name = sanitize_input(data.get('name'))
    price = data.get('price')
    
    if not name or price is None:
        return jsonify({'message': 'Name and price are required'}), 400
    
    try:
        price = float(price)
        if price < 0:
            return jsonify({'message': 'Price must be positive'}), 400
    except ValueError:
        return jsonify({'message': 'Invalid price format'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "INSERT INTO equipment (name, price) VALUES (%s, %s) RETURNING id",
        (name, price)
    )
    
    conn.commit()
    equipment_id = cur.fetchone()['id']
    cur.close()
    conn.close()
    
    log_action(current_user, f'EQUIPMENT_ADDED: {name}')
    
    return jsonify({
        'message': 'Equipment added successfully',
        'id': equipment_id
    }), 201

@app.route('/api/equipment/<int:equipment_id>/deactivate', methods=['PUT'])
@token_required
@admin_required
def deactivate_equipment(current_user, current_role, equipment_id):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "UPDATE equipment SET is_active = 0 WHERE id = %s AND is_active = 1",
        (equipment_id,)
    )
    
    conn.commit()
    
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        return jsonify({'message': 'Equipment not found or already inactive'}), 404
    
    cur.close()
    conn.close()
    log_action(current_user, f'EQUIPMENT_DEACTIVATED: ID {equipment_id}')
    
    return jsonify({'message': 'Equipment deactivated successfully'}), 200

@app.route('/api/equipment/<int:equipment_id>/activate', methods=['PUT'])
@token_required
@admin_required
def activate_equipment(current_user, current_role, equipment_id):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "UPDATE equipment SET is_active = 1 WHERE id = %s AND is_active = 0",
        (equipment_id,)
    )
    
    conn.commit()
    
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        return jsonify({'message': 'Equipment not found or already active'}), 404
    
    cur.close()
    conn.close()
    log_action(current_user, f'EQUIPMENT_ACTIVATED: ID {equipment_id}')
    
    return jsonify({'message': 'Equipment activated successfully'}), 200

@app.route('/api/equipment/all', methods=['GET'])
@token_required
@admin_required
def get_all_equipment(current_user, current_role):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id, name, price, is_active FROM equipment")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    equipment = [dict(row) for row in rows]
    return jsonify(equipment), 200

# ==================== RENTAL ROUTES ==========================

@app.route('/api/rentals', methods=['POST'])
@token_required
def create_rental(current_user, current_role):
    data = request.get_json()
    
    equipment_id = data.get('equipment_id')
    days = data.get('days')
    
    if not equipment_id or not days:
        return jsonify({'message': 'Equipment ID and days are required'}), 400
    
    try:
        equipment_id = int(equipment_id)
        days = int(days)
        if days <= 0:
            return jsonify({'message': 'Days must be positive'}), 400
    except ValueError:
        return jsonify({'message': 'Invalid input format'}), 400
    
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT price, is_active FROM equipment WHERE id = %s", (equipment_id,))
    row = cur.fetchone()
    
    if not row:
        cur.close()
        conn.close()
        return jsonify({'message': 'Equipment not found'}), 404
    
    if not row['is_active']:
        cur.close()
        conn.close()
        return jsonify({'message': 'Equipment is not available'}), 400
    
    price = row['price']
    total = price * days
    
    cur.execute(
        "INSERT INTO rentals(username, equipment_id, days, total, status) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (current_user, equipment_id, days, total, 'rented')
    )
    
    conn.commit()
    rental_id = cur.fetchone()['id']
    cur.close()
    conn.close()
    
    log_action(current_user, f'RENT_EQUIPMENT: ID {equipment_id}')
    
    return jsonify({
        'message': 'Equipment rented successfully',
        'rental_id': rental_id,
        'total': total
    }), 201

@app.route('/api/rentals/my', methods=['GET'])
@token_required
def get_my_rentals(current_user, current_role):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            r.id,
            e.name as equipment_name,
            r.days,
            r.total,
            r.status
        FROM rentals r
        JOIN equipment e ON r.equipment_id = e.id
        WHERE r.username = %s
        ORDER BY r.id DESC
    """, (current_user,))
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    rentals = [dict(row) for row in rows]
    return jsonify(rentals), 200

@app.route('/api/rentals', methods=['GET'])
@token_required
@admin_required
def get_all_rentals(current_user, current_role):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            r.id,
            r.username,
            e.name as equipment_name,
            r.days,
            r.total,
            r.status
        FROM rentals r
        JOIN equipment e ON r.equipment_id = e.id
        ORDER BY r.id DESC
    """)
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    rentals = [dict(row) for row in rows]
    return jsonify(rentals), 200

@app.route('/api/rentals/<int:rental_id>/return', methods=['PUT'])
@token_required
def return_rental(current_user, current_role, rental_id):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "UPDATE rentals SET status = 'returned' WHERE id = %s AND username = %s AND status = 'rented'",
        (rental_id, current_user)
    )
    
    conn.commit()
    
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        return jsonify({'message': 'Rental not found or already returned'}), 404
    
    cur.close()
    conn.close()
    log_action(current_user, f'RETURN_EQUIPMENT: Rental ID {rental_id}')
    
    return jsonify({'message': 'Equipment returned successfully'}), 200

# ==================== REPORTS & AUDIT ==========================

@app.route('/api/reports/revenue', methods=['GET'])
@token_required
@admin_required
def get_revenue_report(current_user, current_role):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            e.name,
            SUM(r.total) as revenue,
            COUNT(r.id) as rental_count
        FROM rentals r
        JOIN equipment e ON r.equipment_id = e.id
        WHERE r.status = 'returned'
        GROUP BY e.name
        ORDER BY revenue DESC
    """)
    
    rows = cur.fetchall()
    
    report = [dict(row) for row in rows]
    
    cur.execute("""
        SELECT SUM(total) as grand_total
        FROM rentals
        WHERE status = 'returned'
    """)
    
    total_row = cur.fetchone()
    grand_total = total_row['grand_total'] if total_row['grand_total'] else 0
    
    cur.close()
    conn.close()
    
    return jsonify({
        'report': report,
        'grand_total': grand_total
    }), 200

@app.route('/api/audit-logs', methods=['GET'])
@token_required
@admin_required
def get_audit_logs(current_user, current_role):
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, username, action, timestamp
        FROM audit_logs
        ORDER BY timestamp DESC
        LIMIT 100
    """)
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    logs = []
    for row in rows:
        log_dict = dict(row)
        log_dict['readable_time'] = time.strftime(
            "%Y-%m-%d %H:%M:%S",
            time.localtime(log_dict['timestamp'])
        )
        logs.append(log_dict)
    
    return jsonify(logs), 200

# ==================== STATS ==========================

@app.route('/api/stats/dashboard', methods=['GET'])
@token_required
def get_dashboard_stats(current_user, current_role):
    conn = get_connection()
    cur = conn.cursor()
    
    stats = {}
    
    if current_role == 'admin':
        cur.execute("SELECT COUNT(*) as count FROM equipment WHERE is_active = 1")
        stats['total_equipment'] = cur.fetchone()['count']
        
        cur.execute("SELECT COUNT(*) as count FROM rentals WHERE status = 'rented'")
        stats['active_rentals'] = cur.fetchone()['count']
        
        cur.execute("SELECT SUM(total) as revenue FROM rentals WHERE status = 'returned'")
        revenue = cur.fetchone()['revenue']
        stats['total_revenue'] = revenue if revenue else 0
        
        cur.execute("SELECT COUNT(*) as count FROM users WHERE role = 'customer'")
        stats['total_customers'] = cur.fetchone()['count']
    else:
        cur.execute("SELECT COUNT(*) as count FROM rentals WHERE username = %s AND status = 'rented'", (current_user,))
        stats['active_rentals'] = cur.fetchone()['count']
        
        cur.execute("SELECT COUNT(*) as count FROM rentals WHERE username = %s", (current_user,))
        stats['total_rentals'] = cur.fetchone()['count']
        
        cur.execute("SELECT SUM(total) as spent FROM rentals WHERE username = %s", (current_user,))
        spent = cur.fetchone()['spent']
        stats['total_spent'] = spent if spent else 0
    
    cur.close()
    conn.close()
    return jsonify(stats), 200

# ==================== AI ROUTES ==========================

@app.route('/api/ai/recommend', methods=['POST'])
@token_required
def ai_recommend(current_user, current_role):
    try:
        data = request.get_json()
        
        farm_size = data.get('farmSize')
        crop_type = data.get('cropType')
        season = data.get('season')
        budget = data.get('budget')
        soil_type = data.get('soilType')
        
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name, price FROM equipment WHERE is_active = 1")
        equipment = cur.fetchall()
        cur.close()
        conn.close()
        
        equipment_list = [dict(eq) for eq in equipment]
        equipment_text = "\n".join([f"- {eq['name']}: ₹{eq['price']}/day" for eq in equipment_list])
        
        prompt = f"""You are an agricultural equipment expert. Recommend farming equipment for:

Farm: {farm_size} acres
Crop: {crop_type}
Season: {season}
Budget: ₹{budget}/day
Soil: {soil_type}

Available Equipment:
{equipment_text}

Recommend the top 3 most suitable equipment with brief reasons."""

        ai_response = call_huggingface_api(prompt, max_length=500)
        
        if ai_response:
            result = parse_ai_recommendations(ai_response, equipment_list)
            
            if result:
                log_action(current_user, 'AI_RECOMMENDATION_REQUESTED')
                return jsonify(result), 200
            else:
                return jsonify({'error': 'Failed to parse AI response'}), 500
        else:
            return jsonify({'error': 'AI service temporarily unavailable'}), 503
            
    except Exception as e:
        print(f"AI Recommendation Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai/chat', methods=['POST'])
@token_required
def ai_chat(current_user, current_role):
    try:
        data = request.get_json()
        question = data.get('question')
        
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT name, price FROM equipment WHERE is_active = 1")
        equipment = cur.fetchall()
        cur.close()
        conn.close()
        
        equipment_list = ", ".join([eq['name'] for eq in equipment])
        
        prompt = f"""You are AgriBot, a farming equipment rental assistant.

Available Equipment: {equipment_list}
Season: {get_current_season()}

Question: {question}

Provide a helpful, concise answer (under 150 words) about farming equipment."""

        ai_response = call_huggingface_api(prompt, max_length=300)
        
        if ai_response:
            if prompt in ai_response:
                ai_response = ai_response.replace(prompt, "").strip()
            
            log_action(current_user, 'AI_CHAT_QUERY')
            return jsonify({
                'response': ai_response if ai_response else "I'm here to help with farming equipment questions!",
                'timestamp': time.time()
            }), 200
        else:
            return jsonify({
                'response': "I'm temporarily unavailable. Please try again in a moment.",
                'timestamp': time.time()
            }), 200
            
    except Exception as e:
        print(f"AI Chat Error: {str(e)}")
        return jsonify({
            'response': "I'm having trouble right now. Please try again.",
            'timestamp': time.time()
        }), 200


@app.route('/api/ai/contract', methods=['POST'])
@token_required
def ai_generate_contract(current_user, current_role):
    try:
        data = request.get_json()
        
        customer_name = data.get('customerName')
        equipment_name = data.get('equipmentName')
        days = data.get('days')
        start_date = data.get('startDate')
        daily_rate = data.get('dailyRate')
        total_cost = data.get('totalCost')
        deposit = data.get('deposit', total_cost * 0.2 if total_cost else 0)
        
        contract_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1 {{ color: #2c3e50; text-align: center; }}
        h2 {{ color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 5px; }}
        .section {{ margin: 20px 0; }}
        .detail {{ margin: 10px 0; }}
        .signature {{ margin-top: 50px; display: flex; justify-content: space-between; }}
    </style>
</head>
<body>
    <h1>FARMING EQUIPMENT RENTAL AGREEMENT</h1>
    
    <div class="section">
        <h2>RENTAL DETAILS</h2>
        <div class="detail"><strong>Customer Name:</strong> {customer_name}</div>
        <div class="detail"><strong>Equipment:</strong> {equipment_name}</div>
        <div class="detail"><strong>Rental Period:</strong> {days} days</div>
        <div class="detail"><strong>Start Date:</strong> {start_date}</div>
        <div class="detail"><strong>Daily Rate:</strong> ₹{daily_rate}</div>
        <div class="detail"><strong>Total Cost:</strong> ₹{total_cost}</div>
        <div class="detail"><strong>Security Deposit:</strong> ₹{deposit}</div>
    </div>
    
    <div class="section">
        <h2>TERMS AND CONDITIONS</h2>
        <ol>
            <li><strong>Equipment Condition:</strong> The equipment is rented in good working condition.</li>
            <li><strong>Usage:</strong> Equipment to be used only for agricultural purposes.</li>
            <li><strong>Liability:</strong> The renter is responsible for any damage during rental period.</li>
            <li><strong>Payment:</strong> Payment must be made in full before equipment pickup.</li>
            <li><strong>Return:</strong> Equipment must be returned by 6 PM on the final rental day.</li>
            <li><strong>Cancellation:</strong> Cancellations made less than 24 hours before pickup forfeit the security deposit.</li>
        </ol>
    </div>
    
    <div class="signature">
        <div>
            <p>________________________</p>
            <p>Lessor Signature & Date</p>
        </div>
        <div>
            <p>________________________</p>
            <p>Lessee Signature & Date</p>
        </div>
    </div>
</body>
</html>
"""
        
        log_action(current_user, 'AI_CONTRACT_GENERATED')
        return jsonify({
            'contractHtml': contract_html,
            'generatedAt': time.time()
        }), 200
            
    except Exception as e:
        print(f"Contract Generation Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== MAIN ==========================

setup_db()
if __name__ == '__main__':
    print("=" * 50)
    print("🚀 AgriRent Pro - PostgreSQL Edition")
    print("=" * 50)
    print("✅ Using PostgreSQL Database")
    print("✅ Using Hugging Face API (FREE!)")
    print("=" * 50)
    app.run(debug=True, port=5000, host="0.0.0.0")
