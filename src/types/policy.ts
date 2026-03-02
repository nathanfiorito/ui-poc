// ─── Common fields shared by all state types ────────────────────────────────

interface BaseState {
  next: string | null
  end: boolean
  loopOver?: string | null
  allowFailOnLoopOver?: boolean | null
}

// ─── DataBase State ──────────────────────────────────────────────────────────

export interface DynamoDbResource {
  tableName: string
  PK: string
  SK?: string | null
  columns?: string[]
  resultPath: string
  fullScan?: boolean
}

export interface DatabaseResource {
  type: 'DynamoDB'
  dynamoDb: DynamoDbResource
}

export interface DatabaseState extends BaseState {
  type: 'DataBase'
  resource: DatabaseResource
}

// ─── Task State ──────────────────────────────────────────────────────────────

export interface TaskCondition {
  expression: string
  next: string
  resultPath?: string | null
}

export interface TaskState extends BaseState {
  type: 'task'
  conditions: TaskCondition[]
}

// ─── API State ───────────────────────────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiResource {
  route: string
  method: HttpMethod
  headers?: Record<string, string>
  body?: Record<string, unknown>
  responsePath: string
  authentication?: string
}

export interface ApiState extends BaseState {
  type: 'API'
  resource: ApiResource
}

// ─── Response State ──────────────────────────────────────────────────────────

export interface ResponseState extends BaseState {
  type: 'Response'
  next: null
  end: true
  responseBody: Record<string, string>
  resultPath?: string
}

// ─── Union & Policy ──────────────────────────────────────────────────────────

export type State = DatabaseState | TaskState | ApiState | ResponseState

export interface Policy {
  id: string
  name: string
  description?: string
  version: string
  startAt: string
  states: Record<string, State>
}
