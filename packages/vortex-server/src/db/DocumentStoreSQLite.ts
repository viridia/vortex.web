import Database from 'better-sqlite3';
import DocumentStore, { Document, DocumentListEntry, GraphData } from './DocumentStore';
import path from 'path';

const DB_FILE = process.env.SQLITE_DB_FILE || 'data/vortex.db';
const DB_NAME = process.env.SQLITE_DB_NAME || 'Documents';

export class DocumentStoreSQLite implements DocumentStore {
  private db = new Database(path.resolve(__dirname, '../..', DB_FILE));

  public constructor() {
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS ${DB_NAME} (
      id integer PRIMARY KEY AUTOINCREMENT,
      creator text NOT NULL,
      creatorName text NOT NULL,
      created text NOT NULL,
      updated text NOT NULL,
      data text NOT NULL
    )`
      )
      .run();
  }

  public listDocuments(user: string): Promise<DocumentListEntry[]> {
    const docs = this.db.prepare(`SELECT * from ${DB_NAME}`).all();
    docs.forEach(doc => {
      const data = JSON.parse(doc.data);
      doc.name = data?.name;
    })
    return Promise.resolve(docs);
  }

  public getDocument(id: string): Promise<Document> {
    const doc = this.db.prepare(`SELECT * from ${DB_NAME} WHERE id = ?`).get(id);
    if (!doc) {
      return Promise.resolve(null);
    }
    doc.data = JSON.parse(doc.data);
    return Promise.resolve(doc);
  }

  public createDocument(data: GraphData, user: string, userName: string): Promise<string> {
    const now = new Date();
    const stmt = this.db.prepare(
      `INSERT INTO ${DB_NAME} (creator, creatorName, created, updated, data)
      VALUES ($creator, $creatorName, $created, $updated, $data)`
    );
    const info = stmt.run({
      creator: user,
      creatorName: userName,
      created: now.toISOString(),
      updated: now.toISOString(),
      data: JSON.stringify(data),
    });
    return Promise.resolve(String(info.lastInsertRowid));
  }

  public updateDocument(docId: string, data: GraphData): Promise<boolean> {
    const now = new Date();
    const stmt = this.db.prepare(
      `UPDATE ${DB_NAME} SET updated = $updated, data = $data WHERE id = $id`
    );
    stmt.run({
      id: docId,
      updated: now.toISOString(),
      data: JSON.stringify(data),
    });
    return Promise.resolve(true);
  }
}
