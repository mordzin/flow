---
id: cart-discounts
phase: execute
status: doing
approved: [discovery, plan]
round: 1
review: standard
specs: [cart]
created: 2026-10-12
---
# Cupons de desconto no carrinho

> aceitar cupons de desconto no total do carrinho

## Discovery

**Problema.** O total não aceita cupons de desconto.

**Para quem.** Quem usa a biblioteca para montar checkout.

**Objetivo.** Aplicar um cupom ao total, com validação de quantidade e arredondamento.

**Restrições.** Sem dependências novas.

**Fora de escopo.** Cupons cumulativos.

**Critérios de sucesso**
1. `total(items, "PERC10")` devolve 90% do subtotal, coberto por teste.
2. Cupom fixo nunca deixa o total negativo, coberto por teste.
3. Quantidade inválida lança erro, coberto por teste.

**Domínios afetados.** cart

**Perguntas abertas.** Nenhuma.

## Plan

### Abordagem

`total(items, coupon?)` em `src/cart.js`: valida itens, soma, aplica cupom, limita em zero e arredonda.

### Riscos

1. Erro de ponto flutuante. Mitigação: arredondar no fim (CT-005).

### Dúvidas

Nenhuma.

### Spec delta

**cart**
- ADDED CT-002 Cupom percentual: o cupom `PERC10` DEVE reduzir o total em 10%.
- ADDED CT-003 Cupom fixo: o cupom `FIX5` DEVE reduzir o total em 5, e o total NÃO DEVE ficar negativo.
- ADDED CT-004 Quantidade válida: `qty` DEVE ser inteiro positivo; caso contrário `total` lança `RangeError`.
- ADDED CT-005 Arredondamento: o total DEVE ser arredondado para 2 casas decimais.

### Tasks

- [x] **T1** Cupons `PERC10` e `FIX5` em `total`, com testes. — CT-002, CT-003
- [x] **T2** Validação de `qty` com `RangeError`, com teste. — CT-004
- [x] **T3** Arredondar o total para 2 casas, com teste. — CT-005

## Verify

_Pendente._

## Reviews

- discovery · human · r1 · APPROVED
- plan · agent · r1 · APPROVED: (sem itens)
- plan · human · r1 · APPROVED

## Log

- 2026-10-12 · execute · worker · sonnet/medium · standard · r1 · T1 done
- 2026-10-12 · execute · worker · sonnet/medium · standard · r1 · T2 done
- 2026-10-12 · execute · worker · sonnet/medium · standard · r1 · T3 done
