# Architecture Decisions — IODM Visual Workflow Editor

## 1. Modularização de Tipos (`types/policy/`)

**Decisão:** Dividir `types/policy.ts` em 7 arquivos por domínio em vez de manter um único arquivo.

**Motivo:** O domínio IODM tem 4 tipos de estado distintos (DatabaseState, TaskState, ApiState, ResponseState), cada um com suas próprias configurações e tipos aninhados. Um único arquivo cresceria rapidamente e dificultaria navegação e manutenção. A estrutura modular espelha os próprios tipos de nó do React Flow, tornando a correspondência entre domínio e UI imediata.

**Estrutura:**
```
types/policy/
  base.ts       # StateType enum, BaseState interface
  condition.ts  # Condition (usada por TaskState)
  database.ts   # DatabaseState, DynamoDbConfig, DatabaseResource
  task.ts       # TaskState
  api.ts        # ApiState, ApiResource
  response.ts   # ResponseState
  index.ts      # Policy, PolicyMeta, State (union type), re-exports
```

O `index.ts` re-exporta tudo para que importações externas continuem usando `from 'types/policy'` sem precisar conhecer a estrutura interna.

---

## 2. Zustand Store Design

**Decisão:** As ações de mutação (`onNodesChange`, `onEdgesChange`, `onConnect`) ficam no store, não nos componentes.

**Motivo:** O React Flow exige callbacks para gerenciar mudanças de nós e arestas. Colocá-los no store garante que:
- Qualquer componente pode acionar mudanças sem prop drilling
- O estado permanece fonte única de verdade (single source of truth)
- Testes unitários do store testam a lógica de mutação sem renderizar componentes

**Ações no store:**
```ts
onNodesChange(changes: NodeChange[])  // aplica mudanças de posição/seleção/remoção
onEdgesChange(changes: EdgeChange[])  // aplica mudanças nas arestas
onConnect(connection: Connection)     // cria nova aresta ao conectar dois handles
setNodes(nodes)                       // substituição completa
setEdges(edges)                       // substituição completa
setSelectedNodeId(id | null)          // controla painel de propriedades
setPolicyMeta(meta)                   // atualiza metadados da Policy
```

---

## 3. Compatibilidade de Dependências (Node 18)

**Restrição:** O ambiente de produção roda Node.js v18.19.1. Versões mais recentes de algumas dependências exigem Node >= 20.

**Versões fixadas:**

| Dependência | Versão usada | Motivo |
|-------------|-------------|--------|
| `vite` | `^5.4` | Vite 7 exige Node >= 20 |
| `@vitejs/plugin-react` | `^4.3` | Compatível com Vite 5 |
| `tailwindcss` | `^3` | Tailwind v4 usa `@tailwindcss/oxide` (binário nativo, Node >= 20) |
| `jsdom` | `^24` | jsdom 25+ incompatível com Node 18 |
| `vitest` | `^4` | Funciona com Node 18 (ignora engine warning) |

---

## 4. Testes com Vitest

**Ambiente:** `jsdom` (simulação de DOM no Node, necessário para testar hooks e stores que referenciam APIs de browser).

**Setup:** `@testing-library/jest-dom` adicionado via `setupFilesAfterFramework` no `vitest.config.ts` para matchers como `toBeInTheDocument()`.

**Estratégia:**
- **Unit tests do store** (`flowStore.test.ts`): testam ações de mutação isoladas, sem React ou React Flow
- **Unit tests de utils** (futuros): `policyParser.ts`, `policySerializer.ts`, `validators.ts` — lógica pura sem UI
- **Integration tests** (Fase 5): FlowCanvas com `@testing-library/react`, simulando drag-and-drop e conexões

**Comandos:**
```bash
npm run test      # watch mode
npm run test:run  # single run (CI)
npm run test:ui   # interface visual (browser)
```
