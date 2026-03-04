import type { BaseState } from './base';

export interface DynamoDbConfig {
  tableName: string;
  PK: string;
  SK?: string | null;
  columns?: string[];
  resultPath: string;
  fullScan?: boolean;
}

export interface DatabaseResource {
  type: 'DynamoDB';
  dynamoDb: DynamoDbConfig;
}

export interface DatabaseState extends BaseState {
  type: 'DataBase';
  resource: DatabaseResource;
}
