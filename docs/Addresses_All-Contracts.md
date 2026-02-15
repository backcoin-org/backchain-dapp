# Enderecos — Todos os Contratos na Blockchain

Todos os contratos do Backcoin estao deployados na **Arbitrum Sepolia** (Chain ID: 421614). Cada contrato listado abaixo (exceto o Faucet) e **totalmente imutavel** — sem admin, sem pause, sem upgrade. O unico contrato com parametros ajustaveis e o BackchainEcosystem, sujeito a [descentralizacao progressiva](./Governance_Community-Power.md).

Todos os contratos estao verificados no [Arbiscan Sepolia](https://sepolia.arbiscan.io). Voce pode ler o codigo fonte, interagir diretamente, e verificar tudo on-chain.

---

## Contratos Core

| Contrato | Endereco | Operador |
|----------|---------|:--------:|
| BKC Token | `0x1c8B7951ae769871470e9a8951d01dB39AA34123` | — |
| BackchainEcosystem | `0xDC88493D0979AF22e2C387A2fFd5230c62551997` | — |
| Liquidity Pool | `0x32c80323dD73E2d30c0389Ea9fc6a0ad998770bF` | — |
| Staking Pool | `0xeA5D34520783564a736258a9fd29775c9c1C8E78` | Sim |
| Buyback Miner | `0xD0B684Be70213dFbdeFaecaFECB50232897EC843` | Sim |

---

## Contratos NFT

| Contrato | Endereco | Operador |
|----------|---------|:--------:|
| RewardBooster (ERC-721) | `0x5507F70c71b8e1C694841E214fe8F9Dd7c899448` | — |
| NFT Pool — Bronze | `0xeE0953171514608f8b8F7B5A343c8123b2BfE8bD` | Sim |
| NFT Pool — Silver | `0xA8e76C5E21235fC2889A25Dff0769fFf5C784639` | Sim |
| NFT Pool — Gold | `0xbcDc78a2C985722C170153015957Acb73df08F89` | Sim |
| NFT Pool — Diamond | `0x2d9fb50A5d147598fBb1151F75B8C3E261fb1Dea` | Sim |

---

## Contratos de Servico

| Contrato | Endereco | Operador |
|----------|---------|:--------:|
| Fortune Pool | `0x319bfC89f4d9F2364E7e454e4950ca6e440211ED` | Sim |
| Agora (Social) | `0x60088001DB6Ae83Bc9513426e415895802DBA39a` | Sim |
| Cartorio Digital | `0x89DE7ea670CeEeEFA21e4dAC499313D3E0cfbB0e` | Sim |
| Arrecadacao | `0x31E8B7F825610aFd3d5d25C11e9C062D27289BB2` | Sim |
| Aluguel de NFT | `0xa2303db7e2D63398a68Ea326a3566bC92f129D44` | Sim |

---

## Governanca e Utilidade

| Contrato | Endereco | Operador |
|----------|---------|:--------:|
| Governanca | `0xA82F69f079566958c16F601A9625E40AeEeFbFf8` | — |
| NFT Fusion | `0x9e120fDA815fce4f3eFf5A7b666F20cc8d32aCF6` | — |
| Faucet BKC | `0xb80e5389b16693CAEe4655b535cc7Bceb4770255` | — |

---

## Copy-Paste pra Desenvolvedores

```javascript
const CONTRACTS = {
    bkcToken:             "0x1c8B7951ae769871470e9a8951d01dB39AA34123",
    backchainEcosystem:   "0xDC88493D0979AF22e2C387A2fFd5230c62551997",
    liquidityPool:        "0x32c80323dD73E2d30c0389Ea9fc6a0ad998770bF",
    stakingPool:          "0xeA5D34520783564a736258a9fd29775c9c1C8E78",
    buybackMiner:         "0xD0B684Be70213dFbdeFaecaFECB50232897EC843",
    rewardBooster:        "0x5507F70c71b8e1C694841E214fe8F9Dd7c899448",
    nftFusion:            "0x9e120fDA815fce4f3eFf5A7b666F20cc8d32aCF6",
    pool_bronze:          "0xeE0953171514608f8b8F7B5A343c8123b2BfE8bD",
    pool_silver:          "0xA8e76C5E21235fC2889A25Dff0769fFf5C784639",
    pool_gold:            "0xbcDc78a2C985722C170153015957Acb73df08F89",
    pool_diamond:         "0x2d9fb50A5d147598fBb1151F75B8C3E261fb1Dea",
    fortunePool:          "0x319bfC89f4d9F2364E7e454e4950ca6e440211ED",
    agora:                "0x60088001DB6Ae83Bc9513426e415895802DBA39a",
    notary:               "0x89DE7ea670CeEeEFA21e4dAC499313D3E0cfbB0e",
    charityPool:          "0x31E8B7F825610aFd3d5d25C11e9C062D27289BB2",
    rentalManager:        "0xa2303db7e2D63398a68Ea326a3566bC92f129D44",
    simpleBkcFaucet:      "0xb80e5389b16693CAEe4655b535cc7Bceb4770255",
    backchainGovernance:  "0xA82F69f079566958c16F601A9625E40AeEeFbFf8",
};
```

Ou use o SDK:

```typescript
import { getAddresses } from '@backchain/core';
const addresses = getAddresses('arbitrum-sepolia');
```

---

## Sistema de Operadores

Contratos marcados com **"Sim"** na coluna Operador aceitam o parametro `operator`. Quando usuarios interagem pelo seu frontend, passe seu endereco de carteira como operador pra ganhar comissao em cada transacao.

> Guia completo: [Operadores — Construa e Ganhe](./Operators_Build-and-Earn.md)

---

## Verificacao

| Detalhe | Valor |
|---------|-------|
| Rede | Arbitrum Sepolia (Chain ID 421614) |
| Explorer | https://sepolia.arbiscan.io |
| Compilador | Solidity 0.8.28 |
| Otimizador | runs=1, viaIR=true |
| Status | Todos os contratos verificados |
