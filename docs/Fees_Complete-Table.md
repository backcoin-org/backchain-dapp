# Taxas — Tabela Completa

Todas as taxas do Backcoin sao transparentes e verificaveis on-chain. O ecossistema usa modelo de taxas duplas: taxas ETH (baseadas em gas) e taxas BKC (baseadas em valor).

---

## Como as Taxas Funcionam

Taxas ETH sao calculadas com base nos precos de gas da rede e um multiplicador por acao. Elas fluem pelo ecossistema para operadores, referenciadores, tesouro e buyback.

Taxas BKC sao uma porcentagem do valor BKC envolvido na transacao. Sao divididas entre burn, delegadores e tesouro.

Ambos os tipos suportam o Sistema de Operadores — builders que rodam seus proprios frontends ganham uma fatia automaticamente.

---

## Distribuicao das Taxas

Fluxo de Taxas ETH:
```
Usuario paga taxa ETH
    → Parte pro referenciador (se tiver)
    → Parte pro operador (se tiver)
    → Tesouro
    → Acumulador de buyback (alimenta o Miner)
```

Fluxo de Taxas BKC:
```
Usuario paga taxa BKC
    → Burn (reduz supply total)
    → Staking Pool (recompensas pros delegadores)
    → Tesouro
```

---

## Taxas por Servico

### Staking
| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Delegar (Stake) | Baseada em gas | Nenhuma |
| Clamar Recompensas | Baseada em gas | Nenhuma |
| Force Unstake | Baseada em gas | 10% penalidade (queimada) |

### Fortune Pool
| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Jogar Easy (1-4, 3x) | Baseada em gas por tier | 20% da aposta |
| Jogar Medium (1-20, 15x) | Baseada em gas por tier | 20% da aposta |
| Jogar Hard (1-100, 75x) | Baseada em gas por tier | 20% da aposta |
| Combo (multiplos tiers) | Soma dos tiers ativos | 20% da aposta |

### NFT Pools (Bonding Curve)
| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Comprar NFT (qualquer tier) | Baseada em gas por tier | Nenhuma |
| Vender NFT (qualquer tier) | Baseada em gas por tier | Nenhuma |

### Aluguel de NFT
| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Alugar um NFT | Baseada em gas | Nenhuma |
| Listar pra Aluguel | Nenhuma | Nenhuma |

### Agora (Rede Social)
| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Criar Post | Baseada em gas (varia por tipo de midia) | Nenhuma |
| Responder | Baseada em gas | Nenhuma |
| Like | Gratis | Nenhuma |
| SuperLike | 100 gwei por like | Nenhuma |
| Downvote | 100 gwei por voto | Nenhuma |
| Registrar Username | Preco por tamanho | Nenhuma |

### Cartorio Digital
| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Certificar Documento | Baseada em gas | Nenhuma |
| Certificar em Lote | Baseada em gas (por documento) | Nenhuma |
| Verificar Documento | Gratis | Gratis |

### Arrecadacao
| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Criar Campanha | Baseada em gas (pequena) | Nenhuma |
| Doar | Baseada em valor (% da doacao) | Nenhuma |

### Pool de Liquidez
| Acao | Taxa ETH | Taxa BKC |
|------|----------|----------|
| Swap ETH/BKC | 0.3% taxa de swap | Nenhuma |
| Adicionar Liquidez | Nenhuma | Nenhuma |
| Remover Liquidez | Nenhuma | Nenhuma |

---

## Por Que Taxas Existem

Taxas nao sao imposto — sao o combustivel que move o ecossistema inteiro:

1. Operadores ganham em cada transacao no seu frontend
2. Referenciadores ganham por trazer novos usuarios
3. Delegadores ganham atraves dos ciclos de buyback
4. Burns reduzem supply — tornando o BKC restante mais escasso
5. Tesouro financia crescimento e manutencao do ecossistema

Quanto mais atividade, mais taxas, mais todo mundo ganha. E um sistema de soma positiva.

---

## Configuracao de Taxas

Taxas sao configuradas no contrato BackchainEcosystem e podem ser ajustadas pelo processo de [Governanca](./Governance_Community-Power.md). O ecossistema impoe limites maximos:

- Taxa ETH maxima: 50% (5.000 basis points)
- Multiplicador de gas maximo: 2.000.000x
- Estimativa de gas maxima: 30.000.000

Esses limites sao codificados e nao podem ser ultrapassados por governanca.

Veja tambem: [Economia](./Economy_How-It-Works.md) | [Operadores](./Operators_Build-and-Earn.md) | [Mineracao](./Mining_From-Fees-to-Rewards.md)
