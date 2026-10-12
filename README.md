# Flow

Plugin do Claude Code para desenvolvimento orientado a especificação. Leva uma ideia até um PR revisado em seis fases, **Discovery → Plan → Execute → Verify → Doc → Ship**. Cada fase roda num subagente com contexto limpo, o review é independente e a spec fica viva em `flow/`.

## Requisitos

| Dependência | Versão mínima | Por quê |
|---|---|---|
| Claude Code | v2.1.292 | modelo e esforço passados por chamada de subagente (MD-003) |
| Node.js | 18 | o guard é um script Node sem pacotes npm (GD-007) |
| `gh` (opcional) | qualquer | só para `ship.mode: pr` |

O instalador nativo do Claude Code não inclui o Node. Sem `node` no PATH, o guard fica desligado e o Flow avisa no início de cada sessão num projeto com `flow/`.

Plataformas: macOS, Linux e WSL.

## Instalação

```
/plugin marketplace add mordzin/flow
/plugin install flow@flow
```

Para desenvolver o plugin localmente: `claude --plugin-dir /caminho/para/flow`.

## Uso

O plugin expõe um único comando. Como toda skill de plugin, ele leva o prefixo do plugin: `/flow:flow` (digitar `/flow` e escolher na lista também funciona).

| Uso | Efeito |
|---|---|
| `/flow:flow <descrição>` | Abre uma nova mudança e começa o Discovery |
| `/flow:flow` | Mostra o estado e continua de onde parou |
| `/flow:flow <id>` | Seleciona uma mudança específica |

Na primeira execução num projeto sem `flow/`, o Flow detecta a stack, propõe os `commands` e cria a estrutura depois da sua confirmação.

Nos gates, responda em linguagem natural: "ok" aprova, "refaz considerando X" pede mudanças, "volta pro plan" volta uma fase. Não há subcomandos.

### Fases

| Fase | O que faz | Edita |
|---|---|---|
| discovery | problema, critérios de sucesso, perguntas abertas | só `flow/` |
| plan | abordagem, riscos, spec delta, tasks | só `flow/` |
| execute | um worker por task, em ordem | tudo |
| verify | evidência por requisito e por critério | só `flow/` |
| doc | aplica o delta em `flow/specs/`, README, CHANGELOG, `docs/` | `flow/`, `README*`, `CHANGELOG*`, `docs/**` |
| ship | arquiva a mudança, commit, push e PR conforme `ship.mode` | só `flow/` |

O guard (hook `PreToolUse`) aplica essa tabela enquanto uma fase roda. `git commit` só no Execute e no Ship; `git push` e `gh pr create` só no Ship e com plan, execute, verify e doc aprovados. O reviewer só lê.

### Review e modelos

Presets de review (`review`): `light`, `standard` (padrão) e `strict`. Perfis de modelo (`profile`): `fast`, `balanced` (padrão) e `deep`. As tabelas ficam em [`presets.yaml`](presets.yaml). O reviewer usa o mais forte entre a configuração do Plan e a da fase revisada. O Log da mudança registra modelo, esforço, preset e rodada de cada execução.

## Workspace

```
flow/
├── project.md           # contexto + configuração
├── specs/<domínio>.md   # spec viva, um arquivo por domínio
├── changes/<id>.md      # uma mudança = um arquivo
├── archive/             # mudanças concluídas (AAAA-MM-DD-<id>.md)
└── .active              # efêmero: fase em execução (ignorado pelo git)
```

Todo o estado vive nesses arquivos. Fechar o Claude Code e rodar `/flow:flow` numa sessão nova continua de onde parou.

## Schemas (schema 1)

Os schemas abaixo são estáveis. Uma mudança incompatível incrementa `schema` em `project.md`.

### `flow/project.md`

Todas as chaves são opcionais, exceto `schema`.

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

O corpo é livre e é lido por todas as fases. O idioma do corpo define o idioma dos artefatos.

### `flow/specs/<domínio>.md`

| Chave | Valores |
|---|---|
| `domain` | nome do domínio |
| `prefix` | 2 a 4 letras maiúsculas |
| `status` | `draft` \| `active` |

Requisitos como `## <PREFIXO>-NNN Título`, com DEVE ou PODE, e cenários `### Cenário:` com Dado / Quando / Então. Um ID nunca é reutilizado.

### `flow/changes/<id>.md`

| Chave | Valores |
|---|---|
| `id` | kebab-case, igual ao nome do arquivo |
| `phase` | `discovery` \| `plan` \| `execute` \| `verify` \| `doc` \| `ship` \| `done` |
| `status` | `doing` \| `review` \| `changes` \| `waiting-you` \| `done` |
| `approved` | lista das fases concluídas |
| `round` | rodada de review da fase atual |
| `review` | preset efetivo |
| `profile` | opcional: override do perfil só para esta mudança |
| `specs` | lista de domínios afetados |
| `created` | data AAAA-MM-DD |

Seções do corpo, nesta ordem: Discovery, Plan, Verify, Reviews, Log.

### `flow/.active`

JSON de uma linha, `{"change":"<id>","phase":"<fase>","started":"<ISO-8601>"}`. Existe só enquanto uma fase roda; pode ser apagado sem perda.

## Limites conhecidos

- **Escrita via Bash.** O guard cobre `Edit`, `Write`, `MultiEdit`, `NotebookEdit`, git e `gh pr`. Um `echo > arquivo` no Discovery, Plan ou Verify não é bloqueado.
- **Comando com prefixo.** Skills de plugin sempre levam o prefixo do plugin, então o comando é `/flow:flow`.
- **ID completo de modelo.** Se a ferramenta de subagente só aceitar aliases, o engine passa a família (`opus`, `sonnet`…) e registra o ajuste no Log.
- **Windows nativo** não é suportado na v1.
- **Uma fase por vez** por projeto: duas sessões rodando o Flow no mesmo projeto compartilham `flow/.active`.

## Desenvolvimento

```
node tests/guard/run.mjs             # fixtures do guard: entrada do hook → código de saída
tests/example/setup.sh /tmp/cart     # projeto de exemplo para validar o fluxo
```

O próprio desenvolvimento do Flow é gerenciado pelo Flow: veja [`flow/`](flow/).
