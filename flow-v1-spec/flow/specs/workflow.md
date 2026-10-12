---
domain: workflow
prefix: WF
status: draft
---
# Workflow

O ciclo de vida de uma mudança e como você interage com o Flow.

## WF-001 Seis fases em ordem fixa

Toda mudança DEVE passar pelas fases `discovery → plan → execute → verify → doc → ship`, nessa ordem. Nenhuma fase é pulada; o preset de review define apenas o rigor de cada uma. No preset `light`, o Discovery pode ser curto, mas acontece.

### Cenário: ordem respeitada
- Dado uma mudança na fase `plan` ainda não aprovada
- Quando você roda `/flow`
- Então o Flow continua o `plan` e não inicia o `execute`

## WF-002 Comando único

O plugin DEVE expor um único comando, `/flow`:

| Uso | Efeito |
|---|---|
| `/flow <descrição>` | Abre uma nova mudança |
| `/flow` | Mostra o estado e continua de onde parou |
| `/flow <id>` | Seleciona uma mudança específica |

### Cenário: várias mudanças em andamento
- Dado duas mudanças com `status` diferente de `done`
- Quando você roda `/flow` sem argumentos
- Então o Flow lista as duas com fase e status e pergunta qual continuar

## WF-003 Retomada sem perda

Toda informação necessária para continuar uma mudança DEVE estar no arquivo dela. Encerrar o Claude Code e abrir outra sessão não perde progresso.

### Cenário: retomar em outra sessão
- Dado uma mudança com `phase: execute` e as tarefas T1 e T2 marcadas como feitas
- Quando você abre uma nova sessão e roda `/flow`
- Então o Flow continua a partir da T3

## WF-004 Gates em linguagem natural

Quando uma fase exige aprovação humana, o Flow DEVE parar, resumir o que precisa de decisão e aceitar resposta em linguagem natural: aprovar ("ok"), pedir mudanças ("refaz considerando X") ou voltar a uma fase anterior. Não há subcomandos para aprovar. O gate também abre quando o worker deixa uma pergunta em aberto (EN-011).

### Cenário: pedir mudança num gate
- Dado o Plan aguardando sua aprovação
- Quando você responde "inclui tratamento de e-mail duplicado"
- Então o worker refaz o Plan com esse pedido e o review da fase roda de novo

## WF-005 Voltar a uma fase anterior

Você PODE pedir para voltar a uma fase já concluída ("volta pro plan"). O Flow DEVE remover de `approved` aquela fase e todas as seguintes, registrar o motivo no Log e manter o código já escrito. O novo Plan decide o que fazer com ele.

## WF-006 Resumo curto ao fim de cada fase

Ao concluir uma fase, o Flow DEVE mostrar no máximo 5 linhas: o que foi feito, o veredito do review, o próximo passo e o caminho do arquivo da mudança.

## WF-007 Nova mudança

`/flow <descrição>` DEVE criar `flow/changes/<id>.md` com um id em kebab-case derivado da descrição, frontmatter inicial (WS-005) e iniciar o Discovery. Se o id já existir, o Flow acrescenta um sufixo numérico.

## WF-008 Conclusão e arquivamento

Ao concluir o Ship, o arquivo da mudança DEVE ir para `flow/archive/AAAA-MM-DD-<id>.md`, com `phase: done` e `status: done`. O arquivamento faz parte do commit do Ship, então entra no mesmo PR.

## WF-009 Idioma dos artefatos

Mudanças, specs, pareceres e resumos DEVEM ser escritos no idioma do corpo de `flow/project.md`. Chaves, ids, fases, presets e perfis permanecem em inglês.
