# Art Todo — Plano consolidado

## Contexto

Construir um app desktop de todo list, local e offline, empacotado com Electron e distribuído como `.deb`. A pasta `/home/arthur/Coding/art-todo` está vazia e sem git. O ambiente tem Node 22.23, pnpm 11.15 e `gh` logado como `ArthurViniciusL`. As versões atuais são HeroUI 3.2.6, Electron 45 e electron-vite 6. Este documento consolida as decisões da sessão de grilling (Q1–Q37). Ele define funcionalidades, identidade visual, stack, fluxo de trabalho e as skills que o Claude usa para construir o projeto.

## Stack

- **Electron 45** + **electron-vite 6** + **React + TypeScript**.
- **HeroUI v3** (React Aria) + **Tailwind CSS v4**. Ícones **Lucide**.
- **SQLite** via `better-sqlite3` + **Drizzle ORM** com migrations geradas. O banco fica em `app.getPath('userData')`.
- Renderer: **TanStack Query** sobre o IPC para os dados e **Zustand** só para o estado de UI.
- DnD: **react-aria DnD**.
- Testes: **Vitest** (lógica e dados) + **Playwright for Electron** (E2E: criar, concluir, reordenar, exportar).
- **pnpm** com `node-linker=hoisted`. **electron-builder** com target Linux `.deb`, com o config pronto para adicionar win/mac depois.
- Idioma: UI em PT-BR, código e commits em inglês. A estrutura fica pronta para i18n, sem implementar agora.

## Modelo de dados (resumo)

- `lists`: id, name, position, view_mode (`list`|`cards`|`columns`), is_inbox, created_at.
  - A **Entrada** é fixa: não pode ser apagada nem renomeada.
  - Uma lista criada sem nome recebe `dd/mm/yy - hh:mm:ss`. O nome é gravado na criação e pode ser editado depois.
- `tasks`: id, list_id, title, notes, status (`todo`|`doing`|`done`), priority (0–3: nenhuma, baixa, média, alta), due_date, due_time (opcional), position (uma única ordem por lista), completed_at, created_at, updated_at.
- `settings`: tema (`system`|`light`|`dark`), estado da janela.

## Funcionalidades MVP (v1)

1. CRUD de tarefas. O título é editável inline (`Enter`). Um **modal** edita notas, data/hora e prioridade (`Ctrl+Enter` ou duplo clique).
2. **3 estados**: A fazer / Fazendo / Feito.
   - O seletor de status é um ícone: `Circle` / `CircleDot` (amarelo) / `CircleCheck` (preenchido em amarelo, com check escuro).
   - O clique abre um popover (React Aria `Menu`) com os 3 estados.
   - Um tooltip (~400 ms) mostra o estado atual + uma dica.
   - Atalhos: `Espaço` marca Feito, `S` cicla os estados.
   - Ao ir para Feito: animação, a tarefa fica riscada no lugar por ~3 s com "desfazer", e depois desce para a seção "Concluídas" recolhível.
3. Várias listas + Entrada. Exclusão de lista: um diálogo oferece "Apagar tudo" ou "Mover tarefas para Entrada".
4. Exclusão de tarefa: imediata, com toast "desfazer" (~5 s).
5. Data + hora opcional. Visões **Hoje** (atrasadas em seção própria + hoje) e **Próximos** (7 dias agrupados por dia + grupo "Depois"). As visões ordenam por hora e depois por prioridade.
6. Prioridade: marcador à direita (`!`/`!!`/`!!!` em cinza, com Alta em vermelho suave).
7. **Modos de visualização**: Lista, Cards (com label de status) e Colunas (A fazer | Fazendo | Feito).
   - O modo fica salvo por lista. Os três modos existem em todas as visões. Nas visões inteligentes, Colunas mostra só os status e perde o agrupamento por dia.
   - Troca de modo por botões segmentados no cabeçalho + `Ctrl+Shift+1/2/3`.
8. DnD só dentro das listas, onde a ordem é manual. Em Colunas, arrastar entre colunas muda o status. Arrastar para Feito dispara a animação. A ordem é um único `position` filtrado por status. A coluna Feito mostra as mais recentes primeiro e pode ser recolhida.
9. Busca + **command palette** (`Ctrl+K`), com busca e ações.
10. Atalhos: `N` nova tarefa · `Enter` editar · `Espaço` Feito · `S` ciclar status · `↑↓`/`J K` navegar · `Del` excluir · `Ctrl+K` palette · `Ctrl+1..9` trocar de lista · `T` definir "hoje" · `Ctrl+Z` desfazer.
11. Tema claro/escuro: segue o sistema, com override manual.
12. **Export Markdown** da lista atual ou da visão atual. O destino é salvar `.md` com diálogo e/ou copiar para o clipboard.
    - Formato GFM: `# Nome`, `- [x]`/`- [ ]` + título + sufixo `— ⏳ fazendo · 📅 2026-10-25 · !alta`. As notas vão indentadas abaixo da tarefa.
    - Uma opção inclui ou omite as concluídas. A partir do modo Colunas, há a opção de agrupar por `## A fazer / ## Fazendo / ## Feito`.
    - O nome do arquivo é sanitizado (`/` e `:` viram `-`). O título `#` mantém o nome original.
13. Janela: instância única, lembra tamanho e posição, e fechar encerra o app.

**v2 (fora do escopo agora):** tags, subtarefas, lembretes/notificações, recorrência, backup/import JSON, tray, pastas de listas, quick-add global.

## Identidade visual

- Direção: minimalista e calmo (estilo Things/Linear), com microinterações pontuais (animação de conclusão).
- Acento **#FFCA39**, usado como preenchimento (status, botão primário, seleção, foco) com texto escuro `#1A1A1A`. No tema claro, texto e links de acento usam a variante escura ~`#8A6500`. No tema escuro, `#FFCA39` serve direto como texto. O `design:accessibility-review` valida os tokens.
- Fonte **Open Sans**, empacotada localmente (sem Google Fonts em runtime).
- Layout em 2 colunas: sidebar (visões + listas) e conteúdo. Edição detalhada em modal.
- Titlebar customizada integrada à sidebar, com fallback para os controles nativos no Linux.
- Nome de exibição **Art Todo**, pacote `art-todo`. O usuário fornece o ícone: PNG 1024×1024 transparente (mínimo 512×512) em `build/icon.png`.

## Fluxo de trabalho

- Repo público `ArthurViniciusL/art-todo`. Uma branch + um PR por fase.
- CI (GitHub Actions) no PR: lint, typecheck, Vitest e Playwright.
- Release: uma tag `v*` gera o `.deb` e o anexa ao GitHub Release.
- Ciclo por feature: branch, implementação, testes, `simplify`, `code-review` e PR.

## Skills

**Existentes (usar):**

- `init`: CLAUDE.md do projeto.
- `engineering:architecture`: ADRs iniciais (stack, dados, IPC).
- `engineering:testing-strategy`: plano de testes.
- `design:design-system`: tokens.
- `design:ux-copy`: textos PT-BR.
- `design:accessibility-review`: contraste e teclado.
- `simplify` e `code-review`: antes de cada PR.
- `run`: validar o app rodando.
- `skill-creator`: criar as skills do projeto.

**Customizadas (`.claude/skills/`, criadas depois da fase 2 para referenciar arquivos reais):**

1. `ipc-endpoint`: contrato compartilhado, handler no main, API no preload e hook Query no renderer.
2. `db-migration`: alterar o schema Drizzle, gerar a migration e testar.
3. `ui-component`: componente sobre HeroUI seguindo os tokens.
4. `feature-workflow`: ciclo branch, testes, simplify/code-review e PR.
5. `release-deb`: bump de versão, tag e verificação do `.deb`.

## Roadmap (1 branch/PR por fase)

0. `git init`, repo GitHub, scaffold (electron-vite + React + TS + HeroUI v3 + Tailwind v4, pnpm hoisted), CI, `CLAUDE.md` (`init`), ADRs.
1. Design system: tokens #FFCA39, Open Sans local, tema claro/escuro/sistema, titlebar, layout base.
2. Dados: Drizzle schema (com `status` e `due_time` desde já), migrations, IPC tipado. Depois, criar as 5 skills customizadas.
3. Listas + Entrada + CRUD + seletor de status + concluir/desfazer + modal + exclusões com undo.
4. Datas/hora, prioridade, visões Hoje/Próximos.
5. Modos Cards e Colunas (salvos por lista).
6. DnD (lista + entre colunas), command palette, atalhos.
7. Export Markdown (arquivo + clipboard).
8. E2E, polimento, ícone do usuário, release `.deb` v1.0.0.

## Verificação

- Por fase: `pnpm lint`, `pnpm typecheck`, `pnpm test` (Vitest) e `pnpm test:e2e` (Playwright Electron) verdes no CI do PR. Abrir o app com a skill `run` e testar o fluxo da fase.
- Final: `pnpm build:linux` gera o `.deb`. Instalar com `sudo apt install ./dist/art-todo_1.0.0_amd64.deb` e confirmar que abre, persiste os dados entre reinícios e que o export `.md` sai no formato definido.
