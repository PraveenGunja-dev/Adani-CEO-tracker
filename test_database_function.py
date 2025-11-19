import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Test the database function directly
try:
    from backend.database import get_db_connection
    import sqlite3
    import json
    
    def test_function():
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        fiscalYear = "FY_23"
        cursor.execute('SELECT * FROM table_data WHERE fiscal_year = ? AND is_deleted = 0', (fiscalYear,))
        row = cursor.fetchone()
        
        if row:
            data = json.loads(row['data'])
            result = {"data": data}
        else:
            result = {"data": []}
            
        conn.close()
        return result
    
    result = test_function()
    print(f"Result: {result}")
    print(f"Data length: {len(result['data'])}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()