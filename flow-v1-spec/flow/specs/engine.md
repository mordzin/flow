---
domain: engine
prefix: EN
status: draft
---
# Engine

Como o comando `/flow` coordena fases, agentes e estado. O engine roda na sessão principal e só coordena; o trabalho pesado acontece em subagentes.

## EN-001 Dois agentes

O plugin DEVE definir exatamente dois agentes:

| Agente | Ferramentas | Papel |
|---|---|---|
| `worker` | Todas, limitadas pelo guard (GD-003) | Executa qualquer fase |
| `reviewer` | `Read`, `Grep`, `Glob`, `Bash` (Bash limitado por GD-004) | Revisa; nunca edita |

O comportamento específico de cada fase vem dos arquivos de fase (EN-002), não de agentes diferentes.

## EN-002 Arquivos de fase

Cada fase DEVE ter um arquivo `phases/<fase>.md` com três seções:

1. **Como fazer**: instruções para o worker.
2. **Formato**: o que gravar no arquivo da mudança e onde.
3. **Checklist**: critérios do reviewer (RV-011).

Worker e reviewer leem o mesmo arquivo, para que o critério de quem faz seja o mesmo de quem revisa.

## EN-003 Entradas padrão por fase

Cada fase DEVE ler apenas o necessário:

| Fase | Lê |
|---|---|
| discovery | `project.md`, a descrição da mudança, a lista de domínios em `specs/` |
| plan | `project.md`, Discovery, specs dos domínios afetados, código relevante |
| execute | `project.md`, Plan (Abordagem e Spec delta), a task atual (EN-012), código relevante a ela |
| verify | Spec delta, Tasks, `commands`, código e testes |
| doc | Spec delta, specs afetadas, README e CHANGELOG do projeto |
| ship | o arquivo da mudança e o estado do git |

Os caminhos em `phases.<fase>.context` são somados a essa lista.

## EN-004 Prompt de delegação

Ao chamar o worker, o engine DEVE informar:

1. o caminho do arquivo de fase;
2. o caminho da mudança e as seções a ler;
3. o contexto extra configurado;
4. as skills a carregar antes de começar (`phases.<fase>.skills`);
5. os servidores MCP a usar (`phases.<fase>.mcp`);
6. o idioma dos artefatos (WF-009).

O modelo e o esforço efetivos (MD-002) vão como parâmetros da chamada.

## EN-005 Loop de review

Depois do worker, o engine DEVE aplicar o review da fase conforme o preset efetivo (RV-002):

1. `check`: roda os `commands` aplicáveis e a checagem estrutural da fase.
2. `agent`: chama o reviewer com o arquivo de fase e os artefatos produzidos.
3. `human`: abre o gate (WF-004).

Se o veredito for CHANGES, o worker recebe os itens bloqueantes e refaz a fase. Isso se repete até o limite de rodadas do preset (RV-010).

### Cenário: rodadas esgotadas
- Dado o preset `standard` (2 rodadas) e o Execute com CHANGES na segunda rodada
- Quando o reviewer devolve o parecer
- Então o engine marca `status: waiting-you` e mostra as pendências, sem iniciar uma terceira rodada

## EN-006 Registro do que rodou

Cada execução de worker, reviewer ou check DEVE acrescentar uma linha ao Log da mudança, com: data, fase, papel, modelo/esforço efetivos, preset, rodada e resultado.

## EN-007 Quem escreve o quê

- O **engine** é o único que altera o frontmatter da mudança e as seções Reviews e Log.
- O **worker** escreve apenas as seções do corpo da fase em que está. No Execute, marca só o checkbox da própria task (EN-012); no Verify, preenche a tabela de evidências.
- O **reviewer** não escreve nada; devolve o parecer e o engine o registra.

## EN-008 Marcador de execução

Ao iniciar uma fase, o engine DEVE gravar `flow/.active` como JSON de uma linha (`{"change":"<id>","phase":"<fase>","started":"<ISO-8601>"}`) e removê-lo ao terminar, com sucesso ou falha. O guard usa esse marcador (GD-002).

## EN-010 Falhas de agente

Se um subagente falhar (erro de API, limite de turnos, resultado vazio), o engine DEVE manter a fase, marcar `status: waiting-you`, registrar o erro no Log e oferecer repetir. O engine nunca avança de fase sem um resultado válido.

## EN-011 Worker não conversa com você

O worker NÃO DEVE fazer perguntas durante a execução, porque um subagente não fala com você. Toda dúvida vai para o arquivo da mudança:

- no Discovery, em **Perguntas abertas**;
- no Plan, em **Dúvidas**;
- nas demais fases, o worker para e devolve a pergunta como resultado, e o engine a registra no Log.

Se houver pergunta em aberto, o engine DEVE abrir o gate (WF-004), mesmo que o preset da fase não tenha review humano. Sua resposta volta ao worker, que refaz a fase com ela.

### Cenário: Discovery com pergunta aberta
- Dado `/flow adicionar login` sem indicar o provedor de identidade
- Quando o worker conclui o Discovery
- Então a seção lista "Qual provedor de login?" em Perguntas abertas e o engine abre o gate com essa pergunta

## EN-012 Execute por task

No Execute, o engine DEVE chamar um worker por task do Plan, em ordem, cada um com contexto limpo. O prompt de delegação (EN-004) inclui a task a executar. Ao concluir, o worker marca o checkbox da task e o engine registra a execução no Log.

O review da fase (EN-005) roda uma vez, depois da última task. Numa rodada de CHANGES, o worker recebe os itens bloqueantes numa única chamada.

### Cenário: retomar no meio do Execute
- Dado um Plan com as tasks T1 a T5 e T1 e T2 marcadas
- Quando o Execute é retomado
- Então o engine chama o worker só para a T3, com a T3, a Abordagem e o Spec delta como entrada
