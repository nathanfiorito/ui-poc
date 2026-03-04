# Implementation Plan — IODM Visual Workflow Editor

## Fase 1 — Setup e Infraestrutura ✅ COMPLETA

- [x] Configurar Vite 5 + React 19 + TypeScript
- [x] Instalar e configurar ReactFlow, Zustand e Tailwind CSS v3
- [x] Definir tipos TypeScript do domínio IODM (`types/policy/`, `types/flow.ts`)
- [x] Configurar Zustand store (`store/flowStore.ts`)
- [x] Configurar Vitest com jsdom e `@testing-library/jest-dom`
- [x] Escrever testes unitários do store (`store/flowStore.test.ts`)

**Entregáveis:**
- `app/src/types/policy/` — 7 arquivos de tipos por domínio
- `app/src/types/flow.ts` — tipos estendidos do React Flow
- `app/src/store/flowStore.ts` — estado global (nodes, edges, policyMeta, selectedNodeId)
- `app/src/store/flowStore.test.ts` — testes das ações do store
- `app/src/App.tsx` — canvas básico com Background, Controls, MiniMap
- `app/src/main.tsx` — ReactFlowProvider + estilos

---

## Fase 2 — Nós Customizados (Custom Nodes) ⏳ PENDENTE

- [ ] Implementar `DatabaseNode` (azul — consulta DynamoDB)
- [ ] Implementar `TaskNode` com múltiplos handles (amarelo — avalia conditions)
- [ ] Implementar `ApiNode` (verde — chamada HTTP externa)
- [ ] Implementar `ResponseNode` (roxo — estado final)
- [ ] Registrar `nodeTypes` e `edgeTypes` fora do componente em `nodes/index.ts` e `edges/index.ts`
- [ ] Implementar `DefaultEdge` e `ConditionalEdge`

**Critérios de aceite:**
- Cada nó exibe campos relevantes do seu tipo de estado
- `TaskNode` tem um `Handle` de saída por condição + handle de default
- `ResponseNode` não tem handle de saída (estado terminal)
- Todos os nós aceitam seleção e destacam quando selecionados

---

## Fase 3 — Conversão Policy ↔ React Flow ⏳ PENDENTE

- [ ] Implementar `policyParser.ts` (Policy JSON → nodes[] + edges[])
- [ ] Implementar `policySerializer.ts` (nodes[] + edges[] → Policy JSON válido)
- [ ] Implementar `layoutUtils.ts` (layout automático com Dagre)
- [ ] Testes unitários para `policyParser.ts` e `policySerializer.ts`

**Critérios de aceite:**
- Round-trip: importar uma Policy e exportar de volta produz JSON equivalente
- Layout Dagre posiciona nós sem sobreposição
- Condições de `TaskNode` viram `ConditionalEdge` com label da expression

---

## Fase 4 — UI Components (Sidebar, NodePanel, Toolbar, JsonPreview) ⏳ PENDENTE

- [ ] Implementar `Sidebar` com drag-and-drop (arrastar nós para o canvas)
- [ ] Implementar `NodePanel` com React Hook Form + Zod (editar propriedades do nó selecionado)
- [ ] Implementar `Toolbar` (nome da Policy, botão exportar JSON, botão importar JSON)
- [ ] Implementar `JsonPreview` (visualizador do Policy JSON em tempo real)

**Critérios de aceite:**
- Arrastar da Sidebar cria nó no canvas com valores padrão (`constants/defaults.ts`)
- `NodePanel` valida campos com Zod antes de aplicar mudanças ao store
- `Toolbar` exporta JSON válido e importa JSON acionando `policyParser`
- `JsonPreview` atualiza em tempo real a cada mudança no canvas

---

## Fase 5 — Validação, Testes e Qualidade ⏳ PENDENTE

- [ ] Implementar `validators.ts`
- [ ] Testes de integração do `FlowCanvas`
- [ ] Testes unitários para `validators.ts`

**Validações obrigatórias (`validators.ts`):**
- Existe pelo menos um estado com `end: true`
- O estado com `end: true` tem `next: null`
- O `startAt` referencia um estado existente
- Todo `next` em states/conditions aponta para um estado existente
- Nenhum `resultPath` é sobrescrito por estados diferentes

**Critérios de aceite:**
- Exportar uma Policy inválida mostra erros de validação ao usuário
- Testes de integração simulam drag-and-drop e verificam o JSON gerado
