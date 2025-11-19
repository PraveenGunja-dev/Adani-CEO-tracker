import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import get_db_connection
import json
import sqlite3

def test_db_connection():
    try:
        conn = get_db_connection()
        print("Database connection successful")
        
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Test the specific query
        fiscalYear = "FY_23"
        cursor.execute('SELECT * FROM table_data WHERE fiscal_year = ? AND is_deleted = 0', (fiscalYear,))
        row = cursor.fetchone()
        
        if row:
            print(f"Found data for {fiscalYear}")
            print(f"Row keys: {row.keys()}")
            data = json.loads(row['data'])
            print(f"Data parsed successfully, contains {len(data)} items")
        else:
            print(f"No data found for {fiscalYear}")
            
        conn.close()
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_db_connection()