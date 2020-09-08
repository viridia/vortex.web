import AWS from 'aws-sdk';
import DocumentStore, { Document, DocumentListEntry, GraphData } from './DocumentStore';

const yeast = require('yeast');

const DOCUMENTS_TABLE = process.env.AWS_DDB_TABLE_DOCUMENTS || 'Documents';
const COUNTERS_TABLE = process.env.AWS_DDB_TABLE_COUNTERS || 'Counters';
const DOC_COUNTER_ID = 'doc-counter';

export default class DocumentStoreDynamoDB implements DocumentStore {
  private db: AWS.DynamoDB;
  private initialized = false;

  constructor() {
    this.db = new AWS.DynamoDB({});
  }

  public listDocuments(user: string): Promise<DocumentListEntry[]> {
    console.log(user);
    return new Promise((resolve, reject) => {
      this.db.query({
        TableName: DOCUMENTS_TABLE,
        IndexName: 'creator_index',
        KeyConditionExpression: '#creator = :creator',
        ExpressionAttributeNames:{
          '#creator': 'creator',
        },
        ExpressionAttributeValues: {
          ':creator': { S: user },
        },
      }, (err, result) => {
        console.log(JSON.stringify(result));
        if (err) {
          console.error('listDocuments error:', err);
          reject(err);
        } else {
          const docs: DocumentListEntry[] = result.Items.map(item => ({
            id: item.id.S,
            name: item.name.S,
            created: new Date(item.created.S),
            updated: new Date(item.updated.S),
          }));
          resolve(docs);
        }
      });
    });
  }

  public getDocument(id: string): Promise<Document> {
    return new Promise((resolve, reject) => {
      this.db.getItem({
        TableName: DOCUMENTS_TABLE,
        Key: {
          id: { S: id },
        },
      }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          if (!result.Item) {
            resolve(null);
            return;
          }
          const doc: Document = {
            id: result.Item.id.S,
            created: new Date(result.Item.created.S),
            updated: new Date(result.Item.updated.S),
            creator: result.Item.creator.S,
            creatorName: result.Item.creatorName.S,
            data: JSON.parse(result.Item.data.S),
          };
          resolve(doc);
        }
      });
    });
  }

  public async createDocument(data: GraphData, user: string, userName: string): Promise<string> {
    if (!this.initialized) {
      await this.initCounter(DOC_COUNTER_ID, 10000);
      this.initialized = false;
    }
    const id = await this.nextDocId();
    await new Promise((resolve, reject) => {
      this.db.putItem({
        TableName: DOCUMENTS_TABLE,
        Item: {
          id: { S: id },
          name: { S: data.name },
          creator: { S: user },
          creatorName: { S: userName },
          created: { S: new Date().toISOString() },
          updated: { S: new Date().toISOString() },
          data: { S: JSON.stringify(data) },
        },
      }, (err, result) => {
        if (err) {
          console.error('createDocument error:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    return id;
  }

  public async updateDocument(docId: string, data: GraphData): Promise<boolean> {
    return await new Promise<boolean>((resolve, reject) => {
      this.db.updateItem({
        TableName: DOCUMENTS_TABLE,
        Key: {
          id: { S: docId },
        },
        UpdateExpression: 'set #name = :name, #updated = :updated, #data = :data',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#updated': 'updated',
          '#data': 'data',
        },
        ExpressionAttributeValues: {
          ':name': { S: data.name },
          ':updated': { S: new Date().toISOString() },
          ':data': { S: JSON.stringify(data) },
        },
      }, (err, result) => {
        if (err) {
          console.error('updateDocument error:', err);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  private nextDocId(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.db.updateItem({
        TableName: COUNTERS_TABLE,
        Key: {
          id: { S: DOC_COUNTER_ID },
        },
        ExpressionAttributeNames: {
          '#value': 'value',
        },
        ExpressionAttributeValues: {
          ':incr': { N: '1' },
        },
        UpdateExpression: 'set #value = #value + :incr',
        ReturnValues: 'UPDATED_NEW',
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(yeast.encode(Number(data.Attributes.value.N)));
        }
      });
    });
  }

  private initCounter(id: string, initialValue: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.getItem({
        TableName: COUNTERS_TABLE,
        Key: {
          id: { S: id },
        },
      }, (err, data) => {
        if (err) {
          reject(err);
        } else if (!('Item' in data)) {
          console.log('initCounter:', id, '=', initialValue);
          this.db.putItem({
            TableName: COUNTERS_TABLE,
            Item: {
              id: { S: id },
              value: { N: `${initialValue}` },
            },
          }, (e2, d2) => {
            if (e2) {
              reject(e2);
            } else {
              resolve(true);
            }
          });
        } else {
          resolve(false);
        }
      });
    });
  }
}
