# Visão Geral

Este documento descreve o plano de ação para a implementação de um **editor visual de workflows** para o IODM, utilizando **ReactFlow** como biblioteca de canvas interativo. O editor permitirá que usuários criem, editem e visualizem Policies de forma gráfica, gerando o Workflow Payload JSON automaticamente.

> 💡 **Objetivo:** Substituir a edição manual de JSON por uma interface drag-and-drop intuitiva, onde cada nó representa um State e cada aresta representa uma Transition (`next`).
> 

---

# Stack Tecnológica

| Camada | Tecnologia | Justificativa |
| --- | --- | --- |
| Framework | React + TypeScript | Tipagem forte, essencial para modelar os States |
| Canvas / Grafo | ReactFlow (`@xyflow/react`) | Biblioteca madura para editores de fluxo |
| Estilização | Tailwind CSS | Agilidade e consistência visual |
| Estado global | Zustand | Leve e ideal para gerenciar o grafo + payload |
| Formulários | React Hook Form + Zod | Validação de campos por tipo de State |
| Serialização | JSON nativo | Geração e importação do Workflow Payload |
| Testes | Vitest + React Testing Library | Cobertura unitária e de integração |

---

# Fases do Projeto

## 🟦 Fase 1 — Fundação e Setup

**Duração estimada: 1 semana**

Objetivo: preparar a base do projeto com a estrutura de pastas, dependências e os primeiros componentes scaffolded.

- [ ]  Inicializar projeto com Vite + React + TypeScript
- [ ]  Instalar e configurar ReactFlow (`@xyflow/react`)
- [ ]  Instalar Zustand, Tailwind CSS, React Hook Form e Zod
- [ ]  Definir estrutura de pastas do projeto
- [ ]  Criar tipos TypeScript para todos os State types (`DatabaseState`, `TaskState`, `APIState`, `ResponseState`)
- [ ]  Criar tipo raiz `Policy` refletindo o Workflow Payload
- [ ]  Configurar ESLint + Prettier
- [ ]  Setup inicial do Vitest

### Estrutura de Pastas Proposta

```
src/
├── components/
│   ├── nodes/           # Nós customizados por tipo de State
│   │   ├── DatabaseNode.tsx
│   │   ├── TaskNode.tsx
│   │   ├── ApiNode.tsx
│   │   └── ResponseNode.tsx
│   ├── edges/           # Arestas customizadas
│   ├── panels/          # Painéis laterais (propriedades, toolbar)
│   └── modals/          # Modais de edição de cada State
├── store/
│   └── workflowStore.ts # Zustand store — estado do grafo + policy
├── types/
│   └── policy.ts        # Tipos TypeScript do Workflow Payload
├── utils/
│   ├── serializer.ts    # Converte grafo (nodes+edges) → Policy JSON
│   └── deserializer.ts  # Converte Policy JSON → grafo (nodes+edges)
└── App.tsx
```

---

## 🟨 Fase 2 — Nós Customizados (Custom Nodes)

**Duração estimada: 1,5 semanas**

Objetivo: criar um nó visual distinto para cada tipo de State, com identidade visual clara.

- [ ]  Criar `DatabaseNode` — ícone de banco, campos: tableName, PK, resultPath
- [ ]  Criar `TaskNode` — ícone de decisão (losango), exibe quantidade de condições
- [ ]  Criar `ApiNode` — ícone de API/nuvem, campos: method, route
- [ ]  Criar `ResponseNode` — ícone de check/fim, marcação visual de estado terminal
- [ ]  Criar nó especial `StartNode` (entrada do fluxo, não editável)
- [ ]  Aplicar cores e ícones distintos por tipo
- [ ]  Garantir que handles (pontos de conexão) reflitam as possibilidades de cada State
- [ ]  Criar estado visual de seleção (highlight ao clicar)

### Identidade Visual dos Nós

| State | Cor | Ícone sugerido |
| --- | --- | --- |
| `DataBase` | Azul escuro `#1E3A5F` | 🗄️ Cilindro / banco |
| `Task` | Âmbar `#F59E0B` | 🔀 Losango / bifurcação |
| `API` | Verde `#059669` | 🌐 Nuvem / seta saindo |
| `Response` | Roxo `#7C3AED` | ✅ Círculo com check |
| `Start` | Cinza `#374151` | ▶️ Play |

---

## 🟧 Fase 3 — Painéis de Edição (Property Panels)

**Duração estimada: 1,5 semanas**

Objetivo: ao clicar em um nó, abrir um painel lateral com formulário específico para aquele tipo de State, com validação.

- [ ]  Criar componente `PropertiesPanel` (sidebar direita)
- [ ]  Formulário para `DatabaseState`: tableName, PK, SK, columns, resultPath, fullScan
- [ ]  Formulário para `TaskState`: lista dinâmica de conditions (expression + next + resultPath)
- [ ]  Formulário para `APIState`: route, method, headers (key-value dinâmico), body, responsePath, authentication
- [ ]  Formulário para `ResponseState`: responseBody (key-value mapeando resultPaths), resultPath
- [ ]  Validação com Zod por tipo de State (campos obrigatórios, formatos)
- [ ]  Feedback visual de erros inline nos formulários
- [ ]  Atualização em tempo real do nó ao editar campos

---

## 🟥 Fase 4 — Serialização e Deserialização

**Duração estimada: 1 semana**

Objetivo: implementar a conversão bidirecional entre o grafo visual (nodes + edges) e o Workflow Payload JSON.

- [ ]  Implementar `serializer`: converte nodes e edges do ReactFlow → Policy JSON válido
    - Mapear cada node ao seu State correspondente
    - Mapear cada edge ao campo `next` do State de origem
    - Inferir `startAt` a partir do nó conectado ao `StartNode`
    - Definir `end: true` em nós sem conexão de saída
- [ ]  Implementar `deserializer`: converte Policy JSON → nodes e edges com layout automático (dagre)
- [ ]  Validar o JSON gerado contra o schema esperado
- [ ]  Exibir painel de **Preview JSON** em tempo real (syntax highlight)
- [ ]  Botão **Exportar JSON** (download do payload)
- [ ]  Botão **Importar JSON** (upload ou paste para carregar um policy existente)

---

## 🟩 Fase 5 — UX e Funcionalidades do Editor

**Duração estimada: 1 semana**

Objetivo: tornar o editor fluido, intuitivo e produtivo.

- [ ]  **Toolbar superior**: botões de Novo, Importar, Exportar, Desfazer/Refazer
- [ ]  **Node Palette** (sidebar esquerda): arrastar novos States para o canvas
- [ ]  **Minimap**: visão geral do fluxo no canto inferior
- [ ]  **Auto-layout**: reorganizar nós automaticamente com `dagre` ou `elkjs`
- [ ]  **Validação do fluxo**: alertas visuais para erros (ex: estado sem `next`, fluxo sem `end`, `startAt` inválido)
- [ ]  **Undo/Redo**: histórico de ações com Zustand
- [ ]  **Conexões condicionais**: no `TaskNode`, cada condição gera um handle de saída rotulado com a expression
- [ ]  **Renomear nós** diretamente no canvas (double-click)
- [ ]  **Deletar nós e arestas** via tecla Delete
- [ ]  Responsividade básica

---

## 🔵 Fase 6 — Testes e Qualidade

**Duração estimada: 1 semana**

Objetivo: garantir confiabilidade das funcionalidades críticas.

- [ ]  Testes unitários para `serializer` e `deserializer`
- [ ]  Testes dos schemas de validação Zod por tipo de State
- [ ]  Testes de integração dos formulários (React Testing Library)
- [ ]  Teste de roundtrip: `Policy JSON → grafo → Policy JSON` deve ser idempotente
- [ ]  Cobertura mínima de 70% nas utils e store

---

## 🟤 Fase 7 — Polimento e Entrega

**Duração estimada: 0,5 semana**

- [ ]  Revisão de acessibilidade (a11y) dos formulários
- [ ]  Documentar componentes principais com JSDoc
- [ ]  README de setup do projeto
- [ ]  Build de produção e smoke test
- [ ]  Demo com o payload `Hello World Policy` pré-carregado

---

# Cronograma Resumido

| Fase | Descrição | Duração |
| --- | --- | --- |
| 1 | Fundação e Setup | 1 semana |
| 2 | Nós Customizados | 1,5 semanas |
| 3 | Painéis de Edição | 1,5 semanas |
| 4 | Serialização / Deserialização | 1 semana |
| 5 | UX e Funcionalidades do Editor | 1 semana |
| 6 | Testes e Qualidade | 1 semana |
| 7 | Polimento e Entrega | 0,5 semana |
| **Total** |  | **~7,5 semanas** |

---

# Decisões Técnicas Relevantes

## Gerenciamento de Estado com Zustand

O store central manterá:

- Lista de `nodes` e `edges` do ReactFlow
- O objeto `policy` (metadados: id, name, description, version)
- Histórico para undo/redo
- Estado do painel de propriedades (nó selecionado)

## Layout Automático com Dagre

Ao importar um JSON, o layout será calculado automaticamente via `dagre` para posicionar os nós de forma hierárquica top-down, respeitando a ordem de execução do fluxo.

## Handles Dinâmicos no TaskNode

O `TaskNode` é o mais complexo visualmente: cada `condition` no array gera um **handle de saída** rotulado com a expressão. Isso permite conectar visualmente cada branch condicional a um State diferente, refletindo exatamente o comportamento do runtime.

## Validação de Fluxo em Tempo Real

Um validador será executado a cada mudança no grafo, verificando:

- Existe exatamente 1 nó com `end: true`
- Todo nó (exceto o final) possui pelo menos uma aresta de saída
- O campo `startAt` aponta para um nó existente
- Nenhum `resultPath` está duplicado entre states

---

# Riscos e Mitigações

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Complexidade do `TaskNode` com handles dinâmicos | Alto | Prototipar isoladamente na Fase 2 antes de integrar |
| Layout automático insatisfatório para fluxos grandes | Médio | Testar `dagre` e `elkjs`, escolher o melhor resultado |
| Serialização com edge cases (loops, branches) | Alto | Cobertura de testes de roundtrip na Fase 6 |
| Escopo crescente (feature creep) | Médio | Manter MVP focado nas Fases 1–5; Fases 6–7 são polish |

---

*— Plano elaborado em Março / 2026 —*