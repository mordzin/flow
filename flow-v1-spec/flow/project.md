---
schema: 1
commands:
  test: ""          # testes do guard, definido no T3
  lint: ""
review: standard
profile: balanced
ship:
  mode: pr
  base: main
---
# Flow

Plugin do Claude Code para desenvolvimento orientado a especificação, com um agente por fase, review independente e spec viva.

## Propósito

Levar uma ideia até um PR revisado, passando por seis fases: **Discovery → Plan → Execute → Verify → Doc → Ship**.

O Flow junta duas metades que hoje vivem em ferramentas separadas:

- **Spec viva e controle de mudanças.** O que o sistema *é* fica em `flow/specs/`, por domínio, com requisitos identificados. O que está *mudando* fica num único arquivo por mudança em `flow/changes/`, com o delta da spec.
- **Orquestração e gestão de contexto.** Cada fase roda num subagente com contexto limpo, que lê só o que precisa. A sessão principal só coordena.

## Princípios

1. **Arquivos são a única fonte de verdade.** Todo estado do fluxo vive em `flow/`. A única exceção é o marcador efêmero `flow/.active`.
2. **Convenção acima de configuração.** Um projeto funciona com zero configuração além de `commands.test`.
3. **Enxuto.** Um comando, dois agentes, um arquivo por fase, um arquivo por mudança.
4. **Revisor independente.** Contexto limpo, somente leitura, nunca mais fraco que o autor.
5. **Regra rígida vira hook; orientação vira prompt.**
6. **Agnóstico de stack.** Nada assume linguagem; o que é específico do projeto mora em `commands`.

## Fora do escopo da v1

- Execução paralela de tarefas
- Memória persistente do revisor
- Isolamento em worktree
- Runtimes além do Claude Code, sem chave reservada no schema
- Preset de review `auto` (previsto para a v1.1)
- Ferramentas configuráveis por fase
- Windows nativo (a v1 suporta macOS, Linux e WSL)
- UI e o log de eventos que ela consumiria. Na v2 vem o quadro de mudanças; depois, o fluxo ao vivo e o canvas.

## Glossário

| Termo | Significado |
|---|---|
| Fase | Uma das seis etapas do fluxo. |
| Mudança | Uma unidade de trabalho (feature, correção). Um arquivo em `flow/changes/`. |
| Spec viva | Os arquivos em `flow/specs/`, que descrevem o sistema como ele é hoje. |
| Spec delta | O que uma mudança adiciona, altera ou remove na spec viva. |
| Preset de review | Nível de rigor do review: `light`, `standard` ou `strict`. |
| Perfil | Combinação de modelo e esforço por fase: `fast`, `balanced` ou `deep`. |
| Gate | Ponto em que o fluxo para e espera uma decisão sua. |
| Worker | Agente que executa as fases. |
| Reviewer | Agente que revisa, somente leitura. |

## Convenções

- **Idioma.** Chaves, ids, fases, presets e perfis em inglês. Artefatos no idioma deste arquivo. Os prompts internos do plugin ficam em inglês.
- **IDs de requisito.** Formato `<PREFIXO>-NNN`, nunca reutilizados.
- **Domínios desta spec:**

| Domínio | Prefixo | Arquivo |
|---|---|---|
| Fluxo e interação | WF | `specs/workflow.md` |
| Workspace e formatos | WS | `specs/workspace.md` |
| Orquestração | EN | `specs/engine.md` |
| Review | RV | `specs/review.md` |
| Modelos e esforço | MD | `specs/models.md` |
| Guard | GD | `specs/guard.md` |
