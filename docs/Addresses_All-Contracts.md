# Enderecos — Todos os Contratos na Blockchain

Todos os contratos do Backcoin estao deployados na **Ethereum Sepolia** (Chain ID: 11155111). Cada contrato listado abaixo (exceto o Faucet) e **totalmente imutavel** — sem admin, sem pause, sem upgrade. O unico contrato com parametros ajustaveis e o BackchainEcosystem, sujeito a [descentralizacao progressiva](./Governance_Community-Power.md).

Todos os contratos estao verificados no [Etherscan Sepolia](https://sepolia.etherscan.io). Voce pode ler o codigo fonte, interagir diretamente, e verificar tudo on-chain.

---

## Contratos Core

| Contrato | Endereco | Operador |
|----------|---------|:--------:|
| BKC Token | `0x080627Bd394e0F34535B0F3c70090D181f87d913` | — |
| BackchainEcosystem | `0xB0FA8544d8bEF47Fb691c17D3086BA30ed3B400C` | — |
| Liquidity Pool | `0xAe22a5Dc2424d97F8915A49C99B924D20082Cb24` | — |
| Staking Pool | `0xA7B61b8597A00D738FDb3715563F00e5cef0bB7f` | Sim |
| Buyback Miner | `0x47B9F6F8517542eb93130af4B04834E7da279Bcd` | Sim |

---

## Contratos NFT

| Contrato | Endereco | Operador |
|----------|---------|:--------:|
| RewardBooster (ERC-721) | `0x99E790Fac2a825654D480492CDBb779e3EB53dF4` | — |
| NFT Pool — Bronze | `0xCF6b80128c3A355aE1775bC2E9639305B850459E` | Sim |
| NFT Fusion | `0x89605E4cf3c49bE3d7b519D1a7ac91980078D4c7` | — |

---

## Contratos de Servico

| Contrato | Endereco | Operador |
|----------|---------|:--------:|
| Fortune Pool | `0xC76b8F773414D101231FE265Af0A84C32eeb7460` | Sim |
| Agora (Social) | `0xa4c0FC770579F644fc4595a82d0d138f7088da90` | Sim |
| Cartorio Digital | `0xFe3F90C76F1aAEED93b8063238658FF3CAD62d24` | Sim |
| Arrecadacao | `0x0E0B7277A8d454155b2152d3E0b3BAa9B63F54Ab` | Sim |
| Aluguel de NFT | `0x9c42BF4860ad02e95A6bd944aC2a11036cC959Ed` | Sim |

---

## Governanca e Utilidade

| Contrato | Endereco | Operador |
|----------|---------|:--------:|
| Governanca | `0x28244003181711f09f9573BAf0E26F879A278227` | — |
| Faucet BKC | `0xc4B75392935541Bef1D58e152522ce60559610bf` | — |

---

## Copy-Paste pra Desenvolvedores

```javascript
const CONTRACTS = {
    bkcToken:             "0x080627Bd394e0F34535B0F3c70090D181f87d913",
    backchainEcosystem:   "0xB0FA8544d8bEF47Fb691c17D3086BA30ed3B400C",
    liquidityPool:        "0xAe22a5Dc2424d97F8915A49C99B924D20082Cb24",
    stakingPool:          "0xA7B61b8597A00D738FDb3715563F00e5cef0bB7f",
    buybackMiner:         "0x47B9F6F8517542eb93130af4B04834E7da279Bcd",
    rewardBooster:        "0x99E790Fac2a825654D480492CDBb779e3EB53dF4",
    nftFusion:            "0x89605E4cf3c49bE3d7b519D1a7ac91980078D4c7",
    poolBronze:           "0xCF6b80128c3A355aE1775bC2E9639305B850459E",
    fortunePool:          "0xC76b8F773414D101231FE265Af0A84C32eeb7460",
    agora:                "0xa4c0FC770579F644fc4595a82d0d138f7088da90",
    notary:               "0xFe3F90C76F1aAEED93b8063238658FF3CAD62d24",
    charityPool:          "0x0E0B7277A8d454155b2152d3E0b3BAa9B63F54Ab",
    rentalManager:        "0x9c42BF4860ad02e95A6bd944aC2a11036cC959Ed",
    simpleBkcFaucet:      "0xc4B75392935541Bef1D58e152522ce60559610bf",
    backchainGovernance:  "0x28244003181711f09f9573BAf0E26F879A278227",
};
```

Ou use o SDK:

```typescript
import { getAddresses } from '@backchain/core';
const addresses = getAddresses('sepolia');
```

---

## Sistema de Operadores

Contratos marcados com **"Sim"** na coluna Operador aceitam o parametro `operator`. Quando usuarios interagem pelo seu frontend, passe seu endereco de carteira como operador pra ganhar comissao em cada transacao.

> Guia completo: [Operadores — Construa e Ganhe](./Operators_Build-and-Earn.md)

---

## Verificacao

| Detalhe | Valor |
|---------|-------|
| Rede | Ethereum Sepolia (Chain ID 11155111) |
| Explorer | https://sepolia.etherscan.io |
| Compilador | Solidity 0.8.28 |
| Otimizador | runs=1, viaIR=true |
| Status | Todos os contratos verificados |
