import { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useFlowStore } from '../../store/flowStore';
import type { IODMNode } from '../../types/flow';
import type { ResponseNodeData } from '../../types/flow';
import type { ResponseFormValues } from './schemas';

const INPUT = 'w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white';
const LABEL = 'block text-xs font-medium text-gray-600 mb-0.5';
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

function toForm(data: ResponseNodeData): ResponseFormValues {
  return {
    label: data.label,
    responseBody: Object.entries(data.responseBody ?? {}).map(([key, value]) => ({ key, value })),
    resultPath: data.resultPath ?? '',
  };
}

function fromForm(v: ResponseFormValues): Partial<ResponseNodeData> {
  return {
    label: v.label,
    resultPath: v.resultPath || undefined,
    responseBody: (v.responseBody ?? []).reduce<Record<string, string>>((acc, { key, value }) => {
      if (key) acc[key] = value ?? '';
      return acc;
    }, {}),
  };
}

interface Props {
  node: IODMNode;
}

export function ResponseForm({ node }: Props) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodeIdRef = useRef(node.id);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const {
    register,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ResponseFormValues>({
    defaultValues: toForm(node.data as ResponseNodeData),
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'responseBody' });

  useEffect(() => {
    nodeIdRef.current = node.id;
    reset(toForm(node.data as ResponseNodeData));
  }, [node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateNodeData(
          nodeIdRef.current,
          fromForm(values as ResponseFormValues) as unknown as Partial<IODMNode['data']>
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

      <Field label="Result Path (opcional)">
        <input {...register('resultPath')} className={INPUT} placeholder="$.resultado" />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Response Body</p>
          <button
            type="button"
            onClick={() => append({ key: '', value: '' })}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add
          </button>
        </div>

        {fields.length === 0 && (
          <p className="text-xs text-gray-400 italic">Nenhum campo adicionado</p>
        )}

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-1 items-start">
              <input
                {...register(`responseBody.${index}.key`)}
                className={INPUT}
                placeholder="chave"
              />
              <input
                {...register(`responseBody.${index}.value`)}
                className={INPUT}
                placeholder="valor"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs text-red-400 hover:text-red-600 px-1 py-1.5 flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
