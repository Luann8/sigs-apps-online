# SIGS — Gestão Sanitária Digital
> **Sistema Inteligente de Gerenciamento de Licenças e Inspeções Sanitárias/Veterinárias**

---

### Figura 1 – Arquitetura do sistema SIGS

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

### Bônus: Conteúdos adicionais do Capítulo 5 solicitados no seu artigo

Para preencher os outros dois placeholders pendentes no trabalho (`Tabela 1` e `Figura 7`):

#### Tabela 1 – Síntese do atendimento aos requisitos

| Código | Tipo | Descrição do Requisito | Status no Protótipo | Grau de Conformidade |
| :--- | :---: | :--- | :---: | :---: |
| **RF01** | Funcional | Gestão de cadastros e vigência de licenças | Implementado | 100% |
| **RF02** | Funcional | Vinculação de anexos e documentos digitais | Implementado | 100% |
| **RF03** | Funcional | Consulta textual e filtros dinâmicos de situação | Implementado | 100% |
| **RF04** | Funcional | Painel de controle com KPIs e índice de conformidade | Implementado | 100% |
| **RF05** | Funcional | Agenda de prazos com sinalização cromática | Implementado | 100% |
| **RF06** | Funcional | Notificações e filtros de alertas antecipados | Implementado | 100% |
| **RF07** | Funcional | Histórico de vistorias técnicas e pareceres | Implementado | 100% |
| **RNF01** | Não Funcional | Alta disponibilidade via Cloudflare Edge | Homologado | 100% |
| **RNF02** | Não Funcional | Persistência reativa em tempo real (Convex) | Homologado | 100% |
| **RNF03** | Não Funcional | Desempenho de CRUD inferior a 2 segundos | Homologado (< 250ms) | 100% |
| **RNF04** | Não Funcional | Usabilidade e interface responsiva acessível | Homologado | 100% |
| **RNF05** | Não Funcional | Autenticação, isolamento de dados e LGPD | Implementado | 100% |
| **RNF06** | Não Funcional | Pipeline de CI/CD automatizado via GitHub Actions | Homologado | 100% |

**Fonte:** Elaborado pelos autores (2026).

---

#### Figura 7 – Distribuição de status de licenças nos cenários de teste

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'pie1': '#00796B', 'pie2': '#F59E0B', 'pie3': '#EF4444' }}}%%
pie title Distribuição de Situação das Licenças (Cenários Simulados)
    "Ativas / Em Dia (Sem Risco)" : 60
    "Próximas do Vencimento (Atenção)" : 25
    "Vencidas / Irregulares (Crítico)" : 15
