# Staking — Trave seus Tokens e Ganhe Recompensas

Trave seus tokens BKC pra ganhar recompensas de mineracao. Quanto mais tempo travar, mais poder voce tem, e maior sua fatia das recompensas.

Contrato: 0xeA5D34520783564a736258a9fd29775c9c1C8E78

---

## Como Funciona

1. Delegue — Trave BKC por um periodo entre 1 e 3.650 dias (10 anos)
2. Ganhe — Receba recompensas de mineracao proporcionais ao seu poder de delegacao (pStake)
3. Clame — Retire suas recompensas a qualquer momento (sujeito a taxa de burn)
4. Destrave — Recupere seus BKC quando o periodo de lock terminar

---

## Poder de Delegacao (pStake)

Sua fatia das recompensas e baseada no pStake, nao so no valor que voce travou. Locks mais longos dao mais poder:

```
pStake = Valor x (10000 + diasLock x 5918 / 365) / 10000
```

Exemplos:

| Valor | Periodo de Lock | pStake | Multiplicador |
|-------|----------------|--------|---------------|
| 10.000 BKC | 30 dias | 10.486 | 1.05x |
| 10.000 BKC | 180 dias | 12.919 | 1.29x |
| 10.000 BKC | 365 dias | 15.918 | 1.59x |
| 10.000 BKC | 1.825 dias | 39.590 | 3.96x |

Travar por mais tempo nao ganha so mais — ganha desproporcionalmente mais. Um lock de 5 anos da quase 4x o poder de um lock de 1 dia.

---

## Taxa de Burn no Claim

Quando voce clama recompensas, uma porcentagem e queimada. Isso e por design — cria pressao deflacionaria e da valor pros NFT Boosters.

| NFT Booster | Taxa de Burn | Voce Recebe |
|------------|-------------|-------------|
| Nenhum | 50% | 50% |
| Bronze | 40% | 60% |
| Silver | 25% | 75% |
| Gold | 10% | 90% |
| Diamond | 0% | 100% |

Sem NFT, voce fica com metade das recompensas. Com Diamond, voce fica com tudo. Por isso os Booster NFTs sao os itens mais importantes do ecossistema.

Voce pode comprar NFTs nos [NFT Pools](./NFT-Trading_Instant-Buy-Sell.md) ou alugar no [Mercado de Aluguel](./NFT-Rental_Affordable-Boost.md).

---

## Force Unstake

Precisa dos seus tokens antes do lock expirar? Voce pode forcar o destrave, mas tem um custo:

- 10% de penalidade do valor travado (esses BKC sao queimados)
- Suas recompensas sao preservadas — nao sao perdidas, so nao sao auto-clamadas

Force unstake e uma valvula de seguranca, nao uma estrategia recomendada. A penalidade e queimada, o que beneficia todos os holders restantes.

---

## Recompensas de Referral

Quando voce clama recompensas de staking, 5% das suas recompensas liquidas vao pra pessoa que te indicou (ou pro tesouro se voce nao tem referenciador). Isso incentiva crescimento e recompensa quem traz novos usuarios pro ecossistema.

---

## Suporte a Operadores

Cada acao de staking suporta o sistema de operadores. Quando usuarios fazem staking pelo seu frontend, voce ganha comissao na taxa ETH.

Acoes suportadas:
- STAKING_DELEGATE — Quando um usuario faz stake de BKC
- STAKING_CLAIM — Quando um usuario clama recompensas
- STAKING_FORCE_UNSTAKE — Quando um usuario quebra um lock

---

## Dicas de Estrategia

- Trave por mais tempo pra mais poder. Um lock de 1 ano da 1.59x de poder versus um lock de 1 dia.
- Pegue um NFT Booster. Ate um Bronze salva 10% em cada claim. Com o tempo, isso se acumula muito.
- Clame na hora certa. Recompensas acumulam continuamente. Voce nao perde recompensas esperando.
- Use referrals. Se alguem te indicou, 5% das suas recompensas vao pra essa pessoa. Sete seu referenciador cedo.
- Empilhe delegacoes. Voce pode ter multiplas delegacoes ativas com periodos de lock diferentes.

---

## Taxas

- Taxa ETH no delegate, claim e force unstake (baseada em gas, vai pro ecossistema)
- Sem taxa BKC em acoes de staking

Veja tambem: [Mineracao](./Mining_From-Fees-to-Rewards.md) | [NFT Boosters](./NFT-Boosters_Earn-More.md) | [Aluguel de NFT](./NFT-Rental_Affordable-Boost.md)
