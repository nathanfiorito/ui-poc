# Fase 1 — Fundação e Setup

**Duração estimada:** 1 semana
**Objetivo:** Preparar a base do projeto com estrutura de pastas, dependências e primeiros componentes scaffolded.

---

## Tarefas

### 1.1 Inicialização do Projeto

- [x] Inicializar projeto com Vite + React + TypeScript
  - Comando: `npm create vite@latest . -- --template react-ts`
  - Verificar que o projeto roda localmente com `npm run dev`

### 1.2 Instalação de Dependências

- [x] Instalar ReactFlow: `npm install @xyflow/react`
- [x] Instalar Zustand: `npm install zustand`
- [x] Instalar Tailwind CSS v3 e configurar: `npm install -D tailwindcss@^3 postcss autoprefixer && npx tailwindcss init -p`
- [x] Instalar React Hook Form: `npm install react-hook-form`
- [x] Instalar Zod: `npm install zod`
- [x] Instalar integrações Zod + React Hook Form: `npm install @hookform/resolvers`

### 1.3 Configuração de Ferramentas

- [x] Configurar ESLint com regras para React + TypeScript
- [x] Configurar Prettier (`.prettierrc`)
- [x] Integrar ESLint + Prettier (`eslint-config-prettier`)
- [x] Setup inicial do Vitest: `npm install -D vitest @vitest/ui jsdom@24`
- [x] Configurar `vitest.config.ts` com environment `jsdom`
- [x] Instalar React Testing Library: `npm install -D @testing-library/react @testing-library/jest-dom`

### 1.4 Estrutura de Pastas

- [x] Criar estrutura de diretórios conforme proposta:

```
src/
├── components/
│   ├── nodes/
│   ├── edges/
│   ├── panels/
│   └── modals/
├── store/
├── types/
└── utils/
```

### 1.5 Tipos TypeScript (Policy)

- [x] Criar `src/types/policy.ts` com os seguintes tipos:
  - `DatabaseState` — campos: `type`, `next`, `end`, `loopOver`, `allowFailOnLoopOver`, `resource.dynamoDb`
  - `TaskState` — campos: `type`, `next`, `end`, `conditions[]` (expression, next, resultPath)
  - `APIState` — campos: `type`, `next`, `end`, `resource` (route, method, headers, body, responsePath, authentication)
  - `ResponseState` — campos: `type`, `next: null`, `end: true`, `responseBody`, `resultPath`
  - `State` — union type de todos os estados acima
  - `Policy` — tipo raiz com `id`, `name`, `description`, `version`, `startAt`, `states`

### 1.6 Validação de Setup

- [x] Confirmar que Tailwind aplica estilos corretamente no `App.tsx`
- [x] Confirmar que ReactFlow renderiza um canvas vazio sem erros
- [x] Confirmar que o Zustand store inicializa sem erros
- [x] Rodar `npm test` e confirmar que o ambiente de testes funciona (5 testes passando)

---

## Critério de Conclusão

- Projeto rodando localmente sem erros
- Todos os tipos TypeScript compilando sem erros (`tsc --noEmit`)
- Testes básicos passando
- Estrutura de pastas criada

---

## Referências

- [Documentação ReactFlow](https://reactflow.dev)
- [Documentação Zustand](https://zustand.docs.pmnd.rs)
- [Documentação Zod](https://zod.dev)
- [Introdução ao IODM](../docs/introduction.md) — tipos de State para referência
