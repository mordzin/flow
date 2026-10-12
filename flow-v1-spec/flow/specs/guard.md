---
domain: guard
prefix: GD
status: draft
---
# Guard

As regras que não podem depender do modelo seguir instruções. São aplicadas por hook, de forma determinística.

## GD-001 Hooks do plugin

O plugin DEVE registrar, em `hooks/hooks.json`:

- um hook `PreToolUse` que executa o guard antes de cada ferramenta;
- um hook `SessionStart` que remove um `flow/.active` órfão de uma sessão anterior e verifica se o Node está disponível (GD-007).

As regras ficam no hook do plugin porque subagentes de plugin ignoram hooks declarados no próprio frontmatter.

## GD-002 Inativo fora do Flow

Sem `flow/.active`, o guard DEVE permitir tudo. O Flow não interfere no uso normal do Claude Code.

### Cenário: uso normal
- Dado um projeto com `flow/` e nenhuma fase em execução
- Quando você pede ao Claude para editar um arquivo qualquer
- Então o guard não bloqueia nada

## GD-003 Política por fase

Com uma fase em execução, o guard DEVE aplicar:

| Fase | Edit / Write | Bash |
|---|---|---|
| discovery | só dentro de `flow/` | livre, exceto `git commit`, `git push` e `gh pr` |
| plan | só dentro de `flow/` | livre, exceto `git commit`, `git push` e `gh pr` |
| execute | livre | livre, exceto `git push` e `gh pr` |
| verify | só dentro de `flow/` | livre, exceto `git commit`, `git push` e `gh pr` |
| doc | `flow/`, `README*`, `CHANGELOG*` e `docs/**` | livre, exceto `git commit`, `git push` e `gh pr` |
| ship | só dentro de `flow/` | livre, com `git push` e `gh pr` sujeitos a GD-005 |

### Cenário: edição de código no plan
- Dado `flow/.active` com `phase: plan`
- Quando o worker tenta editar `src/auth.ts`
- Então o guard bloqueia e explica que código só pode ser editado no Execute

## GD-004 Reviewer somente leitura

Quando a ferramenta é chamada pelo reviewer, o guard DEVE permitir no Bash apenas:

- os comandos configurados em `commands`;
- `git diff`, `git log`, `git show`, `git status`;
- comandos de leitura (`ls`, `cat`, `head`, `tail`, `wc`).

Todo o resto é bloqueado. O reviewer não tem `Edit` nem `Write` (EN-001).

## GD-005 Gate do Ship

`git push` e `gh pr create` DEVEM ser bloqueados, a menos que:

- a fase em execução seja `ship`; e
- `approved` da mudança contenha `plan`, `execute`, `verify` e `doc`.

## GD-006 Mensagens de bloqueio

Todo bloqueio DEVE dizer o que foi bloqueado, qual regra se aplicou (fase e ID do requisito) e o que fazer para seguir.

## GD-007 Dependência e falha visível

O guard DEVE ser um script Node sem pacotes npm. O Node é uma dependência declarada, com versão mínima no README, porque o instalador nativo do Claude Code não o inclui.

O guard NÃO DEVE falhar em silêncio. Um hook que termina com código diferente de 2 não bloqueia a ferramenta, então:

- o `SessionStart` DEVE checar a presença do `node` com um comando de shell e, se ele faltar, avisar de forma visível que o guard está desligado;
- com `flow/.active` presente, um erro interno do guard DEVE resultar em bloqueio (código 2) com mensagem, nunca em liberação.

### Cenário: Node ausente
- Dado um ambiente sem `node` no PATH
- Quando uma sessão do Claude Code começa num projeto com `flow/`
- Então você vê o aviso de que o guard está desligado e como instalar o Node
