# NFT Boosters — Ganhe Mais com seus Tokens

Quatro tiers de NFTs utilitarios que aumentam diretamente seus ganhos de staking. Eles reduzem a taxa de burn quando voce clama recompensas de mineracao — quanto melhor o NFT, mais voce recebe.

Contrato: 0x5507F70c71b8e1C694841E214fe8F9Dd7c899448 (ERC-721)

---

## Os Quatro Tiers

| Tier | Boost | Taxa de Burn | Voce Recebe | Cor |
|------|-------|-------------|-------------|-----|
| Diamond | 50% | 0% | 100% | Ciano |
| Gold | 40% | 10% | 90% | Amarelo |
| Silver | 25% | 25% | 75% | Cinza |
| Bronze | 10% | 40% | 60% | Ambar |

Sem nenhum NFT, a taxa de burn padrao e 50% — voce perde metade das suas recompensas toda vez que clama. Ate um Bronze ja salva 10% em cada claim, e em centenas de claims, essa diferenca e enorme.

---

## Por Que Importam

Considere um delegador ganhando 10.000 BKC em recompensas:

| NFT | Queimado | Voce Recebe | Economia vs Sem NFT |
|-----|----------|------------|---------------------|
| Nenhum | 5.000 BKC | 5.000 BKC | — |
| Bronze | 4.000 BKC | 6.000 BKC | +1.000 BKC |
| Silver | 2.500 BKC | 7.500 BKC | +2.500 BKC |
| Gold | 1.000 BKC | 9.000 BKC | +4.000 BKC |
| Diamond | 0 BKC | 10.000 BKC | +5.000 BKC |

Um holder de Diamond ganha o dobro de alguem sem NFT, com a mesma posicao de staking.

---

## Como Conseguir Um

Booster NFTs sao negociados em pools de bonding curve. O preco muda baseado em oferta e demanda — sem listings, sem leiloes, trades instantaneos.

| Pool | Endereco |
|------|---------|
| Bronze Pool | 0xeE0953171514608f8b8F7B5A343c8123b2BfE8bD |
| Silver Pool | 0xA8e76C5E21235fC2889A25Dff0769fFf5C784639 |
| Gold Pool | 0xbcDc78a2C985722C170153015957Acb73df08F89 |
| Diamond Pool | 0x2d9fb50A5d147598fBb1151F75B8C3E261fb1Dea |

Veja [Trading de NFT](./NFT-Trading_Instant-Buy-Sell.md) pra detalhes de como as bonding curves funcionam.

---

## Alugar ao Inves de Comprar

Nao tem grana pra um NFT de tier alto? Alugue um. O Mercado de Aluguel deixa voce aproveitar o boost de staking sem comprar o NFT. Donos ganham ETH passivo, locatarios economizam no burn.

Veja [Aluguel de NFT](./NFT-Rental_Affordable-Boost.md) pra detalhes.

---

## Fatos Importantes

- Padrao ERC-721 — Compativel com qualquer marketplace de NFTs
- Supply fixo — Uma vez mintados, nenhum NFT novo pode ser criado
- Um boost ativo por carteira — Seu melhor NFT (proprio ou alugado) e usado automaticamente
- Sem funcoes de admin — Supply e permanente, sem mint depois da configuracao
- Totalmente negociaveis — Compre, venda, alugue ou transfira livremente

---

## Pra Builders

NFT Pools suportam o Sistema de Operadores. Cada transacao de compra e venda pelo seu frontend te ganha comissao na taxa ETH. Como trading de NFT e frequente e de alto valor, essa e uma das oportunidades mais lucrativas pra operadores.

Veja tambem: [Trading de NFT](./NFT-Trading_Instant-Buy-Sell.md) | [Aluguel de NFT](./NFT-Rental_Affordable-Boost.md) | [Staking](./Staking_Lock-and-Earn.md)
