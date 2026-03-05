import { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useFlowStore } from '../../store/flowStore';
import type { IODMNode } from '../../types/flow';
import type { ApiNodeData } from '../../types/flow';
import type { ApiFormValues } from './schemas';

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

function toForm(data: ApiNodeData): ApiFormValues {
  return {
    label: data.label,
    loopOver: data.loopOver ?? null,
    allowFailOnLoopOver: data.allowFailOnLoopOver ?? null,
    route: data.resource.route,
    method: data.resource.method,
    headers: Object.entries(data.resource.headers ?? {}).map(([key, value]) => ({ key, value })),
    body: data.resource.body ? JSON.stringify(data.resource.body, null, 2) : '',
    responsePath: data.resource.responsePath,
    authentication: data.resource.authentication ?? false,
  };
}

function fromForm(v: ApiFormValues): Partial<ApiNodeData> | null {
  let body: Record<string, unknown> | undefined;
  if (v.body) {
    try {
      body = JSON.parse(v.body) as Record<string, unknown>;
    } catch {
      return null; // invalid JSON, skip update
    }
  }

  const headers = (v.headers ?? []).reduce<Record<string, string>>((acc, { key, value }) => {
    if (key) acc[key] = value ?? '';
    return acc;
  }, {});

  return {
    label: v.label,
    loopOver: v.loopOver,
    allowFailOnLoopOver: v.allowFailOnLoopOver,
    resource: {
      route: v.route ?? '',
      method: v.method ?? 'GET',
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body,
      responsePath: v.responsePath ?? '',
      authentication: v.authentication,
    },
  };
}

interface Props {
  node: IODMNode;
}

export function ApiForm({ node }: Props) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodeIdRef = useRef(node.id);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const {
    register,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ApiFormValues>({
    defaultValues: toForm(node.data as ApiNodeData),
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'headers' });

  useEffect(() => {
    nodeIdRef.current = node.id;
    reset(toForm(node.data as ApiNodeData));
  }, [node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const partial = fromForm(values as ApiFormValues);
        if (partial === null) return;
        updateNodeData(
          nodeIdRef.current,
          partial as unknown as Partial<IODMNode['data']>
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

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">HTTP</p>

      <Field label="Method">
        <select {...register('method')} className={INPUT}>
          {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </Field>

      <Field label="Route (URL)" error={errors.route?.message}>
        <input
          {...register('route', {
            required: 'Obrigatório',
            validate: (v) => {
              try { new URL(v); return true; } catch { return 'URL inválida'; }
            },
          })}
          className={INPUT}
          placeholder="https://api.example.com/endpoint"
        />
      </Field>

      <Field label="Response Path" error={errors.responsePath?.message}>
        <input {...register('responsePath', { required: 'Obrigatório' })} className={INPUT} placeholder="$.data" />
      </Field>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="authentication"
          {...register('authentication')}
          className="rounded border-gray-300"
        />
        <label htmlFor="authentication" className="text-xs text-gray-600 dark:text-gray-300">Authentication</label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Headers</p>
          <button
            type="button"
            onClick={() => append({ key: '', value: '' })}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add
          </button>
        </div>

        {fields.length === 0 && (
          <p className="text-xs text-gray-400 italic">Nenhum header adicionado</p>
        )}

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-1 items-start">
              <input
                {...register(`headers.${index}.key`)}
                className={INPUT}
                placeholder="Content-Type"
              />
              <input
                {...register(`headers.${index}.value`)}
                className={INPUT}
                placeholder="application/json"
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

      <Field label="Body (JSON)" error={errors.body?.message}>
        <textarea
          {...register('body')}
          className={`${INPUT} font-mono resize-y`}
          rows={4}
          placeholder='{"key": "value"}'
        />
      </Field>

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
