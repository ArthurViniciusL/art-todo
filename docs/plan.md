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
- `tasks`: id, list_id, title, notes, status (`todo`|`doing`|`done`), priority (0–4: nenhuma, baixa, média, alta, crítico), due_date, due_time (opcional), position (uma única ordem por lista), completed_at, reminded_at (quando o alerta disparou), created_at, updated_at.
- `settings`: tema (`system`|`light`|`dark`), estado da janela, ordem das listas (`manual`|`alpha`).

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
6. Prioridade: marcador à direita (`!`/`!!` em cinza, `!!!` Alta em vermelho suave, `!!!!` Crítico em selo vermelho preenchido).
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
14. Menu de contexto da tarefa (clique direito, `Shift+F10` ou tecla de menu): Editar, Mover para lista, Excluir. O modal também troca a lista da tarefa.
15. Em Colunas, o campo "Nova tarefa" fica no topo da coluna A fazer.
16. Ordem das listas na sidebar: Manual (arrastar, `Alt+↑/↓` ou "Mover para cima/baixo" no menu da lista) ou Alfabética. A escolha fica salva e `Ctrl+1..9` segue a ordem mostrada.
17. Alertas: notificação do sistema na hora da tarefa, ou às 06:00 quando ela só tem data. Funciona só com o app aberto. Vários alertas ao mesmo tempo (ao abrir o app ou às 06:00) viram um resumo. Datas já passadas ao criar ou editar não disparam alerta. Clicar no alerta abre a tarefa, ou a visão Hoje no caso do resumo.
18. Atualização pelo app: ícone no topo da sidebar verifica, baixa e instala novas versões do GitHub Releases. O `.deb` é conferido pelo SHA-256 das notas e instalado com `pkexec` (senha do sistema); o app reinicia na versão nova. Verificação automática ao abrir e a cada 24 h, com opção de desligar na paleta. Ver ADR-0004.
19. **Entrada como visão geral**: a Entrada mostra as tarefas abertas de todas as listas. Ela continua sendo uma lista real, destino das tarefas novas e das tarefas de listas apagadas.
    - Em Lista e Cards, há uma seção por lista: a Entrada primeiro, depois as listas na ordem da sidebar. Seção sem tarefas abertas fica oculta. Cada seção pode ser recolhida (estado só em memória). A linha não repete o nome da lista.
    - DnD reordena só dentro da seção. Para mudar a lista, use o menu de contexto ou o modal.
    - Uma única seção "Concluídas" no fim reúne as tarefas feitas de todas as listas, mais recentes primeiro, com o nome da lista na linha.
    - Em Colunas, não há seções: a linha mostra o nome da lista, arrastar entre colunas muda o status e não há reordenação dentro da coluna.
    - O campo "Nova tarefa" cria na Entrada. `J K` e `↑↓` atravessam as seções e pulam as recolhidas. `Tab` chega ao cabeçalho da seção e `Enter` recolhe ou expande.
    - Para ver uma lista só, o usuário a seleciona na sidebar. O export usa `# Entrada` e um `## <lista>` por seção.

**v2 (fora do escopo agora):** tags, subtarefas, recorrência, backup/import JSON, tray, pastas de listas, quick-add global.

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

Status (2026-10-26): fases 0–7 entregues (PRs #1–#7). O ícone do app vem da imagem fornecida pelo usuário, em `build/icon-source.png`.

Mudanças pedidas na fase 8: o acento padrão passa a ser o do HeroUI (`#0485F7`), com seletor de cor hex na sidebar; os status usam as cores do HeroUI (A fazer = danger, Fazendo = warning, Feito = success). Ver `docs/design-tokens.md`.

0. `git init`, repo GitHub, scaffold (electron-vite + React + TS + HeroUI v3 + Tailwind v4, pnpm hoisted), CI, `CLAUDE.md` (`init`), ADRs.
1. Design system: tokens #FFCA39, Open Sans local, tema claro/escuro/sistema, titlebar, layout base.
2. Dados: Drizzle schema (com `status` e `due_time` desde já), migrations, IPC tipado. Depois, criar as 5 skills customizadas.
3. Listas + Entrada + CRUD + seletor de status + concluir/desfazer + modal + exclusões com undo.
4. Datas/hora, prioridade, visões Hoje/Próximos.
5. Modos Cards e Colunas (salvos por lista).
6. DnD (lista + entre colunas), command palette, atalhos.
7. Export Markdown (arquivo + clipboard).
8. E2E, polimento, ícone do usuário, release `.deb` v1.0.0.
9. Ajustes de tarefas: prioridade Crítico, menu de contexto, mover tarefa entre listas, "Nova tarefa" na coluna A fazer.
10. Ordem das listas na sidebar: alfabética ou manual (arrastar).
11. Alertas: notificação do sistema na hora da tarefa (06:00 quando só tem data), só com o app aberto. Alertas perdidos viram um resumo ao abrir.
12. Atualização pelo app (GitHub Releases + pkexec).
13. Entrada como visão geral: todas as tarefas de todas as listas, em seções por lista.

## Verificação

- Por fase: `pnpm lint`, `pnpm typecheck`, `pnpm test` (Vitest) e `pnpm test:e2e` (Playwright Electron) verdes no CI do PR. Abrir o app com a skill `run` e testar o fluxo da fase.
- Final: `pnpm build:linux` gera o `.deb`. Instalar com `sudo apt install ./dist/art-todo_1.0.0_amd64.deb` e confirmar que abre, persiste os dados entre reinícios e que o export `.md` sai no formato definido.
