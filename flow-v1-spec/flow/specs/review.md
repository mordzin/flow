---
domain: review
prefix: RV
status: draft
---
# Review

Quem revisa cada fase, com que rigor e em que formato.

## RV-001 Tipos de review

Cada fase DEVE ter um destes tipos de review:

| Tipo | O que acontece |
|---|---|
| `none` (—) | Sem review |
| `check` | Roda os `commands` aplicáveis e a checagem estrutural da fase; qualquer falha vale como CHANGES |
| `agent` | O reviewer avalia contra o checklist da fase |
| `human` | Gate: você aprova, pede mudanças ou volta uma fase |
| `agent + human` | Primeiro o reviewer; só depois do APPROVED dele, o gate |

## RV-002 Presets

O Flow DEVE oferecer três presets fixos:

| Fase | `light` | `standard` | `strict` |
|---|---|---|---|
| discovery | — | human | agent + human |
| plan | agent | agent + human | agent + human |
| execute | check | agent | agent |
| verify | check | check | agent |
| doc | — | check | agent |
| ship | human | human | human |
| Rodadas máximas | 1 | 2 | 3 |

## RV-003 Preset efetivo

O preset efetivo DEVE ser resolvido nesta ordem, do mais forte para o mais fraco:

1. `review` no frontmatter da mudança (override seu);
2. `review` no `project.md`;
3. `standard`.

## RV-007 Formato do parecer

Todo parecer, de agente ou de check, DEVE ter:

- veredito: `APPROVED` ou `CHANGES`;
- itens numerados, cada um com severidade (`blocking` ou `suggestion`) e referência (`arquivo:linha`, ID de requisito ou seção da mudança).

Só itens `blocking` geram CHANGES. Sugestões ficam registradas e não travam o fluxo.

## RV-008 Reviewer independente

O reviewer DEVE começar com contexto limpo e receber apenas os artefatos: o arquivo de fase, a mudança e o código ou diff. Ele não recebe o raciocínio do worker.

## RV-009 Força do reviewer

O reviewer DEVE usar o mais forte entre o modelo/esforço do Plan e o da fase revisada (MD-006). Não há configuração própria de modelo para o reviewer.

## RV-010 Limite de rodadas

Ao atingir o limite de rodadas do preset sem APPROVED, o engine DEVE parar com `status: waiting-you` e listar os itens bloqueantes pendentes (EN-005).

## RV-011 Checklist verificável

Cada item do checklist de uma fase DEVE ser uma pergunta de sim ou não respondível com evidência. Exemplos: "cada requisito do delta tem ao menos uma task?", "cada critério de aceite tem um teste correspondente?". Itens subjetivos ("o código está bom?") não são permitidos.
