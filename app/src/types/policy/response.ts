import type { BaseState } from './base';

export interface ResponseState extends BaseState {
  type: 'Response';
  end: true;
  next: null;
  responseBody: Record<string, string>;
  resultPath?: string;
}
