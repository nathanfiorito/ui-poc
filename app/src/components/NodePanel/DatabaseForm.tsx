import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useFlowStore } from '../../store/flowStore';
import type { IODMNode } from '../../types/flow';
import type { DatabaseNodeData } from '../../types/flow';
import type { DatabaseFormValues } from './schemas';

const INPUT = 'w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-700 dark:text-gray-100';
const LABEL = 'block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5';
const ERROR = 'text-xs text-red-500 mt-0.5';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
      {error && <p className={ERROR}>{error}</p>}
    </div>
  );
}

function toForm(data: DatabaseNodeData): DatabaseFormValues {
  return {
    label: data.label,
    loopOver: data.loopOver ?? null,
    allowFailOnLoopOver: data.allowFailOnLoopOver ?? null,
    tableName: data.resource.dynamoDb.tableName,
    PK: data.resource.dynamoDb.PK,
    SK: data.resource.dynamoDb.SK ?? null,
    columns: data.resource.dynamoDb.columns?.join(', ') ?? '',
    resultPath: data.resource.dynamoDb.resultPath,
    fullScan: data.resource.dynamoDb.fullScan ?? false,
  };
}

function fromForm(v: DatabaseFormValues): Partial<DatabaseNodeData> {
  return {
    label: v.label,
    loopOver: v.loopOver,
    allowFailOnLoopOver: v.allowFailOnLoopOver,
    resource: {
      type: 'DynamoDB',
      dynamoDb: {
        tableName: v.tableName ?? '',
        PK: v.PK ?? '',
        SK: v.SK ?? undefined,
        columns: v.columns ? v.columns.split(',').map((c) => c.trim()).filter(Boolean) : undefined,
        resultPath: v.resultPath ?? '',
        fullScan: v.fullScan,
      },
    },
  };
}

interface Props {
  node: IODMNode;
}

export function DatabaseForm({ node }: Props) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodeIdRef = useRef(node.id);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const {
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<DatabaseFormValues>({
    defaultValues: toForm(node.data as DatabaseNodeData),
    mode: 'onChange',
  });

  useEffect(() => {
    nodeIdRef.current = node.id;
    reset(toForm(node.data as DatabaseNodeData));
  }, [node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateNodeData(
          nodeIdRef.current,
          fromForm(values as DatabaseFormValues) as unknown as Partial<IODMNode['data']>
        );
      }, 300);
    });
    return () => {
      unsubscribe();
      clearTimeout(debounceRef.current);
    };
  }, [watch, updateNodeData]);

  return (
    <form className="space-y-3">
      <Field label="Nome" error={errors.label?.message}>
        <input {...register('label', { required: 'Obrigatório' })} className={INPUT} />
      </Field>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">DynamoDB</p>

      <Field label="Table Name" error={errors.tableName?.message}>
        <input {...register('tableName', { required: 'Obrigatório' })} className={INPUT} />
      </Field>

      <Field label="PK" error={errors.PK?.message}>
        <input {...register('PK', { required: 'Obrigatório' })} className={INPUT} />
      </Field>

      <Field label="SK (opcional)">
        <input {...register('SK')} className={INPUT} placeholder="Chave de ordenação" />
      </Field>

      <Field label="Columns (CSV, opcional)">
        <input {...register('columns')} className={INPUT} placeholder="col1, col2, col3" />
      </Field>

      <Field label="Result Path" error={errors.resultPath?.message}>
        <input {...register('resultPath', { required: 'Obrigatório' })} className={INPUT} placeholder="$.resultado" />
      </Field>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="fullScan" {...register('fullScan')} className="rounded border-gray-300" />
        <label htmlFor="fullScan" className="text-xs text-gray-600 dark:text-gray-300">Full Scan</label>
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Loop (opcional)</p>

      <Field label="Loop Over">
        <input {...register('loopOver')} className={INPUT} placeholder="input.items" />
      </Field>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allowFailOnLoopOver"
          {...register('allowFailOnLoopOver')}
          className="rounded border-gray-300"
        />
        <label htmlFor="allowFailOnLoopOver" className="text-xs text-gray-600 dark:text-gray-300">Allow Fail On Loop</label>
      </div>
    </form>
  );
}
