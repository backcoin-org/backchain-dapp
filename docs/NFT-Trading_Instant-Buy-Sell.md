# Trading de NFT — Compra e Venda Instantanea

Esqueca listings, leiloes e espera. Os NFT Pools do Backcoin usam **bonding curves** — mercados automaticos onde voce compra e vende Booster NFTs instantaneamente, a qualquer hora, com preco determinado por oferta e demanda. Sem contraparte necessaria.

---

## Os Pools

Cada tier de NFT Booster tem seu proprio pool com liquidez independente:

| Tier | Endereco |
|------|---------|
| Bronze | `0xeE0953171514608f8b8F7B5A343c8123b2BfE8bD` |
| Silver | `0xA8e76C5E21235fC2889A25Dff0769fFf5C784639` |
| Gold | `0xbcDc78a2C985722C170153015957Acb73df08F89` |
| Diamond | `0x2d9fb50A5d147598fBb1151F75B8C3E261fb1Dea` |

---

## Como Bonding Curves Funcionam

Cada pool usa a formula de **produto constante** (a mesma matematica do Uniswap):

```
K = QUANTIDADE_NFT x SALDO_BKC

Preco de Compra  = K / (QUANTIDADE_NFT - 1) - SALDO_BKC
Preco de Venda   = SALDO_BKC - K / (QUANTIDADE_NFT + 1)
```

A ideia e simples: quando mais gente compra, sobram menos NFTs no pool, e o preco **sobe**. Quando mais gente vende, tem mais NFTs, e o preco **desce**. O mercado se auto-regula.

**Exemplo concreto:**

Um pool com 10 NFTs e 50.000 BKC (K = 500.000):

| Acao | NFTs no Pool | BKC no Pool | Preco da Operacao |
|------|-------------|------------|-------------------|
| Comprar 1 NFT | 9 | ~55.556 | **5.556 BKC** |
| Comprar mais 1 | 8 | ~62.500 | **6.944 BKC** |
| Vender 1 NFT | 11 | ~45.455 | **4.545 BKC** |

Cada compra encarece o proximo NFT. Cada venda barateia. Isso e bonding curve em acao.

> **Por que isso importa:** Voce nunca precisa esperar um comprador ou vendedor. O pool sempre esta la, com liquidez, 24/7. Compra e venda sao instantaneas.

---

## Taxas

Trades de NFT pagam apenas taxas ETH (baseadas em gas):
- Cada tier pode ter multiplicadores diferentes
- Taxas fluem pro ecossistema (operador, referenciador, tesouro, buyback)
- **Sem taxa BKC** nos trades — voce paga o preco da bonding curve e a taxa ETH, nada mais

---

## Seguranca: Sem Rug Pull, Sem Surpresas

| Protecao | O Que Garante |
|----------|--------------|
| **Protecao do ultimo NFT** | O pool nunca vende seu ultimo NFT — sempre mantem liquidez |
| **Protecao contra slippage** | Use `maxPrice` nas compras e `minPayout` nas vendas |
| **Sem rug pull** | A liquidez (BKC) do pool nao pode ser removida. Por ninguem. Nunca. |
| **Imutavel** | Sem funcoes de admin. Parametros sao fixos apos o deploy. |

Os pools nao tem dono. Nao tem admin. Nao tem botao de emergencia. A liquidez esta la e vai ficar la.

---

## Estrategias de Trading

Como precos se movem a cada trade, oportunidades surgem naturalmente:

**Compradores iniciais** pegam precos mais baixos quando o pool tem muitos NFTs. Se a demanda subir, voce pagou barato por um NFT que agora vale mais.

**Vendedores estrategicos** conseguem precos melhores quando o pool tem poucos NFTs (alta demanda). Comprou na baixa? Venda quando o pool estiver esvaziando.

**Arbitragem** entre a bonding curve e o mercado de aluguel: se o custo de comprar + alugar + vender for positivo, tem lucro na mesa.

---

## Pra Operadores: Receita Consistente

Cada compra e venda de NFT pelo seu frontend gera comissao ETH. Trading de NFT e uma das atividades mais frequentes e de maior valor no ecossistema — usuarios compram e vendem conforme precos se movem, criando **receita recorrente** pro operador.

---

Continue: [NFT Boosters](./NFT-Boosters_Earn-More.md) | [Aluguel de NFT](./NFT-Rental_Affordable-Boost.md) | [Taxas](./Fees_Complete-Table.md)
