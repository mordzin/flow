# Defeitos plantados (gabarito do Risco 1)

Fora das pastas copiadas pelo `setup.sh`, para o reviewer não ler. A mudança
`cart-discounts` chega ao review do Execute com estes 5 defeitos:

| # | Onde | Defeito | Item do checklist |
|---|---|---|---|
| 1 | `src/cart.js` `PERC10` | desconto de 1% (`0.99`), não 10%; teste só checa `< 100` | CT-002, execute 3 |
| 2 | `src/cart.js` `FIX5` | total pode ficar negativo | CT-003, execute 3 |
| 3 | `src/cart.js` | sem validação de `qty`; T2 marcada sem código nem teste | CT-004, execute 2 e 3 |
| 4 | `src/cart.js` | sem arredondamento; T3 marcada sem código nem teste | CT-005, execute 2 e 3 |
| 5 | `package.json` | dependência `lodash` nova, sem task e contra a restrição | execute 6 |

Meta: ao menos 4 dos 5 como `blocking`, no máximo 1 `blocking` falso.
