---
domain: workspace
prefix: WS
status: draft
---
# Workspace

Onde os arquivos ficam e qual o formato de cada um.

## WS-001 Estrutura

O workspace DEVE ter esta estrutura dentro do projeto:

```
flow/
├── project.md           # contexto + configuração
├── specs/<domínio>.md   # spec viva, um arquivo por domínio
├── changes/<id>.md      # uma mudança = um arquivo
├── archive/             # mudanças concluídas (AAAA-MM-DD-<id>.md)
└── .active              # efêmero: fase em execução agora (ignorado pelo git)
```

## WS-002 Inicialização automática

Na primeira execução de `/flow` num projeto sem `flow/`, o Flow DEVE:

1. Detectar a stack pelos arquivos do projeto (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml` e similares).
2. Propor os `commands` (test, lint, typecheck, build) e pedir sua confirmação.
3. Criar a estrutura, o `project.md` a partir do template e a entrada de `.active` no `.gitignore`.

### Cenário: projeto Node existente
- Dado um projeto com `package.json` contendo os scripts `test` e `lint` e sem pasta `flow/`
- Quando você roda `/flow adicionar login`
- Então o Flow propõe `test: npm test` e `lint: npm run lint`, grava após sua confirmação e abre a mudança

## WS-003 Schema do project.md

O frontmatter de `project.md` DEVE aceitar as chaves abaixo, todas opcionais exceto `schema`:

| Chave | Valores | Padrão |
|---|---|---|
| `schema` | inteiro | `1` |
| `commands.test` / `lint` / `typecheck` / `build` | comando de shell | vazio |
| `review` | `light` \| `standard` \| `strict` | `standard` |
| `profile` | `fast` \| `balanced` \| `deep` | `balanced` |
| `phases.<fase>.model` | `haiku` \| `sonnet` \| `opus` \| `fable` \| ID completo | do perfil |
| `phases.<fase>.effort` | `low` \| `medium` \| `high` \| `xhigh` \| `max` | do perfil |
| `phases.<fase>.context` | lista de caminhos ou globs | vazio |
| `phases.<fase>.skills` | lista de nomes de skills | vazio |
| `phases.<fase>.mcp` | lista de nomes de servidores MCP | vazio |
| `ship.mode` | `pr` \| `commit` \| `none` | `pr` |
| `ship.base` | nome de branch | branch padrão do repositório |

O corpo é livre (propósito, stack, convenções, princípios) e é lido por todas as fases.

## WS-004 Formato da spec

Cada `specs/<domínio>.md` DEVE ter:

- frontmatter com `domain`, `prefix` (2 a 4 letras maiúsculas) e `status` (`draft` \| `active`);
- um título e uma descrição curta do domínio;
- requisitos como `## <PREFIXO>-NNN Título`, com enunciado usando DEVE (obrigatório) ou PODE (opcional);
- cenários `### Cenário:` com Dado / Quando / Então, recomendados para requisitos de comportamento.

Um ID nunca é reutilizado. O próximo ID é o maior já usado no domínio, somando `specs/` e `archive/`, mais um.

## WS-005 Schema da mudança

O frontmatter de `changes/<id>.md` DEVE ter:

| Chave | Valores |
|---|---|
| `id` | kebab-case, igual ao nome do arquivo |
| `phase` | `discovery` \| `plan` \| `execute` \| `verify` \| `doc` \| `ship` \| `done` |
| `status` | `doing` \| `review` \| `changes` \| `waiting-you` \| `done` |
| `approved` | lista das fases concluídas |
| `round` | rodada de review da fase atual |
| `review` | preset efetivo (`light` \| `standard` \| `strict`) |
| `profile` | opcional: override do perfil só para esta mudança |
| `specs` | lista de domínios afetados |
| `created` | data AAAA-MM-DD |

## WS-006 Seções da mudança

O corpo da mudança DEVE ter estas seções, nesta ordem:

1. **Discovery**: problema, para quem, restrições, fora de escopo, critérios de sucesso, perguntas abertas (EN-011).
2. **Plan**: Abordagem, Riscos, Dúvidas, Spec delta (WS-007), Tasks (checkboxes, cada uma com os IDs de requisito que cobre).
3. **Verify**: tabela requisito → evidência.
4. **Reviews**: uma linha por rodada (`fase · revisor · veredito`, com os itens).
5. **Log**: o que rodou (`data · fase · papel · modelo/esforço · preset · resultado`).

## WS-007 Formato do spec delta

O delta DEVE ser agrupado por domínio e cada entrada ser uma de:

- `ADDED <ID> <título>`, com o texto completo do novo requisito;
- `MODIFIED <ID> <título>`, com o texto completo da nova versão;
- `REMOVED <ID> <título>`, com o motivo.

O delta precisa ser autossuficiente para que a fase Doc consiga aplicá-lo sem consultar outra fonte.

## WS-008 Domínio novo (bootstrap)

Quando uma mudança cria um domínio inteiro, os requisitos PODEM ser escritos direto em `specs/<domínio>.md` com `status: draft`, e o delta apenas referencia o arquivo. Na fase Doc, o status vira `active`. Se a mudança for abandonada, o arquivo draft é removido.

## WS-009 Schema estável e documentado

Os schemas de frontmatter de `project.md`, das specs e das mudanças DEVEM estar documentados no README do plugin. Uma mudança incompatível exige incrementar `schema`. O objetivo é que outras ferramentas, como a UI da v2, consigam ler os arquivos com segurança.

## WS-010 Arquivos como única fonte de verdade

Nenhum estado do fluxo DEVE existir fora de `flow/`. `flow/.active` é a única exceção: é derivado, efêmero e pode ser apagado a qualquer momento sem perda.
