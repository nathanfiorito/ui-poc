export type StateType = 'DataBase' | 'task' | 'API' | 'Response';

export interface BaseState {
  type: StateType;
  next: string | null;
  end: boolean;
  loopOver?: string | null;
  allowFailOnLoopOver?: boolean | null;
}
