# 1. Introdução

O **IODM** (Intelligent Orchestration & Decision Manager) é um motor de orquestração de fluxos de trabalho inspirado no AWS Step Functions. Ele permite definir, executar e gerenciar fluxos complexos de integração e tomada de decisão por meio de um JSON declarativo chamado **Workflow Payload** (ou **Policy**).

Com o IODM, equipes de desenvolvimento podem descrever em alto nível sequências de operações — como consultas a banco de dados, chamadas de API externas e regras condicionais — sem a necessidade de escrever código imperativo para cada orquestração.

## 1.1. Conceitos Fundamentais

- **Policy**: o documento JSON raiz que define todo o fluxo.
- **State (Estado)**: cada etapa individual dentro do fluxo.
- **Transition**: o encadeamento de estados via o campo `next`.
- **resultPath**: identificador utilizado para armazenar o output de um estado, referenciável por estados posteriores.
- **input.***: notação para referenciar dados recebidos na requisição original.

---

# 2. Estrutura Raiz da Policy

Toda Policy é um objeto JSON com os seguintes campos de nível superior:

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string (UUID) | ✅ Sim | Identificador único da policy no formato UUID v4. |
| `name` | string | ✅ Sim | Nome legível da policy. |
| `description` | string | ❌ Não | Descrição textual do propósito da policy. |
| `version` | string | ✅ Sim | Versão da policy (ex: `'1.0'`). |
| `startAt` | string | ✅ Sim | Nome do estado inicial a ser executado. |
| `states` | object | ✅ Sim | Mapa de estados, onde cada chave é o nome do estado. |

## 2.1. Exemplo Mínimo

```json
{
  "id": "9218fd27-a11f-4b8d-ba31-41c4bd599a4f",
  "name": "Hello World Policy",
  "description": "Exemplo básico de policy.",
  "version": "1.0",
  "startAt": "PrimeiroEstado",
  "states": {
    "PrimeiroEstado": { ... }
  }
}
```

---

# 3. Tipos de Estado (States)

Cada estado dentro do objeto `states` é identificado por um nome único e possui obrigatoriamente um campo `type`, que determina seu comportamento. Os campos comuns a todos os estados são:

| Campo | Tipo | Obrigatório | Descrição |  |
| --- | --- | --- | --- | --- |
| `type` | string | ✅ Sim | Tipo do estado: `DataBase`, `task`, `API` ou `Response`. |  |
| `next` | string \ | null | ✅ Sim | Nome do próximo estado. `null` quando `end` é `true`. |
| `end` | boolean | ✅ Sim | Indica se este é o estado final do fluxo. |  |
| `loopOver` | string \ | null | ❌ Não | Campo para iteração sobre listas (feature em desenvolvimento). |
| `allowFailOnLoopOver` | boolean \ | null | ❌ Não | Permite falha em iterações sem interromper o fluxo. |

## 3.1. Estado do tipo DataBase

Realiza consultas em fontes de dados persistentes. Atualmente suporta o **DynamoDB** como provedor.

### Campos específicos

| Campo | Tipo | Obrigatório | Descrição |  |
| --- | --- | --- | --- | --- |
| `resource.type` | string | ✅ Sim | Tipo do recurso. Valor aceito: `DynamoDB`. |  |
| `resource.dynamoDb.tableName` | string | ✅ Sim | Nome da tabela DynamoDB. |  |
| `resource.dynamoDb.PK` | string | ✅ Sim | Valor da chave primária (Partition Key). |  |
| `resource.dynamoDb.SK` | string \ | null | ❌ Não | Valor da chave de ordenação (Sort Key), se existir. |
| `resource.dynamoDb.columns` | string[] | ❌ Não | Lista de colunas a retornar. Se omitido, retorna todas. |  |
| `resource.dynamoDb.resultPath` | string | ✅ Sim | Identificador para armazenar o resultado (ex: `'outputDatabase'`). |  |
| `resource.dynamoDb.fullScan` | boolean | ❌ Não | Se `true`, realiza varredura completa (table scan). Evitar em tabelas grandes. |  |

### Exemplo

```json
"DatabaseStateExample": {
  "type": "DataBase",
  "next": "ProximoEstado",
  "end": false,
  "loopOver": null,
  "allowFailOnLoopOver": null,
  "resource": {
    "type": "DynamoDB",
    "dynamoDb": {
      "tableName": "Clientes",
      "PK": "cliente#001",
      "SK": null,
      "columns": ["nome", "cpf", "email"],
      "resultPath": "dadosCliente",
      "fullScan": false
    }
  }
}
```

> ⚠️ **Nota:** O resultado da consulta ficará disponível nos estados subsequentes pelo identificador definido em `resultPath` (ex: `dadosCliente`).
>

## 3.2. Estado do tipo Task

Representa um ponto de **decisão** no fluxo. Avalia uma lista de condições em sequência e redireciona a execução para o estado correspondente à primeira condição verdadeira.

### Campos específicos

| Campo | Tipo | Obrigatório | Descrição |  |
| --- | --- | --- | --- | --- |
| `conditions` | array | ✅ Sim | Lista de objetos de condição a serem avaliados. |  |
| `conditions[].expression` | string | ✅ Sim | Expressão booleana avaliada em runtime (ex: `'input.age > 18'`). |  |
| `conditions[].next` | string | ✅ Sim | Nome do estado para o qual redirecionar se a expressão for verdadeira. |  |
| `conditions[].resultPath` | string \ | null | ❌ Não | Caminho para armazenar o resultado da condição, se necessário. |

### Exemplo

```json
"TaskStateExample": {
  "type": "task",
  "next": "EstadoPadrao",
  "end": false,
  "loopOver": "false",
  "allowFailOnLoopOver": null,
  "conditions": [
    {
      "expression": "input.age > 18",
      "next": "FluxoMaioridade",
      "resultPath": null
    },
    {
      "expression": "input.age < 18",
      "next": "FluxoMenoridade",
      "resultPath": null
    }
  ]
}
```

> ⚠️ **Nota:** As condições são avaliadas em ordem. A primeira expressão verdadeira define o próximo estado. Se nenhuma condição for satisfeita, o fluxo segue para o estado definido em `next`.
>

## 3.3. Estado do tipo API

Realiza chamadas HTTP a serviços externos. Permite configurar método, headers, corpo da requisição e autenticação.

### Campos específicos

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `resource.route` | string | ✅ Sim | URL completa do endpoint. |
| `resource.method` | string | ✅ Sim | Método HTTP: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`. |
| `resource.headers` | object | ❌ Não | Headers da requisição como pares chave-valor. |
| `resource.body` | object | ❌ Não | Corpo da requisição. Valores podem referenciar o input via `'input.<caminho>'`. |
| `resource.responsePath` | string | ✅ Sim | Identificador para armazenar o corpo da resposta. |
| `resource.authentication` | string | ❌ Não | `'true'` para habilitar autenticação automática via token configurado. |

### Exemplo

```json
"APIStateExample": {
  "type": "API",
  "next": "ProximoEstado",
  "end": false,
  "loopOver": null,
  "resource": {
    "route": "https://api.exemplo.com/clientes",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "correlationId": "9e270e86-b222-4cb7-bd7d-f6dd8f78d19a"
    },
    "body": {
      "cpf": "input.client.cpf"
    },
    "responsePath": "outputApi",
    "authentication": "true"
  }
}
```

> ⚠️ **Nota:** No payload de exemplo há um typo no campo `resource` (escrito como `resoruce`) e `responsePath` (escrito como `reponsePath`). Verificar consistência no código da engine.
>

## 3.4. Estado do tipo Response

Estado terminal que monta e retorna a **resposta final** do fluxo. Deve ter `end: true` e `next: null`. Permite agregar outputs de múltiplos estados anteriores.

### Campos específicos

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `responseBody` | object | ✅ Sim | Objeto que define a estrutura da resposta final. Valores são identificadores de `resultPath` de estados anteriores. |
| `resultPath` | string | ❌ Não | Chave raiz na qual o `responseBody` será encapsulado. |

### Exemplo

```json
"ResponseStateExample": {
  "type": "Response",
  "next": null,
  "end": true,
  "loopOver": null,
  "responseBody": {
    "clientData": "outputApi",
    "databaseData": "outputDatabase"
  },
  "resultPath": "data"
}
```

---

# 4. Diagrama de Fluxo do Exemplo

O payload de exemplo define o seguinte fluxo de execução:

```
[START]
   |
   v
DatabaseStateExample  ──── Consulta DynamoDB → salva em 'outputDatabase'
   |
   v
TaskStateExample  ──────── Avalia condições sobre input.age
   |                         ├─ age > 18 → ReturnHigherThan
   |                         └─ age < 18 → ReturnLowerThan
   v (padrão)
APIStateExample  ────────── POST para API externa → salva em 'outputApi'
   |
   v
ResponseStateExample ────── Monta resposta com outputApi + outputDatabase
   |
[END]
```

---

# 5. Convenções e Boas Práticas

## 5.1. Nomeação de Estados

- Use nomes descritivos em **PascalCase**: `BuscarCliente`, `ValidarIdade`, `ChamarAPICredito`.
- Evite nomes genéricos como `State1` ou `Step2`.
- Cada nome deve ser **único** dentro do objeto `states`.

## 5.2. Gerenciamento de resultPath

- Defina `resultPath` em todo estado que produz dados utilizados posteriormente.
- Use nomes descritivos: `dadosCliente`, `respostaCredito`, `validacaoIdade`.
- Evite sobrescrever `resultPath`s já utilizados em estados anteriores.

## 5.3. Referência a Dados de Input

Para acessar dados da requisição original use a notação `input.<caminho>`. Exemplos:

- `input.age` — campo `age` do body da requisição.
- `input.client.cpf` — campo `cpf` dentro do objeto `client`.
- `input.items[0].id` — primeiro elemento de um array `items`.

## 5.4. Estado Final

- Todo fluxo deve ter **exatamente um** estado com `end: true`.
- Estados com `end: true` devem ter `next: null`.
- Recomenda-se que o estado final seja sempre do tipo `Response`.

---

# 6. Payload de Referência Completo

```json
{
  "id": "9218fd27-a11f-4b8d-ba31-41c4bd599a4f",
  "name": "Hello World Policy",
  "description": "This is a example of policy from the IODM application.",
  "version": "1.0",
  "startAt": "DatabaseStateExample",
  "states": {
    "DatabaseStateExample": {
      "type": "DataBase",
      "next": "TaskStateExample",
      "end": false,
      "loopOver": null,
      "allowFailOnLoopOver": null,
      "resource": {
        "type": "DynamoDB",
        "dynamoDb": {
          "tableName": "exampleTable",
          "PK": "primaryKeyExample",
          "SK": null,
          "columns": ["firstColumnExample", "secondColumnExample"],
          "resultPath": "outputDatabase",
          "fullScan": false
        }
      }
    },
    "TaskStateExample": {
      "type": "task",
      "next": "APIStateExample",
      "end": false,
      "conditions": [
        { "expression": "input.age > 18", "next": "ReturnHigherThan", "resultPath": null },
        { "expression": "input.age < 18", "next": "ReturnLowerThan", "resultPath": null }
      ]
    },
    "APIStateExample": {
      "type": "API",
      "next": "ResponseStateExample",
      "end": false,
      "resource": {
        "route": "https://api.example.com/clientes",
        "method": "POST",
        "headers": { "Content-Type": "application/json" },
        "body": { "cpf": "input.client.cpf" },
        "responsePath": "outputApi",
        "authentication": "true"
      }
    },
    "ResponseStateExample": {
      "type": "Response",
      "next": null,
      "end": true,
      "responseBody": {
        "clientData": "outputApi",
        "databaseData": "outputDatabase"
      },
      "resultPath": "data"
    }
  }
}
```

[🗺️ Plano de Ação — Editor Visual de Workflows (ReactFlow)](https://www.notion.so/Plano-de-A-o-Editor-Visual-de-Workflows-ReactFlow-31740b5db39781938bc4d39f37c51956?pvs=21)
