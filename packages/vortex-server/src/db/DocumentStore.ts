export interface GraphData {
  name: string;
  nodes: any[];
  connections: any[];
}

export interface Document {
  id: string;
  created: Date;
  updated: Date;
  creator: string;
  creatorName: string;
  data: GraphData;
}

export interface DocumentListEntry {
  id: string;
  name: string;
  created: Date;
  updated: Date;
}

export default interface DocumentStore {
  listDocuments(user: string): Promise<DocumentListEntry[]>;
  getDocument(id: string): Promise<Document>;
  createDocument(data: GraphData, user: string, userName: string): Promise<string>;
  updateDocument(docId: string, data: GraphData): Promise<boolean>;
}
