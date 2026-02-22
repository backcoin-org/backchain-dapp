# Staking — Trave, Delegue, Ganhe

Staking e a forma mais direta de gerar renda passiva no Backcoin. Voce trava seus BKC, escolhe por quanto tempo, e o protocolo te paga recompensas de mineracao proporcionais ao seu poder. Quanto mais tempo, mais poder. Quanto melhor seu NFT, menos voce perde no claim.

> **Contrato:** `0xA7B61b8597A00D738FDb3715563F00e5cef0bB7f`

---

## Como Funciona em 4 Passos

1. **Delegue** — Trave BKC por 1 a 3.650 dias (ate 10 anos)
2. **Acumule** — Recompensas de mineracao caem na sua conta continuamente
3. **Clame** — Retire suas recompensas quando quiser (sujeito a taxa de burn)
4. **Destrave** — Recupere seus BKC quando o lock expirar

Simples. Mas o diabo esta nos detalhes — e entender os detalhes e o que separa quem ganha bem de quem ganha pouco.

---

## Poder de Delegacao: Tempo e Tudo

Sua fatia das recompensas nao depende so de **quanto** voce travou. Depende de **por quanto tempo**. O sistema calcula seu poder de delegacao (pStake) com esta formula:

```
pStake = Valor x (10000 + diasLock x 5918 / 365) / 10000
```

Na pratica, isso significa:

| Valor | Lock | Poder (pStake) | Multiplicador |
|-------|------|---------------|---------------|
| 10.000 BKC | 30 dias | 10.486 | 1.05x |
| 10.000 BKC | 180 dias | 12.919 | 1.29x |
| 10.000 BKC | 1 ano | 15.918 | **1.59x** |
| 10.000 BKC | 5 anos | 39.590 | **3.96x** |

O salto e desproporcional. Travar por 5 anos da quase **4x** o poder de quem travou por 30 dias — com a mesma quantidade de BKC.

> **Dica:** Voce pode ter multiplas delegacoes ativas com periodos diferentes. Divida seu BKC em parcelas com locks escalonados pra balancear liquidez e retorno.

---

## O Burn: Por Que Seu NFT Muda Tudo

Aqui e onde a maioria erra. Quando voce clama recompensas, uma parte e **queimada**. Sem NFT, voce perde **metade de tudo**.

| Seu NFT | Queimado | Voce Recebe | Ganho vs Sem NFT |
|---------|----------|------------|-----------------|
| Nenhum | 50% | 50% | — |
| Bronze | 40% | 60% | +20% |
| Silver | 25% | 75% | +50% |
| Gold | 10% | **90%** | +80% |
| Diamond | 0% | **100%** | +100% |

**Cenario real:** Voce acumulou 10.000 BKC em recompensas.
- Sem NFT: recebe 5.000 BKC. Os outros 5.000 sao queimados.
- Com Diamond: recebe **10.000 BKC**. Nada e queimado.

A diferenca e o dobro. Por isso os NFT Boosters sao os itens mais valiosos do ecossistema — eles literalmente **dobram** seus ganhos efetivos.

> Compre nos [NFT Pools](./NFT-Trading_Instant-Buy-Sell.md) ou alugue no [Mercado de Aluguel](./NFT-Rental_Affordable-Boost.md)

---

## Force Unstake: A Saida de Emergencia

Precisa dos seus tokens antes do lock expirar? Voce pode forcar o destrave, mas vai custar:

- **10% de penalidade** do valor travado (esses BKC sao queimados permanentemente)
- Suas recompensas acumuladas **nao sao perdidas** — ficam disponiveis pra claim

Force unstake existe como valvula de seguranca, nao como estrategia. A penalidade e queimada, o que beneficia todos os outros holders ao reduzir o supply.

---

## Referral: 5% das Suas Recompensas

Quando voce clama, 5% das suas recompensas liquidas vao pra quem te indicou (ou pro tesouro se voce nao tem referenciador). E por isso que vale a pena entrar pelo link de alguem — e tambem por que vale compartilhar o seu.

> Saiba mais sobre referrals em [Como Ganhar](./How-to-Earn_Three-Income-Streams.md)

---

## Suporte a Operadores

Builders que rodam seus proprios frontends ganham comissao em cada acao de staking:

| Acao | Quando o Operador Ganha |
|------|------------------------|
| `STAKING_DELEGATE` | Usuario faz stake de BKC |
| `STAKING_CLAIM` | Usuario clama recompensas |
| `STAKING_FORCE_UNSTAKE` | Usuario quebra um lock |

---

## Estrategias Avancadas

**O basico:** Delegue BKC + pegue pelo menos um Bronze. Ja e melhor que 90% dos delegadores.

**O intermediario:** Locks longos (1 ano+) com Gold ou Diamond. Re-delegue parte das recompensas pra composicao.

**O avancado:** Multiplas delegacoes com locks escalonados. Alugue Diamond antes de claims grandes. Use referrals pra renda extra.

**O expert:** Combine operador + referenciador + delegador. Tres fontes de renda. Todo o ETH e BKC fluindo pra voce.

---

## Taxas

- Taxa ETH no delegate, claim e force unstake (baseada em gas, vai pro ecossistema)
- Sem taxa BKC em acoes de staking (exceto a penalidade de 10% no force unstake)

---

Continue: [Mineracao](./Mining_From-Fees-to-Rewards.md) | [NFT Boosters](./NFT-Boosters_Earn-More.md) | [Aluguel de NFT](./NFT-Rental_Affordable-Boost.md)
