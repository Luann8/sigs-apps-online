# SIGS — Gestão Sanitária Digital
> **Sistema Inteligente de Gerenciamento de Licenças e Inspeções Sanitárias/Veterinárias**
#### Figura 1 – Arquitetura do sistema SIGS

```mermaid
flowchart TD
    %% Estilos visuais
    classDef client fill:#E0F2F1,stroke:#00796B,stroke-width:2px,color:#004D40;
    classDef edge fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1;
    classDef backend fill:#FFF3E0,stroke:#E65100,stroke-width:2px,color:#BF360C;
    classDef cicd fill:#F3E5F5,stroke:#6A1B9A,stroke-width:2px,color:#4A148C;

    subgraph CI_CD ["Esteira de Integração e Deploy Contínuo (CI/CD)"]
        DEV["Desenvolvedor / Repositório Git"]
        GHA["GitHub Actions Workflow\n(Lint, Testes Vitest & Build)"]
        DEV -->|"git push (branch main)"| GHA
    end

    subgraph EDGE_LAYER ["Camada de Borda & Distribuição (Cloudflare)"]
        CF_PAGES["Cloudflare Pages / CDN Global\n(Distribuição estática de alta disponibilidade)"]
        SPA_ROUTING["Roteamento SPA & Cache Edge\n(Low Latency)"]
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
        SERVERLESS_FN["Funções Serverless\n(Queries, Mutations & Validação de Acesso)"]
        CONVEX_DB[("Banco de Dados Reativo Convex\n(Índices, Documentos & Tipagem TypeScript)")]
        
        WS_GATEWAY <--> SERVERLESS_FN
        SERVERLESS_FN <--> CONVEX_DB
    end

    %% Conexões entre camadas
    GHA -->|"Deploy Automatizado (Artifacts)"| CF_PAGES
    CF_PAGES -->|"Serve Assets (HTML / JS / CSS)"| UI
    CONVEX_CLIENT <-->|"Sincronização Bidirecional em Tempo Real"| WS_GATEWAY

    class UI,ROUTER,STATE,CONVEX_CLIENT client;
    class CF_PAGES,SPA_ROUTING edge;
    class WS_GATEWAY,SERVERLESS_FN,CONVEX_DB backend;
    class DEV,GHA cicd;


---

### Figura 6 – Diagrama Entidade-Relacionamento (Modelo de Dados do Convex)

```markdown
#### Figura 6 – Diagrama Entidade-Relacionamento (Modelo de Dados do Convex)

```mermaid
erDiagram
    usuarios ||--o{ estabelecimentos : "cadastra / gerencia (userId)"
    usuarios ||--o{ licencas : "registra / monitora (userId)"
    usuarios ||--o{ inspecoes : "realiza vistoria (userId)"
    usuarios ||--o{ eventos : "agenda / conclui (userId)"

    estabelecimentos ||--|{ licencas : "possui (estabelecimentoId)"
    estabelecimentos ||--o{ eventos : "possui agendamentos (estabelecimentoId)"

    licencas ||--o{ inspecoes : "possui historico de (licencaId)"
    licencas ||--o{ eventos : "origina alertas de prazo (licencaId)"

    usuarios {
        string _id PK
        string nome
        string email "UK (Index by_email)"
        string senha "Hash / Credencial"
        string role "Fiscal, RT, Gestor, Admin"
        boolean ativo
        string status "pendente | aprovado | bloqueado"
        string telefone "opcional"
        string orgaoSetor "opcional"
        boolean podeLerTodos "Controle de escopo"
        boolean podeEditar "Permissão de escrita"
        string aprovadoPor "opcional"
        string aprovadoEm "opcional"
    }

    estabelecimentos {
        string _id PK
        string userId FK "Index by_user"
        string nome "Razao Social / Nome Fantasia"
        string cnpj "Cadastro fiscal"
        string endereco
        string telefone "opcional"
        string email "opcional"
        string responsavel "Nome do Responsavel Tecnico"
        string crmv "Registro profissional (opcional)"
        string tipo "veterinaria | sanitaria"
    }

    licencas {
        string _id PK
        string estabelecimentoId FK "Index by_estabelecimento"
        string userId FK "Index by_user"
        string codigo "Identificador legivel (ex: LIC-001)"
        string tipoLicenca "Tipo regulatorio (ex: alvara_sanitario)"
        string status "Legado (ativa | pendente | vencida | suspensa)"
        string situacao "Ciclo de vida (em_dia | a_vencer | vencida | etc.)"
        string protocoloRenovacao "opcional"
        string dataEmissao "YYYY-MM-DD"
        string dataVencimento "YYYY-MM-DD"
        string anexoUri "Link em nuvem / Google Drive (opcional)"
        number custo "Valor da taxa (opcional)"
    }

    inspecoes {
        string _id PK
        string licencaId FK "Index by_licenca"
        string userId FK
        string data "Data da vistoria"
        string resultado "aprovado | reprovado | pendencias"
        string fiscal "Nome do agente fiscal"
        string observacoes "Notas tecnicas (opcional)"
    }

    eventos {
        string _id PK
        string userId FK "Index by_user"
        string data "Index by_data (YYYY-MM-DD)"
        string titulo
        string descricao "opcional"
        string tipo "vistoria | renovacao | prazo"
        string licencaId FK "opcional"
        string estabelecimentoId FK "opcional"
        boolean concluido
    }
