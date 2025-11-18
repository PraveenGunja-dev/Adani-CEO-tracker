import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/sqlite-adapter';
import { db } from '@/lib/sqlite';

// GET /api/backup-data?fiscalYear=xxx - Get backup data for a specific fiscal year
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25';
    
    // Get all versions of data for the fiscal year
    const stmt = db.prepare(`
      SELECT id, fiscal_year, data, version, is_deleted, created_at, updated_at 
      FROM table_data 
      WHERE fiscal_year = ? 
      ORDER BY version DESC
    `);
    const results: any[] = stmt.all(fiscalYear);
    
    // Parse JSON data
    const backups = results.map(row => ({
      ...row,
      data: JSON.parse(row.data)
    }));
    
    return NextResponse.json(
      { 
        fiscalYear,
        backups,
        count: backups.length
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting backup data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/backup-data/restore - Restore data from a specific version
export async function POST(request: Request) {
  try {
    const { fiscalYear, version } = await request.json();
    
    if (!fiscalYear || !version) {
      return NextResponse.json(
        { error: 'fiscalYear and version are required' },
        { status: 400 }
      );
    }
    
    // Get the specific version of data
    const stmt = db.prepare(`
      SELECT data 
      FROM table_data 
      WHERE fiscal_year = ? AND version = ?
    `);
    const result: any = stmt.get(fiscalYear, version);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      );
    }
    
    // Restore the data by updating the current version
    const { db: mongoDb } = await connectToDatabase();
    const restoreResult = await mongoDb.collection('tableData').updateOne(
      { fiscalYear },
      { 
        $set: { 
          fiscalYear,
          data: JSON.parse(result.data),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    return NextResponse.json(
      { message: 'Data restored successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error restoring backup data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/backup-data?fiscalYear=xxx&version=xxx - Delete a specific backup version
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear');
    const version = searchParams.get('version');
    
    if (!fiscalYear || !version) {
      return NextResponse.json(
        { error: 'fiscalYear and version are required' },
        { status: 400 }
      );
    }
    
    // Hard delete a specific version (only for backups)
    const stmt = db.prepare(`
      DELETE FROM table_data 
      WHERE fiscal_year = ? AND version = ? AND is_deleted = TRUE
    `);
    const result = stmt.run(fiscalYear, version);
    
    if (result.changes > 0) {
      return NextResponse.json(
        { message: 'Backup version deleted successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Backup version not found or not deleted' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting backup data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}