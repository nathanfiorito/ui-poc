import type { Node } from 'reactflow';
import type { IODMNodeData } from '../types/flow';

export interface ValidationError {
  type: 'empty_name' | 'duplicate_name';
  nodeId: string;
  label: string;
}

export function validateNodeNames(nodes: Node<IODMNodeData>[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, string>();

  for (const node of nodes) {
    const label = node.data.label?.trim() ?? '';

    if (!label) {
      errors.push({ type: 'empty_name', nodeId: node.id, label: node.data.label });
      continue;
    }

    if (seen.has(label)) {
      errors.push({ type: 'duplicate_name', nodeId: node.id, label });
    } else {
      seen.set(label, node.id);
    }
  }

  return errors;
}
