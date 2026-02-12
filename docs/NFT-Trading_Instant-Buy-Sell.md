# Trading de NFT — Compra e Venda Instantanea

Mercados automaticos de bonding curve pra negociar Reward Booster NFTs. Sem listings, sem leiloes, sem espera — compra e venda instantanea a preco de mercado.

---

## Enderecos dos Pools

| Tier | Endereco |
|------|---------|
| Bronze | 0xeE0953171514608f8b8F7B5A343c8123b2BfE8bD |
| Silver | 0xA8e76C5E21235fC2889A25Dff0769fFf5C784639 |
| Gold | 0xbcDc78a2C985722C170153015957Acb73df08F89 |
| Diamond | 0x2d9fb50A5d147598fBb1151F75B8C3E261fb1Dea |

---

## Como Bonding Curves Funcionam

Cada pool usa a formula de produto constante (XY=K):

```
K = QUANTIDADE_NFT x SALDO_BKC

Preco de Compra  = K / (QUANTIDADE_NFT - 1) - SALDO_BKC
Preco de Venda   = SALDO_BKC - K / (QUANTIDADE_NFT + 1)
```

O ponto chave: precos se movem automaticamente baseados em oferta e demanda. Quando mais gente compra, o preco sobe. Quando mais gente vende, o preco desce. Sem order book necessario.

Exemplo de Preco

Suponha que um pool tem 10 NFTs e 50.000 BKC (K = 500.000):

| Acao | NFTs Depois | BKC Depois | Preco |
|------|------------|-----------|-------|
| Comprar 1 NFT | 9 | ~55.556 BKC | 5.556 BKC |
| Comprar mais 1 | 8 | ~62.500 BKC | 6.944 BKC |
| Vender 1 NFT | 11 | ~45.455 BKC | 4.545 BKC |

Precos aumentam a cada compra e diminuem a cada venda — o comportamento classico de bonding curve.

---

## Taxas

Trades de NFT Pool pagam apenas taxas ETH (baseadas em gas):
- Cada tier pode ter taxas ETH diferentes
- Taxas vao pro ecossistema (operador, referenciador, tesouro, buyback)
- Sem taxa BKC nos trades

---

## Seguranca

- Protecao do ultimo NFT — O pool nao vende seu ultimo NFT (sempre mantem liquidez)
- Protecao contra slippage — Sete maxPrice nas compras e minPayout nas vendas pra evitar surpresas
- Sem rug pull — Liquidez do pool (BKC) nao pode ser removida por ninguem, nunca
- Imutavel — Sem funcoes de admin, sem mudanca de parametros depois do deploy

---

## Estrategia de Trading

Como precos se movem a cada trade:
- Compradores iniciais pegam precos mais baixos quando o pool tem mais NFTs
- Vendedores conseguem precos melhores quando o pool tem menos NFTs (alta demanda)
- Arbitragem e possivel entre bonding curves e o mercado de aluguel

---

## Suporte a Operadores

Cada transacao de compra e venda de NFT suporta o Sistema de Operadores. Passe sua carteira como operador pra ganhar comissoes ETH nos trades pelo seu frontend.

Esse e um dos mercados de trading mais ativos no ecossistema — otimo pra operadores que querem receita de comissao consistente.

Veja tambem: [NFT Boosters](./NFT-Boosters_Earn-More.md) | [Aluguel de NFT](./NFT-Rental_Affordable-Boost.md) | [Taxas](./Fees_Complete-Table.md)
