import sqlite3
import os

# Database path
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
DB_PATH = os.path.join(DB_DIR, 'adani-excel.db')

print(f"Database path: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute('SELECT * FROM users')
users = cursor.fetchall()

print('Users in database:')
for user in users:
    print(user)

conn.close()