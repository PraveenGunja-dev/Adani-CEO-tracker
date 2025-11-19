import sqlite3
import json

# Connect to the database
conn = sqlite3.connect('data/adani-excel.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Get all table_data records
cursor.execute('SELECT * FROM table_data')
rows = cursor.fetchall()

print("Table data records:")
for row in rows:
    print(f"ID: {row['id']}")
    print(f"Fiscal Year: {row['fiscal_year']}")
    print(f"Version: {row['version']}")
    print(f"Is Deleted: {row['is_deleted']}")
    print(f"Created At: {row['created_at']}")
    print(f"Updated At: {row['updated_at']}")
    print(f"Data (first 100 chars): {row['data'][:100]}...")
    try:
        data = json.loads(row['data'])
        print(f"Data parsed successfully, contains {len(data)} items")
    except Exception as e:
        print(f"Error parsing data as JSON: {e}")
    print("-" * 50)

conn.close()
