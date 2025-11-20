import sqlite3
import os

# Database path
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
DB_PATH = os.path.join(DB_DIR, 'adani-excel.db')

print(f"Database path: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# First, let's see all users in the database
cursor.execute('SELECT * FROM users')
users = cursor.fetchall()

print('Users in database before deletion:')
for user in users:
    print(user)

# Delete all users except the admin user with email 'admin@adani.com'
cursor.execute("DELETE FROM users WHERE email != 'admin@adani.com'")

# Commit the changes
conn.commit()

# Check the remaining users
cursor.execute('SELECT * FROM users')
remaining_users = cursor.fetchall()

print('\nUsers in database after deletion:')
for user in remaining_users:
    print(user)

# Get the count of deleted users
deleted_count = cursor.rowcount
print(f'\nDeleted {deleted_count} users')

conn.close()

print('\nOperation completed successfully!')