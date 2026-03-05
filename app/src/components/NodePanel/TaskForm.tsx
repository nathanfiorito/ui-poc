import { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useFlowStore } from '../../store/flowStore';
import type { IODMNode } from '../../types/flow';
import type { TaskNodeData } from '../../types/flow';
import type { TaskFormValues } from './schemas';

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

function toForm(data: TaskNodeData): TaskFormValues {
  return {
    label: data.label,
    loopOver: data.loopOver ?? null,
    allowFailOnLoopOver: data.allowFailOnLoopOver ?? null,
    conditions: (data.conditions ?? []).map((c) => ({
      expression: c.expression,
      next: c.next,
      resultPath: c.resultPath ?? null,
    })),
  };
}

function fromForm(v: TaskFormValues): Partial<TaskNodeData> {
  return {
    label: v.label,
    loopOver: v.loopOver,
    allowFailOnLoopOver: v.allowFailOnLoopOver,
    conditions: (v.conditions ?? []).map((c) => ({
      expression: c?.expression ?? '',
      next: c?.next ?? '',
      resultPath: c?.resultPath ?? null,
    })),
  };
}

interface Props {
  node: IODMNode;
}

export function TaskForm({ node }: Props) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodeIdRef = useRef(node.id);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const {
    register,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: toForm(node.data as TaskNodeData),
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'conditions' });

  useEffect(() => {
    nodeIdRef.current = node.id;
    reset(toForm(node.data as TaskNodeData));
  }, [node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateNodeData(
          nodeIdRef.current,
          fromForm(values as TaskFormValues) as unknown as Partial<IODMNode['data']>
        );
      }, 300);
    });
    return () => {
      unsubscribe();
      clearTimeout(debounceRef.current);
    };
  }, [watch, updateNodeData]);

  const conditionsErrors = errors.conditions;

  return (
    <form className="space-y-3">
      <Field label="Nome" error={errors.label?.message}>
        <input {...register('label', { required: 'Obrigatório' })} className={INPUT} />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Condições</p>
          <button
            type="button"
            onClick={() => append({ expression: '', next: '', resultPath: null })}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add
          </button>
        </div>

        {fields.length === 0 && (
          <p className="text-xs text-gray-400 italic">Nenhuma condição adicionada</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-300">Condição {index + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  × Remover
                </button>
              </div>

              <Field
                label="Expression"
                error={conditionsErrors?.[index]?.expression?.message}
              >
                <input
                  {...register(`conditions.${index}.expression`, { required: 'Obrigatório' })}
                  className={INPUT}
                  placeholder="input.age > 18"
                />
              </Field>

              <Field
                label="Next (estado)"
                error={conditionsErrors?.[index]?.next?.message}
              >
                <input
                  {...register(`conditions.${index}.next`, { required: 'Obrigatório' })}
                  className={INPUT}
                  placeholder="NomeDoEstado"
                />
              </Field>

              <Field label="Result Path (opcional)">
                <input
                  {...register(`conditions.${index}.resultPath`)}
                  className={INPUT}
                  placeholder="$.resultado"
                />
              </Field>
            </div>
          ))}
        </div>
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
