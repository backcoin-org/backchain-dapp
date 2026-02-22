# Fortune Pool — Jogo Provadamente Justo

Aposte BKC, escolha um numero, e veja se a sorte esta do seu lado. O Fortune Pool e um jogo on-chain que usa **commit-reveal** — um mecanismo criptografico que torna manipulacao impossivel. Nem voce, nem mineradores, nem o proprio contrato sabe o resultado antes da hora.

> **Contrato:** `0xC76b8F773414D101231FE265Af0A84C32eeb7460`

---

## Como Funciona

O jogo tem duas fases separadas por 5 blocos — tempo suficiente pra gerar aleatoriedade que ninguem consegue prever.

**Fase 1 — Commit:**
1. Escolha seus tiers (Easy, Medium, Hard — ou qualquer combinacao)
2. Escolha um numero dentro do range de cada tier
3. Seus palpites sao hasheados com um segredo aleatorio e enviados on-chain
4. Ninguem — nem mineradores — sabe o que voce escolheu

**Fase 2 — Reveal (5 blocos depois):**
5. O contrato calcula o numero vencedor usando `keccak256(blockhash, gameId, tierIndex)`
6. Seus palpites sao revelados e comparados
7. Acertou? Ganha o multiplicador. Errou? Sua aposta fica no pool.

---

## Os Tres Tiers

Cada tier tem o mesmo **valor esperado** (0.75x por aposta). A diferenca e o perfil de risco — ganhos frequentes e pequenos, ou raros e enormes.

| Tier | Range | Multiplicador | Chance de Ganhar | House Edge |
|------|-------|--------------|-----------------|------------|
| **Easy** | 1-4 | 3x | 25% | 25% |
| **Medium** | 1-20 | 15x | 5% | 25% |
| **Hard** | 1-100 | 75x | 1% | 25% |

**Traduzindo:**
- **Easy** — A cada 4 jogos, voce ganha 1 (em media). Paga 3x.
- **Medium** — A cada 20 jogos, voce ganha 1. Paga 15x.
- **Hard** — A cada 100 jogos, voce ganha 1. Paga **75x**.

O risco-retorno e equilibrado matematicamente. Nao existe tier "melhor" — so preferencia pessoal.

---

## Modo Combo: Jogue Tudo de Uma Vez

Por que escolher um tier quando voce pode jogar todos? Combine tiers usando bitmask:

| Combo | Tiers Ativos | Multiplicador Maximo |
|-------|-------------|---------------------|
| 1 | Easy | 3x |
| 2 | Medium | 15x |
| 4 | Hard | 75x |
| 3 | Easy + Medium | 18x |
| 5 | Easy + Hard | 78x |
| 6 | Medium + Hard | 90x |
| **7** | **Todos** | **93x** |

No combo, voce paga uma aposta e cada tier rola **independentemente**. Pode ganhar em um, dois, ou todos. Os ganhos somam.

> **Cenario:** Voce joga combo 7 (todos os tiers) com 1.000 BKC. Se acertar Easy + Hard, ganha (3x + 75x) = 78.000 BKC. Se acertar so o Easy, ganha 3.000 BKC.

---

## Taxa BKC: 20%

Cada aposta tem taxa de 20% em BKC:
- **80%** da sua aposta entra no prize pool
- **20%** vai pro ecossistema (burn + delegadores + tesouro + operador)

**Exemplo:** Voce aposta 1.000 BKC no Easy. 800 BKC vao pro pool. Se voce ganhar, recebe 3x da aposta bruta = 3.000 BKC. O retorno e calculado sobre o valor cheio, nao sobre o que sobrou apos taxa.

---

## O Prize Pool: Auto-Sustentavel

| Regra | Detalhe |
|-------|---------|
| Financiamento | Apostas dos jogadores + funding direto |
| Teto | 1.000.000 BKC — excesso e queimado |
| Pagamento maximo | 10% do pool por jogo |
| Jogos expirados | Aposta vai pro pool apos 200 blocos sem reveal |

O pool e desenhado pra **nunca quebrar**:
- A house edge de 25% garante que o pool retém ~5% de todas as apostas ao longo do tempo
- O teto de 1M previne acumulacao excessiva e queima o excesso
- O limite de 10% por jogo protege contra deplecao em um unico jogo grande
- Jogos expirados alimentam o pool sem nenhum pagamento

---

## Por Que Ninguem Pode Trapacear

O commit-reveal e a mesma tecnica usada em protocolos de bilhoes de dolares. Funciona assim:

1. **No commit:** seus palpites estao escondidos (hasheados com segredo aleatorio que so voce conhece)
2. **O bloco de reveal:** setado 5 blocos no futuro — ninguem sabe o blockhash ate la
3. **O numero vencedor:** calculado com `keccak256(blockhash, gameId, tierIndex)`
4. **O resultado:** impossivel de prever porque depende de um blockhash que ainda nao existe

Ate mineradores nao conseguem manipular: precisariam saber seu palpite **E** controlar o blockhash, o que e economicamente impraticavel na Ethereum.

---

## Taxas

| Componente | Valor |
|-----------|-------|
| Taxa BKC | 20% da aposta (burn + delegadores + tesouro) |
| Taxa ETH | Baseada em gas, por tier (combos pagam soma dos tiers) |

---

## Suporte a Operadores

Cada jogo no Fortune Pool gera comissao pro operador do frontend. Como jogadores tendem a jogar repetidamente, um app de jogos bem feito gera receita recorrente.

---

## Matematica Transparente

Nao acredite na gente — verifique. Todos os parametros estao no smart contract:
- Ranges: 4, 20, 100
- Multiplicadores: 3x, 15x, 75x
- House edge: 25% em todos os tiers
- Aleatoriedade: `keccak256(blockhash, gameId, tierIndex)` — verificavel on-chain

O Fortune Pool nao e um cassino que precisa que voce perca. E um jogo matematicamente justo onde a house edge financia recompensas pro ecossistema inteiro.

---

Continue: [Taxas](./Fees_Complete-Table.md) | [Economia](./Economy_How-It-Works.md) | [Staking](./Staking_Lock-and-Earn.md)
