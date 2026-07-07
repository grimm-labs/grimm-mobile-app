import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'grimm-local.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transaction_notes (
      transaction_key TEXT PRIMARY KEY NOT NULL,
      note TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}

export async function getAppDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await initSchema(db);
      return db;
    })();
  }

  return dbPromise;
}

export async function resetAppDatabase(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      await db.closeAsync();
    } catch (error) {
      console.error('[AppDatabase] Failed to close database:', error);
    }
  }

  dbPromise = null;

  try {
    await SQLite.deleteDatabaseAsync(DATABASE_NAME);
  } catch (error) {
    console.error('[AppDatabase] Failed to delete database:', error);
  }
}
