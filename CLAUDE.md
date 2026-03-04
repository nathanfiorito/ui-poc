# CLAUDE.md — IODM Visual Workflow Editor

## Overview

Editor visual de workflows para o **IODM** (Intelligent Orchestration & Decision Manager),
um motor de orquestração inspirado no AWS Step Functions. O editor permite criar, visualizar
e editar **Policies** (fluxos declarativos em JSON) por meio de uma interface drag-and-drop.

Stack: React 18 + TypeScript + React Flow v11 + Tailwind CSS v3 + Vite + Zustand

---

## Project Structure

```
src/
  nodes/
    DatabaseNode/       # Nó do tipo DataBase (consulta DynamoDB)
    TaskNode/           # Nó do tipo task (decisão com conditions)
    ApiNode/            # Nó do tipo API (chamada HTTP externa)
    ResponseNode/       # Nó do tipo Response (estado final do fluxo)
    index.ts            # Registro de nodeTypes para o React Flow

  edges/
    DefaultEdge/        # Aresta padrão entre estados
    ConditionalEdge/    # Aresta de condição (TaskNode → próximo estado)
    index.ts            # Registro de edgeTypes para o React Flow

  components/
    FlowCanvas/         # Componente principal com <ReactFlow />
    Sidebar/            # Painel lateral com nós disponíveis para arrastar
    NodePanel/          # Painel de propriedades do nó selecionado
    Toolbar/            # Barra superior: nome da policy, ações (exportar, importar)
    JsonPreview/        # Visualizador do Policy JSON gerado em tempo real

  hooks/
    useFlowStore.ts     # Acesso ao store Zustand
    useNodeSelection.ts # Gerencia qual nó está selecionado no canvas
    usePolicySync.ts    # Sincroniza estado do React Flow → Policy JSON

  store/
    flowStore.ts        # Estado global: nodes, edges, policyMeta, selectedNode

  utils/
    policyParser.ts     # Converte Policy JSON → nodes/edges do React Flow
    policySerializer.ts # Converte nodes/edges do React Flow → Policy JSON
    layoutUtils.ts      # Layout automático com Dagre
    validators.ts       # Valida integridade da Policy (startAt, end, next, etc.)

  types/
    policy.ts           # Tipos do domínio: Policy, State, StateType, Condition, etc.
    flow.ts             # Tipos do React Flow estendidos com dados do IODM

  constants/
    nodeTypes.ts        # Enum dos tipos de estado: DataBase | task | API | Response
    defaults.ts         # Valores padrão ao criar cada tipo de nó

public/
docs/
  index.md              # Documentação oficial do IODM (spec da Policy)
  architecture.md       # Decisões de arquitetura e trade-offs
  implementation-plan.md # Plano de implementação com checkboxes [ ]
```

---

## Code Map

### Entry Point
- `src/main.tsx` → envolve tudo com `<ReactFlowProvider>` (obrigatório)
- `src/App.tsx` → layout: `<Sidebar>` + `<FlowCanvas>` + `<NodePanel>`

### Domínio — Policy / States
Os 4 tipos de estado do IODM mapeiam diretamente para 4 tipos de nó:

| State type (JSON) | Nó no React Flow | Papel no fluxo                         |
|-------------------|------------------|----------------------------------------|
| `DataBase`        | `DatabaseNode`   | Consulta DynamoDB, salva em resultPath |
| `task`            | `TaskNode`       | Avalia conditions, ramifica o fluxo    |
| `API`             | `ApiNode`        | Chamada HTTP externa, salva resposta   |
| `Response`        | `ResponseNode`   | Estado final — sempre `end: true`      |

### React Flow
- `<ReactFlow />` vive exclusivamente em `src/components/FlowCanvas/`
- `nodeTypes` e `edgeTypes` são definidos **fora** do componente (evita re-renders)
- Cada nó recebe `NodeProps<T>` tipado com o tipo do estado correspondente de `src/types/policy.ts`
- `Handle` de source/target sempre com `id` explícito (TaskNode tem múltiplos handles — um por condição)

### Conversão Policy ↔ React Flow
- **Importar Policy JSON** → `policyParser.ts` → gera `nodes[]` + `edges[]` → `flowStore`
- **Exportar Policy JSON** → `policySerializer.ts` lê `flowStore` → monta objeto Policy válido
- O campo `next` de cada estado vira uma aresta no React Flow
- O campo `resultPath` fica nos `data` do nó, não aparece como aresta
- Condições do `TaskNode` viram arestas do tipo `ConditionalEdge` com label da expression

### Estado Global (Zustand — `flowStore.ts`)
```ts
{
  nodes: Node<IODMNodeData>[],
  edges: Edge[],
  policyMeta: {           // campos raiz da Policy
    id, name, description, version, startAt
  },
  selectedNodeId: string | null
}
```
- Nunca mutar `nodes` ou `edges` diretamente — sempre via `setNodes` / `setEdges`
- `startAt` da Policy = `id` do nó marcado como ponto de entrada no canvas

### Validações (`validators.ts`)
Sempre validar antes de exportar:
- Existe pelo menos um estado com `end: true`
- O estado com `end: true` tem `next: null`
- O `startAt` referencia um estado existente
- Todo `next` em states/conditions aponta para um estado existente
- Nenhum `resultPath` é sobrescrito por estados diferentes

### Estilização
- Tailwind para toda a UI de chrome (sidebar, toolbar, painéis)
- CSS Modules apenas para internals dos nós React Flow (handles, borders)
- Importar obrigatoriamente em `main.tsx`: `import 'reactflow/dist/style.css'`
- Paleta por tipo de nó (definida em `constants/defaults.ts`):
  - `DataBase` → azul
  - `task` → amarelo/laranja
  - `API` → verde
  - `Response` → roxo

---

## Convenções do Domínio

- `resultPath` é o identificador que um estado produz e estados posteriores consomem
- Referência a dados de entrada usa notação `input.<caminho>` (ex: `input.age`, `input.client.cpf`)
- Nomes de estados em **PascalCase** e únicos dentro da Policy
- Estado final SEMPRE do tipo `Response` com `end: true` e `next: null`
- `task` (minúsculo) é o type correto no JSON — não `Task`

---

## Comandos

```bash
npm run dev       # Dev server (Vite)
npm run build     # Build de produção
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

---

## Contexto Sob Demanda

Referencie quando necessário — não carregar em toda sessão:

- `@docs/index.md` — spec completa do IODM: todos os tipos, campos, exemplos
- `@docs/architecture.md` — decisões de arquitetura e trade-offs
- `@docs/implementation-plan.md` — plano de implementação com checkboxes [ ]

---

## Gerenciamento de Tarefas — Asana

**Projeto:** IODM Visual Workflow Editor
**GID:** `1213522953495309`
**Workspace GID:** `1213545003196581`

### Fases e Tarefas

#### Fase 1 — Setup e Infraestrutura
- [ ] Configurar Vite + React + TypeScript
- [ ] Instalar e configurar ReactFlow, Zustand e Tailwind CSS v3
- [ ] Definir tipos TypeScript do domínio IODM
- [ ] Configurar Zustand store e testes com Vitest

#### Fase 2 — Nós Customizados (Custom Nodes)
- [ ] Implementar DatabaseNode (azul)
- [ ] Implementar TaskNode com múltiplos handles (amarelo)
- [ ] Implementar ApiNode (verde)
- [ ] Implementar ResponseNode (roxo)
- [ ] Registrar nodeTypes e edgeTypes fora do componente

#### Fase 3 — Conversão Policy ↔ React Flow
- [ ] Implementar policyParser.ts (JSON → nodes/edges)
- [ ] Implementar policySerializer.ts (nodes/edges → JSON)
- [ ] Layout automático com Dagre (layoutUtils.ts)

#### Fase 4 — Sidebar, NodePanel e Toolbar
- [ ] Implementar Sidebar com drag-and-drop
- [ ] Implementar NodePanel com React Hook Form + Zod
- [ ] Implementar Toolbar (nome da policy, exportar, importar)
- [ ] Implementar JsonPreview (visualizador em tempo real)

#### Fase 5 — Validação, Testes e Qualidade
- [ ] Implementar validators.ts
- [ ] Testes unitários para policyParser e policySerializer
- [ ] Testes de integração do FlowCanvas