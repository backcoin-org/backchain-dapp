# Taxas — Tabela Completa

Cada centavo de taxa no Backcoin tem um destino claro: operadores, referenciadores, delegadores, burn ou tesouro. Nada desaparece num buraco negro. Tudo e verificavel on-chain.

Este documento detalha cada taxa, em cada servico, com seus destinos.

---

## Como as Taxas Funcionam

O Backcoin usa um modelo de **taxas duplas**:

**Taxas ETH** — Calculadas com base nos precos de gas da rede. Fluem pelo ecossistema:
```
Usuario paga taxa ETH
    → Operador (comissao do builder)
    → Referenciador (quem trouxe o usuario)
    → Tesouro (fundos do protocolo)
    → Buyback (alimenta o ciclo de mineracao)
```

**Taxas BKC** — Porcentagem do valor BKC envolvido na transacao. Distribuidas entre:
```
Usuario paga taxa BKC
    → Burn (removido permanentemente)
    → Staking Pool (recompensas pros delegadores)
    → Tesouro (fundos do protocolo)
```

Ambos os tipos suportam o **Sistema de Operadores** — builders que rodam seus frontends ganham automaticamente.

---

## Taxas por Servico

### Staking

| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Delegar (Stake) | Baseada em gas | Nenhuma |
| Clamar Recompensas | Baseada em gas | Nenhuma |
| Force Unstake | Baseada em gas | **10% penalidade (queimada)** |

> O burn de 10% no force unstake e uma penalidade por quebrar o time-lock. Esses BKC sao destruidos permanentemente.

### Fortune Pool

| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Jogar Easy (1-4, 3x) | Baseada em gas, por tier | **20% da aposta** |
| Jogar Medium (1-20, 15x) | Baseada em gas, por tier | **20% da aposta** |
| Jogar Hard (1-100, 75x) | Baseada em gas, por tier | **20% da aposta** |
| Combo (multiplos tiers) | Soma dos tiers ativos | **20% da aposta** |

> Os 20% da taxa BKC sao divididos entre burn, delegadores, tesouro e operador. Os 80% restantes entram no prize pool.

### NFT Pools (Bonding Curve)

| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Comprar NFT (qualquer tier) | Baseada em gas, por tier | Nenhuma |
| Vender NFT (qualquer tier) | Baseada em gas, por tier | Nenhuma |

> Cada tier pode ter multiplicadores de gas diferentes. O preco do NFT em si e determinado pela bonding curve — a taxa e apenas o custo de gas pro ecossistema.

### NFT Fusion

| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Fuse (2 NFTs → 1 tier acima) | Baseada em gas, por tier | Nenhuma |
| Split (1 NFT → 2 tier abaixo) | Baseada em gas, por tier | Nenhuma |

### Aluguel de NFT

| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Alugar um NFT | Baseada em gas | Nenhuma |
| Listar pra Aluguel | Nenhuma | Nenhuma |
| Retirar do Aluguel | Nenhuma | Nenhuma |

### Agora (Rede Social)

| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Criar Post | Baseada em gas (varia por tipo de midia) | Nenhuma |
| Responder | Baseada em gas | Nenhuma |
| Like | **Gratis** | Nenhuma |
| SuperLike | 100 gwei por like (vai pro autor) | Nenhuma |
| Downvote | 100 gwei por voto (vai pro ecossistema) | Nenhuma |
| Registrar Username | Preco por tamanho do nome | Nenhuma |

> Tipo de midia afeta a taxa: texto e mais barato, video e mais caro. SuperLikes e downvotes tem preco fixo.

### Cartorio Digital

| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Certificar Documento | Baseada em gas | Nenhuma |
| Certificar em Lote | Baseada em gas (por documento) | Nenhuma |
| Verificar Documento | **Gratis** | **Gratis** |

### Arrecadacao

| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Criar Campanha | Baseada em gas (pequena) | Nenhuma |
| Doar | Baseada em valor (% da doacao) | Nenhuma |
| Fechar/Sacar | **Gratis** | **Gratis** |

### Pool de Liquidez

| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Swap ETH → BKC / BKC → ETH | **0.3% do valor** | Nenhuma |
| Adicionar Liquidez | Nenhuma | Nenhuma |
| Remover Liquidez | Nenhuma | Nenhuma |

---

## Pra Que Servem as Taxas

Taxas nao sao imposto. Sao o **combustivel** que move o ecossistema inteiro:

| Destino | O Que Financia |
|---------|---------------|
| **Operadores** | Comissoes pros builders que rodam frontends |
| **Referenciadores** | Recompensas pra quem traz novos usuarios |
| **Buyback** | O ciclo que gera recompensas de mineracao |
| **Burn** | Reducao permanente de supply (deflacao) |
| **Delegadores** | Pool de recompensas de staking |
| **Tesouro** | Crescimento e manutencao do ecossistema |

Quanto mais atividade, mais taxas. Mais taxas, mais todo mundo ganha. E um sistema de **soma positiva** — nao e voce contra o protocolo, e voce com o protocolo.

---

## Limites de Seguranca

Taxas sao configuraveis pela [Governanca](./Governance_Community-Power.md), mas com limites maximos codificados:

| Limite | Valor |
|--------|-------|
| Taxa ETH maxima | 50% (5.000 basis points) |
| Multiplicador de gas maximo | 2.000.000x |
| Estimativa de gas maxima | 30.000.000 |

Esses limites sao **hardcoded** no contrato e nao podem ser ultrapassados por ninguem.

---

Continue: [Economia](./Economy_How-It-Works.md) | [Operadores](./Operators_Build-and-Earn.md) | [Mineracao](./Mining_From-Fees-to-Rewards.md)
