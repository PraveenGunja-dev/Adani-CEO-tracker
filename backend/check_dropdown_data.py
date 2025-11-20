import sqlite3
import os

# Database path
DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
DB_PATH = os.path.join(DB_DIR, 'adani-excel.db')

print(f"Database path: {DB_PATH}")

# Connect to database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check all dropdown options
print("\n=== All Dropdown Options ===")
cursor.execute('SELECT option_type, option_value FROM dropdown_options WHERE is_deleted = 0 ORDER BY option_type, option_value')
rows = cursor.fetchall()

options_by_type = {}
for row in rows:
    option_type, option_value = row
    if option_type not in options_by_type:
        options_by_type[option_type] = []
    options_by_type[option_type].append(option_value)

for option_type, values in options_by_type.items():
    print(f"\n{option_type}:")
    for value in values:
        print(f"  - {value}")

# Check specifically for locations and connectivities
print("\n=== Locations ===")
cursor.execute("SELECT option_value FROM dropdown_options WHERE option_type = 'locations' AND is_deleted = 0")
locations = cursor.fetchall()
for location in locations:
    print(f"  - {location[0]}")

print("\n=== Connectivities ===")
cursor.execute("SELECT option_value FROM dropdown_options WHERE option_type = 'connectivities' AND is_deleted = 0")
connectivities = cursor.fetchall()
for connectivity in connectivities:
    print(f"  - {connectivity[0]}")

conn.close()

print("\nCheck completed!")