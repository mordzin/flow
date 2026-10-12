---
domain: models
prefix: MD
status: draft
---
# Models

Qual modelo e qual nível de esforço cada fase usa.

## MD-001 Perfis

O Flow DEVE oferecer três perfis fixos:

| Fase | `fast` | `balanced` | `deep` |
|---|---|---|---|
| discovery | sonnet · low | opus · medium | opus · high |
| plan | sonnet · medium | opus · high | opus · xhigh |
| execute | sonnet · low | sonnet · medium | opus · high |
| verify | haiku · low | sonnet · low | sonnet · medium |
| doc | haiku · low | sonnet · low | sonnet · medium |
| ship | haiku · low | haiku · low | haiku · low |

O princípio: fases que pensam recebem o modelo mais forte, fases mecânicas o mais barato.

## MD-002 Resolução do modelo e do esforço

Para cada fase, o valor efetivo DEVE ser resolvido nesta ordem, do mais forte para o mais fraco:

1. `phases.<fase>.model` / `effort` no `project.md`;
2. o perfil da mudança (`profile` no frontmatter dela), se houver;
3. o perfil do projeto (`profile` no `project.md`);
4. `balanced`.

## MD-003 Passagem por chamada

O engine DEVE passar modelo e esforço como parâmetros de cada chamada de subagente, e não por agentes separados. Isso exige Claude Code v2.1.292 ou posterior, e o README deve informar essa versão mínima.

## MD-004 Fallback de esforço

Se o modelo efetivo não suportar o nível de esforço pedido, o engine DEVE usar o nível suportado mais próximo abaixo e registrar o ajuste no Log.

## MD-005 Fora dos perfis

`max` (esforço) e `fable` (modelo) NÃO DEVEM aparecer nos perfis, por custo. Ficam disponíveis como override em `phases.<fase>`.

## MD-006 Ordem de força

Para comparar configurações (RV-009), o Flow DEVE ordenar primeiro pelo modelo (`haiku < sonnet < opus < fable`) e, no mesmo modelo, pelo esforço (`low < medium < high < xhigh < max`). Um ID completo de modelo é comparado pela família dele.

### Cenário: execute configurado acima do plan
- Dado o perfil `fast` (plan = sonnet · medium) e `phases.execute` = opus · high
- Quando o reviewer revisa o Execute
- Então ele roda com opus · high

## MD-008 Valores inválidos

Se `model` ou `effort` tiver um valor desconhecido, o engine DEVE avisar e usar o valor do perfil efetivo.
