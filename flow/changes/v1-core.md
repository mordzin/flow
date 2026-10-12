---
id: v1-core
phase: execute
status: waiting-you
approved: [discovery, plan]
round: 1
review: standard
specs: [workflow, workspace, engine, review, models, guard]
created: 2026-10-12
---
# Flow v1: núcleo do plugin

## Discovery

**Problema.** Agentes de código perdem qualidade em sessões longas, à medida que o contexto enche. A intenção do que se quer construir fica espalhada no chat. E o review costuma ser feito por quem escreveu o código. As ferramentas atuais resolvem metade cada uma: o OpenSpec cuida da spec viva e do controle de mudanças, mas não orquestra agentes; o GSD orquestra e gerencia contexto, mas organiza a spec por fases do projeto, e não por domínio.

**Para quem.** Um desenvolvedor usando Claude Code, em projetos de qualquer stack, novos ou existentes.

**Objetivo.** Um plugin enxuto que combine as duas metades num fluxo de seis fases, com review configurável e escolha de modelo e esforço por fase.

**Restrições**
- Claude Code é o único runtime na v1.
- Subagentes de plugin ignoram `hooks`, `mcpServers` e `permissionMode` no frontmatter. Por isso as regras ficam no `hooks.json` do plugin e os MCPs vêm da configuração do projeto.
- Passar o esforço por chamada exige Claude Code v2.1.292 ou posterior.
- Simplicidade é requisito: um comando, dois agentes, cerca de 16 arquivos.

**Fora de escopo.** Ver `project.md`.

**Critérios de sucesso**
1. Levar uma feature real de ponta a ponta (ideia → PR) num projeto de exemplo, sem editar à mão nenhum arquivo do Flow.
2. Retomar uma mudança numa sessão nova sem perder progresso.
3. O guard bloquear edição de código no Plan e `git push` antes do Ship.
4. Um projeto com apenas `commands.test` configurado funcionar com todos os padrões.
5. Trocar preset e perfil mudar de fato quem revisa e qual modelo roda, visível no Log.

**Perguntas abertas.** Nenhuma.

**Origem.** Decisões tomadas na conversa de 12/10/2026, com referência ao OpenSpec, ao GSD Core e à documentação de subagentes do Claude Code.

## Plan

### Abordagem

Estrutura do plugin (repositório `flow`):

```
flow/
├── .claude-plugin/plugin.json
├── README.md
├── presets.yaml                 # presets de review e perfis de modelo
├── skills/flow/SKILL.md         # o engine: comando /flow
├── agents/
│   ├── worker.md
│   └── reviewer.md
├── phases/
│   ├── discovery.md
│   ├── plan.md
│   ├── execute.md
│   ├── verify.md
│   ├── doc.md
│   └── ship.md
├── templates/
│   ├── project.md
│   ├── spec.md
│   └── change.md
├── hooks/
│   ├── hooks.json
│   └── guard.mjs                # Node, sem pacotes npm (GD-007)
├── tests/guard/                 # fixtures: entrada do hook → código de saída esperado
└── flow/                        # workspace do próprio Flow: esta spec, movida de flow-v1-spec/
```

A spec mora no repositório do plugin desde o início. Depois da v1, o Flow passa a gerenciar o próprio desenvolvimento.

Ordem de construção, em fatia vertical:

1. **Premissas.** Um script mínimo confirma as três premissas das quais o desenho depende (T1). Se alguma falhar, o Plan é ajustado antes de seguir.
2. **Repositório e oráculo.** Git, scaffold e o guard com testes por fixture. Os testes viram o `commands.test` e cobrem os critérios 3 e 4 desde cedo.
3. **Fatia vertical.** `/flow <descrição>` → Discovery → gate → Plan, com worker, reviewer, preset `standard`, perfil `balanced`, `.active` e Log. É validada no projeto de exemplo antes de qualquer replicação.
4. **Replicação.** Execute (um worker por task), Verify, Doc e Ship.
5. **Configuração.** Os demais presets e perfis, overrides e força do reviewer.
6. **README e validação ponta a ponta.**

Decisões de desenho tomadas na revisão deste Plan:

- **O worker não conversa com você** (EN-011). Ele escreve as dúvidas no arquivo da mudança e o engine abre o gate com elas. Assim o Discovery roda em subagente como as demais fases e mantém o modelo do perfil.
- **Execute com um worker por task** (EN-012). Uma chamada com todas as tasks encheria o contexto, que é o problema que o Flow quer resolver. A retomada no meio do Execute (WF-003) sai disso sem trabalho extra.
- **Corte de escopo.** O preset `auto` (RV-004 a RV-006), o log de eventos (EN-009) e o bloco `runtime` (MD-007) saem da v1. Os IDs ficam retirados e não são reutilizados.

**Bootstrap.** Como esta mudança cria todos os domínios do zero, os requisitos foram escritos direto em `specs/` com `status: draft` (WS-008). O delta abaixo só referencia os arquivos.

### Riscos

1. **Reviewer que aprova tudo.** Mitigação: checklists só com perguntas verificáveis (RV-011) e severidade obrigatória (RV-007). Meta medida no T11: com 5 defeitos plantados no projeto de exemplo, o reviewer marca ao menos 4 como `blocking` e no máximo 1 item `blocking` falso.
2. **Premissa: `agent_type` no `PreToolUse` dentro de subagentes de plugin.** O GD-004 depende disso. Se não vier, o plano B é tirar o Bash do reviewer e o engine rodar os `commands`, entregando as saídas no prompt. O T1 confirma.
3. **Premissa: modelo e esforço por chamada.** Se a versão instalada não aceitar, o MD-003 cai para esforço por agente, o que exigiria agentes por nível. O T1 confirma.
4. **Premissa: a skill dispara subagentes.** O harness do Claude Code desencoraja criar subagentes sem pedido do usuário. Mitigação: o `SKILL.md` instrui explicitamente cada chamada. O T1 confirma.
5. **Guard falhando em silêncio.** Sem Node, ou com erro interno, o hook não bloquearia nada. Mitigação: aviso no `SessionStart` e bloqueio em erro interno (GD-007).
6. **Escrita via Bash escapa do guard.** Em discovery, plan e verify, um `echo > arquivo` não é bloqueado. Aceito na v1: o guard cobre `Edit`, `Write` e git, e o limite fica documentado no README.
7. **`.active` órfão após um crash** deixaria o guard ativo fora do Flow. Mitigação: o hook `SessionStart` limpa, e o `/flow` sempre reescreve o marcador.
8. **Custo em `strict` + `deep`.** Mitigação: o Log registra modelo e esforço de cada execução, dando visibilidade do gasto.
9. **SKILL.md do engine crescer demais.** Mitigação: o engine só orquestra; o "como fazer" de cada fase mora em `phases/`.

**Resultado do T1 (12/10/2026).** (a) e (b) confirmadas pela documentação do Claude Code: hooks de plugin rodam dentro de subagentes e recebem `agent_type` com o nome qualificado (`flow:reviewer`); `model` e `effort` por chamada existem desde a v2.1.292 (instalada: 2.1.296). (c) confirmada pela sonda `tests/premises/run.sh`, rodada no terminal: a skill disparou `probe:probe` com `model: haiku` (resposta `claude-haiku-5-5`), e o `PreToolUse` dentro do subagente recebeu `"agent_type":"probe:probe"`, o que também confirma (a) e (b) na prática. Achados que mudam o desenho:

- Skill de plugin sempre leva o prefixo, então o comando é `/flow:flow`, e não `/flow` (WF-002). Registrado no README como limite conhecido.
- Na ferramenta de subagente desta versão, `model` aceita só aliases (`haiku`, `sonnet`, `opus`, `fable`). Com ID completo em `phases.<fase>.model`, o engine passa a família e registra o ajuste (MD-003).
- Os aliases atuais suportam os cinco níveis de esforço; o fallback do MD-004 só age em IDs completos de modelos anteriores (tabela `effort_support` em `presets.yaml`).

### Dúvidas

Nenhuma em aberto. Decididas em 12/10/2026:

1. **Linguagem do guard:** Node, sem pacotes npm, com aviso visível se ele faltar (GD-007).
2. **Distribuição:** repositório no GitHub servindo como marketplace desde o início.
3. **Projeto de exemplo:** um projeto pequeno, criado para a validação e com defeitos plantados (Risco 1). Um projeto real fica para depois da v1.
4. **Plataformas:** macOS, Linux e WSL. Windows nativo fica fora da v1.

### Spec delta

Todos os requisitos são novos e estão nos arquivos de cada domínio, com `status: draft` (WS-008). Na fase Doc, o status de cada arquivo passa a `active`.

- **workflow**: ADDED WF-001 a WF-009 → `specs/workflow.md`
- **workspace**: ADDED WS-001 a WS-010 → `specs/workspace.md`
- **engine**: ADDED EN-001 a EN-008, EN-010 a EN-012 → `specs/engine.md`. EN-009 (log de eventos) retirado do draft.
- **review**: ADDED RV-001 a RV-003, RV-007 a RV-011 → `specs/review.md`. RV-004 a RV-006 (preset `auto`) retirados do draft.
- **models**: ADDED MD-001 a MD-006, MD-008 → `specs/models.md`. MD-007 (bloco `runtime`) retirado do draft.
- **guard**: ADDED GD-001 a GD-007 → `specs/guard.md`

Os IDs retirados nunca foram ativados e não são reutilizados (WS-004).

### Tasks

- [x] **T1** Confirmar com um script mínimo: (a) `agent_type` chega no `PreToolUse` dentro de subagente de plugin; (b) `model` e `effort` por chamada de subagente; (c) a skill dispara subagentes quando instruída. Registrar o resultado em Riscos e ajustar o Plan se alguma falhar. — premissas de EN-001, GD-004, MD-003
- [ ] **T2** Repositório: `git init`, scaffold, `plugin.json`, mover `flow-v1-spec/flow/` para `flow/` e publicar no GitHub como marketplace. — WS-001
- [x] **T3** Guard: `hooks.json`, `guard.mjs`, checagem do Node no `SessionStart` e testes por fixture cobrindo a tabela do GD-003, o reviewer, o gate do Ship e as mensagens. `commands.test` passa a rodar esses testes. — GD-001, GD-002, GD-003, GD-004, GD-005, GD-006, GD-007
- [x] **T4** Templates `project.md`, `spec.md` e `change.md` com os schemas. — WS-003, WS-004, WS-005, WS-006, WS-007
- [x] **T5** Agentes `worker` e `reviewer`; `presets.yaml` com os presets e perfis. — EN-001, RV-002, RV-008, MD-001
- [x] **T6** Fatia vertical do `/flow`: inicialização, nova mudança, `phases/discovery.md` e `phases/plan.md`, perguntas abertas, gate, prompt de delegação, review `agent + human`, rodadas, `.active`, Log, resumo e falhas. — WF-002, WF-004, WF-006, WF-007, WF-009, WS-002, WS-010, EN-002, EN-003, EN-004, EN-005, EN-006, EN-007, EN-008, EN-010, EN-011, RV-001, RV-007, RV-010, RV-011
- [ ] **T7** Validar a fatia: criar o projeto de exemplo, levar uma mudança até o Plan aprovado e rodar o reviewer sobre o Plan desta mudança, registrando o parecer em Reviews.
- [x] **T8** Replicar para `execute.md` (um worker por task), `verify.md`, `doc.md` e `ship.md`; seleção entre mudanças, retomada, voltar fase, aplicar o delta, ativar specs draft, arquivar, commit e PR. — WF-001, WF-003, WF-005, WF-008, WS-008, EN-012
- [x] **T9** Resolução de preset, perfil e overrides; fallback de esforço, valores inválidos e força do reviewer. — RV-003, RV-009, MD-002, MD-003, MD-004, MD-005, MD-006, MD-008
- [x] **T10** README: instalação pelo marketplace, uso, schemas, versões mínimas (Claude Code e Node) e limites conhecidos (escrita via Bash, Windows nativo). — WS-009, MD-003, GD-007
- [ ] **T11** Validação ponta a ponta no projeto de exemplo: os cinco critérios de sucesso e a meta do reviewer (Risco 1), com os números registrados em Verify.

## Verify

_Pendente: preenchido na fase Verify._

## Reviews

- discovery · human · APPROVED: decisões fechadas na conversa de 12/10/2026
- plan · agent · não aplicável: o reviewer é justamente o que esta mudança constrói; ele revisa este Plan no T7
- plan · human · r1 · CHANGES: (1) Discovery incompatível com subagente; (2) Execute numa única chamada enche o contexto; (3) guard falha em silêncio sem Node; (4) premissas antes de tudo; (5) cortar `auto`, log de eventos e `runtime`; (6) fatia vertical antes de replicar; (7) oráculos com número; (8) decidir as quatro Dúvidas
- plan · human · r2 · APPROVED: "/goal execute" em 12/10/2026

## Log

- 2026-10-12 · discovery · conversa com o usuário · Claude Opus 5.5 · aprovado
- 2026-10-12 · plan · worker · Claude Opus 5.5 · standard · r1 · escrito; aguardando revisão humana
- 2026-10-12 · plan · human · standard · r1 · CHANGES; Dúvidas decididas conforme as recomendações
- 2026-10-12 · plan · worker · Claude Opus 5.5 · standard · r2 · revisado: EN-011, EN-012, GD-007 reescrito, cortes de escopo, Tasks em fatia vertical; aguardando revisão humana
- 2026-10-12 · plan · human · standard · r2 · APPROVED
- 2026-10-12 · execute · worker · Claude Opus 5.5 · standard · r1 · T1 parcial: (a) e (b) confirmadas pela doc; (c) pendente, sonda em `tests/premises/run.sh`
- 2026-10-12 · execute · worker · Claude Opus 5.5 · standard · r1 · T2 parcial: workspace movido para `flow/`, scaffold, `plugin.json` e `marketplace.json`; publicação no GitHub aguardando você
- 2026-10-12 · execute · worker · Claude Opus 5.5 · standard · r1 · T3 done: `node tests/guard/run.mjs` → 78/78; mutação no guard derruba 7 casos
- 2026-10-12 · execute · worker · Claude Opus 5.5 · standard · r1 · T4, T5, T6, T8, T9 done; `claude plugin validate --strict` passa em skills e agents
- 2026-10-12 · execute · worker · Claude Opus 5.5 · standard · r1 · T10 done
- 2026-10-12 · execute · worker · Claude Opus 5.5 · standard · r1 · T7 e T11 preparados (`tests/example/`, 5 defeitos em `tests/example/DEFECTS.md`); exigem sessão ao vivo com o plugin
- 2026-10-12 · execute · human · - · standard · r1 · T1 done: sonda no terminal confirmou (a), (b) e (c)
