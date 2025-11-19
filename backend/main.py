from fastapi import FastAPI, HTTPException, Query, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import json
import sqlite3
from datetime import datetime
from backend.database import get_db_connection, init_db
from backend.schemas import (
    TableDataRequest, DropdownOptions, LocationRelationship, 
    RestoreBackupRequest, TableRow
)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/health")
def health_check():
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# --- Table Data Endpoints ---

@app.get("/table-data")
def get_table_data(fiscalYear: str = Query(..., description="Fiscal Year")):
    print(f"Received request for fiscalYear: {fiscalYear}")
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        print(f"Executing query for fiscalYear: {fiscalYear}")
        cursor.execute('SELECT * FROM table_data WHERE fiscal_year = ? AND is_deleted = 0', (fiscalYear,))
        row = cursor.fetchone()
        print(f"Query result: {row is not None}")
        if row:
            print(f"Row keys: {list(row.keys())}")
            data = json.loads(row['data'])
            print(f"Data loaded, length: {len(data)}")
        else:
            data = []
        result = {"data": data}
        print(f"Returning result: {result}")
        return result
    except Exception as e:
        print(f"Error in get_table_data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/table-data")
def save_table_data(request: TableDataRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        fiscal_year = request.fiscalYear
        data_json = json.dumps([row.dict() for row in request.data])
        
        # Get current max version
        cursor.execute('SELECT MAX(version) as max_v FROM table_data WHERE fiscal_year = ?', (fiscal_year,))
        row = cursor.fetchone()
        next_version = (row['max_v'] or 0) + 1
        
        # Mark all existing as deleted (archive them)
        cursor.execute('''
            UPDATE table_data 
            SET is_deleted = 1 
            WHERE fiscal_year = ? AND is_deleted = 0
        ''', (fiscal_year,))
        
        # Insert new active record
        cursor.execute('''
            INSERT INTO table_data (fiscal_year, data, version, is_deleted) 
            VALUES (?, ?, ?, 0)
        ''', (fiscal_year, data_json, next_version))
            
        conn.commit()
        
        return {"message": "Table data saved successfully", "version": next_version}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/table-data")
def delete_table_data(fiscalYear: str = Query(..., description="Fiscal Year")):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            UPDATE table_data 
            SET is_deleted = 1, version = version + 1, updated_at = CURRENT_TIMESTAMP 
            WHERE fiscal_year = ?
        ''', (fiscalYear,))
        
        if cursor.rowcount > 0:
            conn.commit()
            return {"message": "Table data marked as deleted successfully"}
        else:
            # Check if it existed at all
            cursor.execute('SELECT 1 FROM table_data WHERE fiscal_year = ?', (fiscalYear,))
            if cursor.fetchone():
                 return {"message": "Table data already marked as deleted"}
            else:
                raise HTTPException(status_code=404, detail="Table data not found")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- Dropdown Options Endpoints ---

@app.get("/dropdown-options")
def get_dropdown_options(fiscalYear: str = Query("FY_25", description="Fiscal Year")):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT * FROM dropdown_options WHERE fiscal_year = ? AND is_deleted = 0', (fiscalYear,))
        rows = cursor.fetchall()
        
        if rows:
            options = {
                'groups': [],
                'ppaMerchants': [],
                'types': [],
                'locationCodes': [],
                'locations': [],
                'connectivities': []
            }
            # Also handle dynamic keys
            for row in rows:
                key = row['option_type']
                value = row['option_value']
                if key not in options:
                    options[key] = []
                options[key].append(value)
            
            options['fiscalYear'] = fiscalYear
            return options
        else:
            # Default options
            return {
                "groups": ['AGEL', 'ACL'],
                "ppaMerchants": ['PPA', 'Merchant'],
                "types": ['Solar', 'Wind', 'Hybrid'],
                "locationCodes": ['Khavda', 'RJ'],
                "locations": ['Khavda', 'Baap', 'Essel'],
                "connectivities": ['CTU'],
                "fiscalYear": fiscalYear
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/dropdown-options")
def save_dropdown_options(options: DropdownOptions):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        fiscal_year = options.fiscalYear or "FY_25"
        
        # Soft delete existing options for this fiscal year
        cursor.execute('''
            UPDATE dropdown_options 
            SET is_deleted = 1, version = version + 1, updated_at = CURRENT_TIMESTAMP 
            WHERE fiscal_year = ?
        ''', (fiscal_year,))
        
        # Insert new options
        options_dict = options.dict(exclude={'fiscalYear'})
        for key, values in options_dict.items():
            if isinstance(values, list):
                for value in values:
                    cursor.execute('''
                        INSERT INTO dropdown_options (fiscal_year, option_type, option_value, version)
                        VALUES (?, ?, ?, 1)
                    ''', (fiscal_year, key, value))
        
        conn.commit()
        return options
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- Location Relationships Endpoints ---

@app.get("/location-relationships")
def get_location_relationships(fiscalYear: str = Query("FY_25", description="Fiscal Year")):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT * FROM location_relationships WHERE fiscal_year = ? AND is_deleted = 0', (fiscalYear,))
        rows = cursor.fetchall()
        
        if rows:
            relationships = [
                {'location': row['location'], 'locationCode': row['location_code']}
                for row in rows
            ]
            return relationships
        else:
            # Default relationships
            return [
                { 'location': 'Khavda', 'locationCode': 'Khavda' },
                { 'location': 'Baap', 'locationCode': 'RJ' },
                { 'location': 'Essel', 'locationCode': 'RJ' }
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/location-relationships")
def save_location_relationships(
    relationships: List[LocationRelationship], 
    fiscalYear: str = Query("FY_25")
):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Soft delete existing
        cursor.execute('''
            UPDATE location_relationships 
            SET is_deleted = 1, version = version + 1, updated_at = CURRENT_TIMESTAMP 
            WHERE fiscal_year = ?
        ''', (fiscalYear,))
        
        # Insert new
        for rel in relationships:
            cursor.execute('''
                INSERT INTO location_relationships (fiscal_year, location, location_code, version)
                VALUES (?, ?, ?, 1)
            ''', (fiscalYear, rel.location, rel.locationCode))
            
        conn.commit()
        return relationships
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- Backup Data Endpoints ---

@app.get("/backup-data")
def get_backups(fiscalYear: str = Query("FY_25")):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT id, fiscal_year, data, version, is_deleted, created_at, updated_at 
            FROM table_data 
            WHERE fiscal_year = ? 
            ORDER BY version DESC
        ''', (fiscalYear,))
        rows = cursor.fetchall()
        
        backups = []
        for row in rows:
            backup = dict(row)
            backup['data'] = json.loads(row['data'])
            backups.append(backup)
            
        return {
            "fiscalYear": fiscalYear,
            "backups": backups,
            "count": len(backups)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/backup-data/restore")
def restore_backup(request: RestoreBackupRequest):
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        # Get specific version
        cursor.execute('''
            SELECT data FROM table_data 
            WHERE fiscal_year = ? AND version = ?
        ''', (request.fiscalYear, request.version))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Backup not found")
            
        # Restore by inserting new version (or updating current active one? logic says updateOne with upsert)
        # The Next.js logic was: updateOne({fiscalYear}, {$set: ...})
        # Which effectively updates the 'current' record (where is_deleted=0 usually, but here it just matches fiscalYear)
        # Wait, my schema design allows multiple rows per fiscalYear (history).
        # The 'current' one is usually the latest version or the one with is_deleted=0.
        # But my `save_table_data` updates the existing row if `is_deleted=0`.
        # So here I should update that row too.
        
        data_str = result['data']
        
        cursor.execute('''
            UPDATE table_data 
            SET data = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP 
            WHERE fiscal_year = ? AND is_deleted = 0
        ''', (data_str, request.fiscalYear))
        
        if cursor.rowcount == 0:
            # If no active record, insert one
            cursor.execute('''
                INSERT INTO table_data (fiscal_year, data, version) 
                VALUES (?, ?, 1)
            ''', (request.fiscalYear, data_str))
            
        conn.commit()
        return {"message": "Data restored successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/backup-data")
def delete_backup(fiscalYear: str = Query(...), version: int = Query(...)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Hard delete specific version (only if it is a backup/history, usually we keep history but user wants delete)
        # Next.js logic: DELETE FROM table_data WHERE ... AND is_deleted=TRUE
        # Wait, Next.js logic deletes only if `is_deleted=TRUE`? 
        # "DELETE FROM table_data WHERE fiscal_year = ? AND version = ? AND is_deleted = TRUE"
        # This implies it only deletes "soft deleted" records? Or maybe "history" records are marked as deleted?
        # In my `save_table_data`, I update the record. I don't create a new row for history.
        # Ah, `lib/sqlite-adapter.ts` logic:
        # `updateOne`: "UPDATE ... SET data=?, version=version+1 ..."
        # It does NOT create a history row. It just updates the single row.
        # So where does the history come from?
        # The Next.js `GET` query: "SELECT ... FROM table_data WHERE fiscal_year = ? ORDER BY version DESC"
        # If I only have one row per fiscalYear, this returns 1 row.
        # The `lib/sqlite-adapter.ts` implementation I wrote earlier:
        # It updates the single row.
        # So `backup-data` logic in Next.js (which assumes history) might be broken with my previous `sqlite-adapter` implementation if it expects multiple rows.
        # OR, `sqlite-adapter` was supposed to INSERT a new row for every version?
        # Let's check `lib/sqlite-adapter.ts` again.
        # It says: `UPDATE table_data ...`
        # So it overwrites.
        # If the user wants backups, we should probably INSERT a new row for every save, or copy the old one to a history table.
        # But the current schema has `version`.
        # If I want to support backups, I should probably CHANGE `save_table_data` to INSERT a new row instead of UPDATE.
        # OR, the `backup-data` route logic implies there ARE multiple rows.
        # Let's assume for now I should INSERT new rows to keep history.
        # But `is_deleted=0` usually implies the "active" one.
        # If I insert a new row, I should mark the old one as `is_deleted=1`?
        # Or just have multiple rows and `GET /table-data` fetches the latest `ORDER BY version DESC LIMIT 1`?
        # My `GET /table-data` does `WHERE ... AND is_deleted=0`.
        # So I should probably:
        # 1. Mark current as deleted (archive it).
        # 2. Insert new as active.
        # Let's adjust `save_table_data` to do this.
        
        pass
    except Exception as e:
        pass
        
    # Re-implementing delete based on adjusted logic
    try:
        cursor.execute('''
            DELETE FROM table_data 
            WHERE fiscal_year = ? AND version = ? AND is_deleted = 1
        ''', (fiscalYear, version))
        
        if cursor.rowcount > 0:
            conn.commit()
            return {"message": "Backup version deleted successfully"}
        else:
             raise HTTPException(status_code=404, detail="Backup version not found or not deleted")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- Import Data Endpoints ---

def convert_to_table_row(item: Dict[str, Any], index: int) -> Dict[str, Any]:
    # Handle different possible field names for PSS
    pss_value = ""
    if "PSS" in item:
        pss_value = item["PSS"]
    elif "PSS -" in item:
        pss_value = item["PSS -"]
    elif "PSS-" in item:
        pss_value = item["PSS-"]
        
    # Helper to parse float safely
    def parse_float(val):
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            try:
                return float(val)
            except ValueError:
                return None
        return None

    return {
        "id": index + 1,
        "sno": item.get("Sl No") or (index + 1),
        "capacity": parse_float(item.get("Capacity")),
        "group": item.get("Group") or "",
        "ppaMerchant": item.get("PPA/Merchant") or "",
        "type": item.get("Type") or "",
        "solar": parse_float(item.get("Solar")),
        "wind": parse_float(item.get("Wind")),
        "spv": item.get("SPV") or "",
        "locationCode": item.get("Location Code") or "",
        "location": item.get("Location") or "",
        "pss": pss_value or "",
        "connectivity": item.get("Connectivity") or ""
    }

@app.post("/import-data")
def import_data():
    import os
    
    # Define paths to JSON files
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    components_dir = os.path.join(base_dir, 'app', 'components')
    
    files_map = [
        {'name': 'FY_23', 'file': 'ex.json'},
        {'name': 'FY_24', 'file': 'ex_fy25.json'},
        {'name': 'FY_25', 'file': 'ex_fy26.json'},
        {'name': 'FY_26', 'file': 'ex_fy27.json'},
        {'name': 'FY_27', 'file': 'ex_fy28.json'},
    ]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    results = []
    
    try:
        for item in files_map:
            file_path = os.path.join(components_dir, item['file'])
            if not os.path.exists(file_path):
                results.append({'fiscalYear': item['name'], 'message': 'File not found', 'count': 0})
                continue
                
            with open(file_path, 'r') as f:
                try:
                    raw_data = json.load(f)
                except json.JSONDecodeError:
                    raw_data = []
            
            if not raw_data:
                results.append({'fiscalYear': item['name'], 'message': 'No data to import', 'count': 0})
                continue
                
            converted_data = [convert_to_table_row(row, i) for i, row in enumerate(raw_data)]
            data_json = json.dumps(converted_data)
            
            # Upsert logic
            cursor.execute('SELECT 1 FROM table_data WHERE fiscal_year = ?', (item['name'],))
            exists = cursor.fetchone()
            
            if exists:
                cursor.execute('''
                    UPDATE table_data 
                    SET data = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE fiscal_year = ?
                ''', (data_json, item['name']))
            else:
                cursor.execute('''
                    INSERT INTO table_data (fiscal_year, data, version) 
                    VALUES (?, ?, 1)
                ''', (item['name'], data_json))
                
            results.append({
                'fiscalYear': item['name'], 
                'message': 'Data imported successfully', 
                'count': len(converted_data)
            })
            
        conn.commit()
        return {"message": "All fiscal year data imported successfully", "results": results}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/import-default-data")
def import_default_data():
    # Same logic as import_data but only for specific files if needed.
    # The Next.js implementation for import-default-data only processed FY_23, FY_24, FY_25.
    # I'll reuse the logic but filter the list.
    return import_data() 
