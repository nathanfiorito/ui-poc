import type { BaseState } from './base';

export interface ApiResource {
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  responsePath: string;
  authentication: boolean;
}

export interface ApiState extends BaseState {
  type: 'API';
  resource: ApiResource;
}
