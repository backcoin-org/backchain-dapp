# Fortune Pool — Jogo Provadamente Justo

Um jogo on-chain onde voce aposta BKC pra chance de ganhar multiplicadores. O jogo usa commit-reveal — ninguem (nem mineradores) consegue prever ou manipular o resultado.

Contrato: 0x319bfC89f4d9F2364E7e454e4950ca6e440211ED

---

## Como Funciona

1. Escolha os tiers — Easy, Medium, Hard, ou qualquer combinacao
2. Escolha seus numeros — Adivinhe um numero dentro do range de cada tier
3. Commit — Suas apostas sao hasheadas com um segredo e enviadas on-chain
4. Espere — 5 blocos passam (gera aleatoriedade imprevisivel)
5. Reveal — O contrato rola numeros usando blockhash futuro + gameId
6. Ganhe ou perca — Se seu palpite bater, voce ganha o multiplicador

---

## Tiers

| Tier | Range | Multiplicador | Chance | House Edge |
|------|-------|--------------|--------|------------|
| Easy | 1-4 | 3x | 25% | 25% |
| Medium | 1-20 | 15x | 5% | 25% |
| Hard | 1-100 | 75x | 1% | 25% |

Todos os tiers tem o mesmo valor esperado (0.75x por aposta). A diferenca e tolerancia a risco — Easy paga ganhos pequenos com frequencia, Hard paga ganhos enormes raramente.

---

## Modo Combo

Jogue multiplos tiers em um jogo so combinando com bitmask:

| Combo | Tiers Ativos | Multiplicador Maximo |
|-------|-------------|---------------------|
| 1 | Apenas Easy | 3x |
| 2 | Apenas Medium | 15x |
| 4 | Apenas Hard | 75x |
| 3 | Easy + Medium | 18x (3 + 15) |
| 7 | Todos os tres | 93x (3 + 15 + 75) |

Quando voce joga multiplos tiers, paga uma aposta e cada tier e rolado independentemente. Ganhos acumulam.

---

## Taxa BKC

Cada aposta tem taxa de 20% em BKC:
- 80% da sua aposta entra no prize pool
- 20% vai pro ecossistema (burn + delegadores + tesouro + operador)

Exemplo: Voce aposta 1.000 BKC no Easy. 800 BKC vai pro prize pool. Se voce ganhar, recebe 3x da aposta bruta = 3.000 BKC.

---

## Prize Pool

- Financiado por apostas dos jogadores e funding direto
- Teto: 1.000.000 BKC — Qualquer excesso acima do teto e queimado
- Pagamento maximo por jogo: 10% do pool — Isso protege o pool de deplecao
- Jogos expirados (nao revelados em 200 blocos) perdem a aposta pro pool

---

## Por Que e Justo

O mecanismo commit-reveal torna manipulacao impossivel:

1. Quando voce commita, seus palpites estao escondidos (hasheados com segredo aleatorio)
2. O bloco de reveal e setado 5 blocos no futuro
3. O numero vencedor vem de keccak256(blockhash, gameId, tierIndex)
4. Ninguem sabe o blockhash ate depois de minerado — nem voce, nem mineradores, ninguem

Ate mineradores nao conseguem lucrar: precisariam saber seu palpite E controlar o blockhash, o que e economicamente impraticavel.

---

## Taxa ETH

Cada tier tem sua propria taxa ETH (baseada em gas), paga pro ecossistema. Ao jogar combos, voce paga a soma de todas as taxas dos tiers ativos.

---

## Suporte a Operadores

Operadores ganham comissoes em jogos do Fortune Pool. Cada transacao de commit pode incluir endereco de operador, e eles ganham sua fatia das taxas ETH e BKC.

---

## Sustentabilidade do Pool

A matematica e desenhada pra sustentabilidade de longo prazo:
- Cada tier tem a mesma house edge de 25%
- O pool retém aproximadamente 5% de todas as apostas ao longo do tempo
- O teto de 1M BKC previne acumulacao excessiva, queimando o excesso
- Jogos expirados adicionam ao pool sem nenhum pagamento

Isso significa que o pool cresce devagar enquanto recompensa jogadores de forma justa. Nao e um cassino que precisa quebrar jogadores — e um jogo auto-sustentavel onde a matematica funciona pros dois lados.

Veja tambem: [Taxas](./Fees_Complete-Table.md) | [Economia](./Economy_How-It-Works.md)
