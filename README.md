O erro ocorreu porque os blocos de código estavam aninhados (um bloco de Markdown envolvendo o bloco do Mermaid), o que fez o leitor do GitHub interpretar o texto comum como se ainda fosse código do diagrama.

Abaixo estão os diagramas separados, **prontos para copiar individualmente** (sem blocos aninhados):

---

### Figura 1 – Arquitetura do Sistema SIGS

Copie exatamente o bloco abaixo:

```mermaid
flowchart TD
    classDef client fill:#E0F2F1,stroke:#00796B,stroke-width:2px,color:#004D40;
    classDef edge fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1;
    classDef backend fill:#FFF3E0,stroke:#E65100,stroke-width:2px,color:#BF360C;
    classDef cicd fill:#F3E5F5,stroke:#6A1B9A,stroke-width:2px,color:#4A148C;

    subgraph CI_CD ["Esteira de Integração e Deploy Contínuo (CI/CD)"]
        DEV["Desenvolvedor / Repositório Git"]
        GHA["GitHub Actions Workflow<br/>(Lint, Testes Vitest & Build)"]
        DEV --> GHA
    end

    subgraph EDGE_LAYER ["Camada de Borda & Distribuição (Cloudflare)"]
        CF_PAGES["Cloudflare Pages / CDN Global<br/>(Distribuição estática de alta disponibilidade)"]
        SPA_ROUTING["Roteamento SPA & Cache Edge<br/>(Low Latency)"]
        CF_PAGES --- SPA_ROUTING
    end

    subgraph FRONTEND ["Camada Cliente / Frontend (SPA Web)"]
        UI["Interface de Usuário (React / Next.js + Tailwind CSS)"]
        ROUTER["Roteamento Client-Side (React Router)"]
        STATE["Gerenciamento de Estado (Zustand)"]
        CONVEX_CLIENT["Convex React Client / WebSocket"]
        
        UI <--> ROUTER
        UI <--> STATE
        UI <--> CONVEX_CLIENT
    end

    subgraph BACKEND ["Camada de Backend Serverless & Dados (Convex Cloud)"]
        WS_GATEWAY["Gateway em Tempo Real (WebSocket / Subscriptions)"]
        SERVERLESS_FN["Funções Serverless<br/>(Queries, Mutations & Validação de Acesso)"]
        CONVEX_DB[("Banco de Dados Reativo Convex<br/>(Índices, Documentos & Tipagem TypeScript)")]
        
        WS_GATEWAY <--> SERVERLESS_FN
        SERVERLESS_FN <--> CONVEX_DB
    end

    GHA --> CF_PAGES
    CF_PAGES --> UI
    CONVEX_CLIENT <--> WS_GATEWAY

    class UI,ROUTER,STATE,CONVEX_CLIENT client;
    class CF_PAGES,SPA_ROUTING edge;
    class WS_GATEWAY,SERVERLESS_FN,CONVEX_DB backend;
    class DEV,GHA cicd;
```

**Fonte:** Elaborado pelos autores (2026).

---

### Figura 6 – Diagrama Entidade-Relacionamento (Modelo de Dados do Convex)

Copie exatamente o bloco abaixo:

```mermaid
erDiagram
    usuarios ||--o{ estabelecimentos : "cadastra"
    usuarios ||--o{ licencas : "registra"
    usuarios ||--o{ inspecoes : "vistoria"
    usuarios ||--o{ eventos : "agenda"

    estabelecimentos ||--|{ licencas : "possui"
    estabelecimentos ||--o{ eventos : "agendamentos"

    licencas ||--o{ inspecoes : "historico"
    licencas ||--o{ eventos : "alertas"

    usuarios {
        string _id PK
        string nome
        string email
        string senha
        string role
        boolean ativo
        string status
        string telefone
        string orgaoSetor
        boolean podeLerTodos
        boolean podeEditar
    }

    estabelecimentos {
        string _id PK
        string userId FK
        string nome
        string cnpj
        string endereco
        string telefone
        string email
        string responsavel
        string crmv
        string tipo
    }

    licencas {
        string _id PK
        string estabelecimentoId FK
        string userId FK
        string codigo
        string tipoLicenca
        string status
        string situacao
        string protocoloRenovacao
        string dataEmissao
        string dataVencimento
        string anexoUri
        number custo
    }

    inspecoes {
        string _id PK
        string licencaId FK
        string userId FK
        string data
        string resultado
        string fiscal
        string observacoes
    }

    eventos {
        string _id PK
        string userId FK
        string data
        string titulo
        string descricao
        string tipo
        string licencaId FK
        string estabelecimentoId FK
        boolean concluido
    }
```

**Fonte:** Elaborado pelos autores (2026).

---

### Figura 7 – Distribuição de Status de Licenças (Cenários de Teste)

Copie exatamente o bloco abaixo:

```mermaid
pie title Distribuição de Situação das Licenças (Cenários Simulados)
    "Ativas / Em Dia (Sem Risco)" : 60
    "Próximas do Vencimento (Atenção)" : 25
    "Vencidas / Irregulares (Crítico)" : 15
```

**Fonte:** Elaborado pelos autores (2026).
