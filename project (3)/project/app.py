#!/usr/bin/env python3
"""
НАЕ-банк - Backend API
Платёжная система с поддержкой СБП и криптовалют
"""

from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import sqlite3
import hashlib
import jwt
import datetime
import os
import requests
import json
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'nae-bank-secret-key-2024'
CORS(app)

# Database initialization
def init_db():
    conn = sqlite3.connect('nae_bank.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            telegram_id TEXT,
            balance REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            status TEXT DEFAULT 'active'
        )
    ''')
    
    # Transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'RUB',
            status TEXT DEFAULT 'pending',
            payment_method TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Payment methods table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payment_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            type TEXT NOT NULL,
            details TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# Routes
@app.route('/')
def index():
    return render_template_string(open('index.html').read())

@app.route('/api/auth/telegram', methods=['POST'])
def telegram_auth():
    """Authenticate user via Telegram"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    conn = sqlite3.connect('nae_bank.db')
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    
    if not user:
        # Create new user
        cursor.execute('''
            INSERT INTO users (email, last_login) 
            VALUES (?, ?)
        ''', (email, datetime.datetime.now()))
        user_id = cursor.lastrowid
    else:
        user_id = user[0]
        # Update last login
        cursor.execute('''
            UPDATE users SET last_login = ? WHERE id = ?
        ''', (datetime.datetime.now(), user_id))
    
    conn.commit()
    conn.close()
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user_id,
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user_id': user_id,
        'email': email,
        'message': 'Authentication successful'
    })

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Get user profile"""
    conn = sqlite3.connect('nae_bank.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (current_user_id,))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    conn.close()
    
    return jsonify({
        'id': user[0],
        'email': user[1],
        'balance': user[3],
        'created_at': user[4],
        'last_login': user[5],
        'status': user[6]
    })

@app.route('/api/transactions', methods=['GET'])
@token_required
def get_transactions(current_user_id):
    """Get user transactions"""
    period = request.args.get('period', '30d')
    
    # Calculate date range based on period
    now = datetime.datetime.now()
    if period == '24h':
        start_date = now - datetime.timedelta(hours=24)
    elif period == '7d':
        start_date = now - datetime.timedelta(days=7)
    elif period == '30d':
        start_date = now - datetime.timedelta(days=30)
    elif period == '90d':
        start_date = now - datetime.timedelta(days=90)
    elif period == '1y':
        start_date = now - datetime.timedelta(days=365)
    else:
        start_date = now - datetime.timedelta(days=30)
    
    conn = sqlite3.connect('nae_bank.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM transactions 
        WHERE user_id = ? AND created_at >= ? 
        ORDER BY created_at DESC
    ''', (current_user_id, start_date))
    
    transactions = cursor.fetchall()
    conn.close()
    
    result = []
    for tx in transactions:
        result.append({
            'id': tx[0],
            'type': tx[2],
            'amount': tx[3],
            'currency': tx[4],
            'status': tx[5],
            'payment_method': tx[6],
            'description': tx[7],
            'created_at': tx[8],
            'updated_at': tx[9]
        })
    
    return jsonify(result)

@app.route('/api/transactions/create', methods=['POST'])
@token_required
def create_transaction(current_user_id):
    """Create new transaction"""
    data = request.get_json()
    
    required_fields = ['type', 'amount', 'payment_method']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    conn = sqlite3.connect('nae_bank.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO transactions (user_id, type, amount, currency, payment_method, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        current_user_id,
        data['type'],
        data['amount'],
        data.get('currency', 'RUB'),
        data['payment_method'],
        data.get('description', '')
    ))
    
    transaction_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'transaction_id': transaction_id,
        'message': 'Transaction created successfully'
    })

@app.route('/api/stats', methods=['GET'])
@token_required
def get_stats(current_user_id):
    """Get user statistics"""
    period = request.args.get('period', '30d')
    
    # Calculate date range
    now = datetime.datetime.now()
    if period == '24h':
        start_date = now - datetime.timedelta(hours=24)
    elif period == '7d':
        start_date = now - datetime.timedelta(days=7)
    elif period == '30d':
        start_date = now - datetime.timedelta(days=30)
    elif period == '90d':
        start_date = now - datetime.timedelta(days=90)
    elif period == '1y':
        start_date = now - datetime.timedelta(days=365)
    else:
        start_date = now - datetime.timedelta(days=30)
    
    conn = sqlite3.connect('nae_bank.db')
    cursor = conn.cursor()
    
    # Get user balance
    cursor.execute('SELECT balance FROM users WHERE id = ?', (current_user_id,))
    balance = cursor.fetchone()[0]
    
    # Get transaction count
    cursor.execute('''
        SELECT COUNT(*) FROM transactions 
        WHERE user_id = ? AND created_at >= ?
    ''', (current_user_id, start_date))
    transaction_count = cursor.fetchone()[0]
    
    # Get income/outcome
    cursor.execute('''
        SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'outcome' THEN amount ELSE 0 END) as outcome
        FROM transactions 
        WHERE user_id = ? AND created_at >= ?
    ''', (current_user_id, start_date))
    
    income_outcome = cursor.fetchone()
    income = income_outcome[0] or 0
    outcome = income_outcome[1] or 0
    
    # Get success rate
    cursor.execute('''
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM transactions 
        WHERE user_id = ? AND created_at >= ?
    ''', (current_user_id, start_date))
    
    success_data = cursor.fetchone()
    total_tx = success_data[0]
    completed_tx = success_data[1]
    success_rate = (completed_tx / total_tx * 100) if total_tx > 0 else 0
    
    conn.close()
    
    return jsonify({
        'balance': balance,
        'transactions': transaction_count,
        'income': income,
        'outcome': outcome,
        'success_rate': round(success_rate, 1),
        'period': period
    })

@app.route('/api/payment/sbp', methods=['POST'])
@token_required
def process_sbp_payment(current_user_id):
    """Process SBP payment"""
    data = request.get_json()
    
    # Simulate SBP payment processing
    amount = data.get('amount')
    phone = data.get('phone')
    
    if not amount or not phone:
        return jsonify({'error': 'Amount and phone are required'}), 400
    
    # Create transaction record
    conn = sqlite3.connect('nae_bank.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO transactions (user_id, type, amount, payment_method, description, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (current_user_id, 'outcome', amount, 'SBP', f'Transfer to {phone}', 'completed'))
    
    # Update user balance
    cursor.execute('''
        UPDATE users SET balance = balance - ? WHERE id = ?
    ''', (amount, current_user_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'SBP payment processed successfully',
        'amount': amount,
        'recipient': phone
    })

@app.route('/api/payment/crypto', methods=['POST'])
@token_required
def process_crypto_payment(current_user_id):
    """Process cryptocurrency payment"""
    data = request.get_json()
    
    # Simulate crypto payment processing
    amount = data.get('amount')
    currency = data.get('currency')
    address = data.get('address')
    
    if not all([amount, currency, address]):
        return jsonify({'error': 'Amount, currency and address are required'}), 400
    
    # Create transaction record
    conn = sqlite3.connect('nae_bank.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO transactions (user_id, type, amount, currency, payment_method, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (current_user_id, 'outcome', amount, currency, 'CRYPTO', f'Transfer to {address}', 'pending'))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Crypto payment initiated',
        'amount': amount,
        'currency': currency,
        'address': address,
        'status': 'pending'
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)