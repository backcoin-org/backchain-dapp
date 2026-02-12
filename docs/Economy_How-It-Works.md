# Economia do Backcoin — Como Tudo Funciona

Este documento explica o modelo economico completo do ecossistema Backcoin — como valor e criado, distribuido e sustentado.

---

## Supply

| Metrica | Valor |
|---------|-------|
| Supply Maximo | 200.000.000 BKC |
| Inicial (TGE) | 40.000.000 BKC (20%) |
| Recompensas de Atividade | 160.000.000 BKC (80%) |
| Alocacao pro Time | 0% |
| VC / Venda Privada | 0% |

Por que zero alocacao pro time? Backcoin foi desenhado pra ser verdadeiramente sem permissao. O protocolo ganha atraves dos mesmos mecanismos disponiveis pra todo mundo — comissoes de operador, staking e participacao. O time nao tem privilegios especiais.

---

## Distribuicao Inicial (40M BKC)

Os 40M tokens iniciais sao usados pra:

- Liquidity Pool — Semente do par de trading ETH/BKC pra usuarios poderem trocar desde o dia um
- Faucet — BKC gratis pra novos usuarios comecarem
- Crescimento do Ecossistema — Campanhas comunitarias, airdrops, parcerias

Nenhum token e travado ou vestido pra insiders. Tudo vai pra tornar a plataforma usavel.

---

## Recompensas de Atividade (160M BKC)

Os 160M BKC restantes sao liberados pelo Buyback Miner baseado em uso real do protocolo:

1. Usuarios geram taxas ETH atraves de atividade normal
2. ETH acumula no contrato do ecossistema
3. O Buyback Miner converte ETH em recompensas BKC + minta novos BKC
4. Recompensas vao pra delegadores proporcional ao seu poder de delegacao

Curva de Escassez

A taxa de mint diminui conforme o supply cresce:

```
Taxa de Mineracao = (200M - Supply Atual) / 160M

Supply 40M  → Taxa 100% (recompensas maximas)
Supply 80M  → Taxa 75%
Supply 120M → Taxa 50%
Supply 160M → Taxa 25%
Supply 200M → Taxa 0% (teto alcancado, yield real puro)
```

Isso cria escassez natural. Participantes que entram cedo se beneficiam de taxas de mineracao mais altas, mas as recompensas nunca param — quando o teto e alcancado, delegadores ainda ganham com buybacks (ETH real convertido em BKC).

---

## Estrutura de Taxas

Backcoin usa um modelo de taxas duplas. Cada acao gera dois tipos de taxa:

Taxas ETH (baseadas em gas)
Calculadas com base nos precos de gas da rede. Divididas entre:
- Operador — Comissao pro builder do frontend
- Referenciador — Recompensa por trazer o usuario
- Tesouro — Fundos operacionais do protocolo
- Buyback — Acumulado pro ciclo de mineracao

Taxas BKC (baseadas em valor)
Aplicadas como porcentagem do valor BKC envolvido. Divididas entre:
- Burn — Removido permanentemente de circulacao
- Delegadores — Adicionado ao pool de recompensas
- Tesouro — Fundos operacionais do protocolo

Veja a [Tabela de Taxas](./Fees_Complete-Table.md) completa pra detalhes de cada servico.

---

## Mecanismos Deflacionarios

Multiplas forcas reduzem o supply de BKC com o tempo:

| Mecanismo | Como Funciona |
|-----------|--------------|
| Burn no Staking | Ate 50% das recompensas queimadas no claim (reduzido com NFT Boosters) |
| Burn no Buyback | 5% de cada ciclo de mineracao e queimado |
| Fortune Pool | Taxa de 20% BKC inclui componente de burn |
| Burn Voluntario | Qualquer pessoa pode queimar seus proprios tokens |
| Force Unstake | 10% de penalidade queimada ao quebrar time-lock |

Conforme o ecossistema cresce, mais BKC e queimado do que mintado, criando pressao deflacionaria.

---

## Ciclo de Valor

Veja como tudo se conecta:

```
Usuarios fazem coisas (stake, jogam, negociam, postam)
    ↓
Taxas ETH geradas
    ↓
Buyback Miner converte ETH → compra BKC + minta novos BKC
    ↓
5% do BKC queimado (deflacionario)
    ↓
95% enviado pro Staking Pool como recompensas
    ↓
Delegadores clamam recompensas (ate 50% queimado sem NFT Booster)
    ↓
Mais usuarios atraidos pelas recompensas → mais atividade → mais taxas
```

O loop se auto-reforca. Mais usuarios significa mais taxas, mais buybacks, mais recompensas, e mais tokens queimados. Todo mundo que participa — usuarios, delegadores, operadores, provedores de liquidez — se beneficia do crescimento.

---

## Economia do Operador

Operadores (builders de frontend) ganham uma porcentagem das taxas ETH em cada transacao dos seus usuarios. Isso e automatico e nao precisa de aprovacao:

1. Construa seu proprio frontend Backcoin
2. Passe sua carteira como parametro "operator" nas transacoes
3. Ganhe comissoes em cada acao dos usuarios

O sistema de operadores significa que o Backcoin pode crescer sem marketing centralizado. Builders sao incentivados a trazer usuarios porque lucram diretamente com isso.

Veja o [Guia do Operador](./Operators_Build-and-Earn.md) pra detalhes.

---

## Enderecos Principais

| Contrato | Endereco |
|----------|---------|
| BKC Token | 0x1c8B7951ae769871470e9a8951d01dB39AA34123 |
| Ecosystem | 0xDC88493D0979AF22e2C387A2fFd5230c62551997 |
| Staking Pool | 0xeA5D34520783564a736258a9fd29775c9c1C8E78 |
| Buyback Miner | 0xD0B684Be70213dFbdeFaecaFECB50232897EC843 |
| Liquidity Pool | 0x32c80323dD73E2d30c0389Ea9fc6a0ad998770bF |

Veja tambem: [Token BKC](./BKC-Token_Ecosystem-Fuel.md) | [Mineracao](./Mining_From-Fees-to-Rewards.md) | [Staking](./Staking_Lock-and-Earn.md) | [Taxas](./Fees_Complete-Table.md)
