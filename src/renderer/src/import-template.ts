/** Prompt the user copies into an AI chat to get tasks in the import format. */
export const AI_IMPORT_TEMPLATE = `Gere uma lista de tarefas em Markdown seguindo exatamente este formato, para eu importar no Art Todo.

Regras:
- Uma tarefa por linha, começando com "- [ ] " (a fazer) ou "- [x] " (concluída).
- Campos opcionais vêm depois do título, separados por " | ", no formato "chave: valor", em inglês:
  - status: todo, doing ou done
  - due: data AAAA-MM-DD, com hora opcional HH:MM (ex.: due: 2026-10-25 09:30)
  - priority: none, low, medium, high ou critical
- Notas da tarefa vão nas linhas logo abaixo, indentadas com 2 espaços.
- Títulos com # ou ## são opcionais e servem só para organizar.
- Não use emojis nem outros campos.

Exemplo:

# Mercado

- [ ] Comprar pão
- [ ] Relatório | status: doing | due: 2026-10-25 | priority: high
- [x] Pagar luz | due: 2026-10-20 09:30
  Conta de outubro.

Tarefas que eu quero: <descreva aqui>
`
