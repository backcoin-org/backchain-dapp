# Economia do Backcoin — Como Tudo Funciona

O Backcoin nao e um token com um whitepaper bonito e promessas vagas. E um sistema economico completo onde cada peca se encaixa — taxas geram buybacks, buybacks geram recompensas, recompensas atraem mais usuarios, mais usuarios geram mais taxas. Um ciclo que se auto-reforca.

Este documento explica cada engrenagem.

---

## O Supply: 200 Milhoes, Ponto Final

| Metrica | Valor |
|---------|-------|
| Supply Maximo | **200.000.000 BKC** |
| Inicial (lancamento) | 40.000.000 BKC (20%) |
| Recompensas de Atividade | 160.000.000 BKC (80%) |
| Alocacao pro Time | **0%** |
| Alocacao pra VCs | **0%** |

**Por que zero pro time?** Porque o Backcoin foi desenhado pra ser genuinamente sem permissao. O time ganha da mesma forma que qualquer outro participante — como operador, como delegador, como referenciador. Sem privilegios especiais, sem tokens pre-alocados, sem cliff schedule.

---

## Os 40M Iniciais — Pra Que Servem

Os primeiros 40M BKC existem pra tornar a plataforma **usavel desde o dia um**:

- **Liquidity Pool** — Semente do par ETH/BKC pra que swaps funcionem imediatamente
- **Faucet** — BKC gratis pra novos usuarios comecarem sem investir
- **Crescimento** — Campanhas comunitarias, airdrops, parcerias

Nenhum token e "travado" pra insiders. Nenhum vesting schedule escondido. Tudo vai direto pra infraestrutura que beneficia usuarios.

---

## Os 160M de Recompensas — Mineracao por Atividade

Os 160M BKC restantes sao liberados pelo **Buyback Miner** baseado em uso real:

```
Usuarios fazem staking, jogam, negociam, postam...
    ↓
Taxas ETH acumulam no ecossistema
    ↓
Buyback Miner converte ETH → compra BKC + minta novos BKC
    ↓
Recompensas vao pros delegadores
```

**A Curva de Escassez** e o que torna isso sustentavel:

```
Taxa de Mineracao = (200M - Supply Atual) / 160M

Supply 40M   → Mineracao a 100%    (recompensas maximas)
Supply 80M   → Mineracao a 75%
Supply 120M  → Mineracao a 50%
Supply 160M  → Mineracao a 25%
Supply 200M  → Mineracao a 0%      (teto alcancado)
```

Quem entra cedo se beneficia de taxas de mineracao mais altas. Mas — e isso e crucial — **recompensas nunca param**. Quando o teto e alcancado, delegadores continuam ganhando com buybacks (ETH real convertido em BKC do pool de liquidez).

A diferenca e que nao ha mais mint de novos tokens. So redistribuicao dos existentes.

---

## Taxas: O Combustivel de Tudo

Cada acao no Backcoin gera dois tipos de taxa:

**Taxas ETH** (baseadas em gas da rede):
```
Usuario paga taxa ETH
    → Operador (comissao do builder)
    → Referenciador (quem trouxe o usuario)
    → Tesouro (fundos do protocolo)
    → Buyback (alimenta o ciclo de mineracao)
```

**Taxas BKC** (porcentagem do valor envolvido):
```
Usuario paga taxa BKC
    → Burn (removido pra sempre)
    → Staking Pool (recompensas pros delegadores)
    → Tesouro (fundos do protocolo)
```

Cada centavo de taxa tem um destino claro. Nada desaparece — tudo circula pelo ecossistema.

> Tabela detalhada por servico: [Taxas Completas](./Fees_Complete-Table.md)

---

## As Forcas que Reduzem o Supply

Enquanto a mineracao adiciona BKC ao mercado, cinco mecanismos trabalham na direcao oposta:

| Mecanismo | Como Funciona | Impacto |
|-----------|---------------|---------|
| **Burn no Staking** | Ate 50% das recompensas queimadas no claim | O maior queimador do sistema |
| **Burn no Buyback** | 5% de cada ciclo de mineracao | Constante e previsivel |
| **Fortune Pool** | Taxa de 20% BKC inclui burn | Proporcional a atividade de jogos |
| **Force Unstake** | 10% de penalidade queimada | Queima sob demanda |
| **Burn Voluntario** | Qualquer pessoa pode queimar seus tokens | Imprevisivel, mas existe |

Conforme o ecossistema cresce, essas forcas deflacionarias se intensificam. Mais atividade = mais burn. O supply circulante tende a **encolher** com o tempo, tornando cada BKC restante mais escasso.

---

## O Ciclo Completo: Como Tudo se Conecta

```
Usuarios fazem coisas (stake, jogam, negociam, postam)
         ↓
    Taxas ETH geradas
         ↓
    Buyback Miner converte ETH → compra BKC + minta novos
         ↓
    5% queimado (deflacao) | 95% → recompensas
         ↓
    Delegadores clamam (ate 50% queimado sem NFT Booster)
         ↓
    Mais usuarios atraidos → mais atividade → mais taxas
         ↓
    [volta pro inicio]
```

E um **flywheel**: mais usuarios geram mais taxas, mais taxas geram mais buybacks, mais buybacks geram mais recompensas, mais recompensas atraem mais usuarios. Cada participante — usuario, delegador, operador, provedor de liquidez — se beneficia do crescimento do todo.

---

## Economia do Operador: Sem Marketing Centralizado

Operadores (builders de frontend) ganham comissoes em cada transacao dos seus usuarios. Isso resolve um problema que a maioria dos protocolos tem: **como crescer sem gastar em marketing?**

A resposta: transforme marketing em oportunidade de negocio. Builders sao incentivados a trazer usuarios porque **lucram diretamente** com cada transacao. O protocolo cresce organicamente, sem budget de marketing, sem equipe de growth.

```
1. Construa seu frontend Backcoin
2. Passe sua carteira como parametro "operator"
3. Ganhe comissao em cada acao dos seus usuarios
```

Sem aprovacao. Sem limite de operadores. Sem exclusividade.

> Guia completo: [Operadores — Construa e Ganhe](./Operators_Build-and-Earn.md)

---

## Enderecos dos Contratos Core

| Contrato | Endereco |
|----------|---------|
| BKC Token | `0x1c8B7951ae769871470e9a8951d01dB39AA34123` |
| Ecosystem | `0xDC88493D0979AF22e2C387A2fFd5230c62551997` |
| Staking Pool | `0xeA5D34520783564a736258a9fd29775c9c1C8E78` |
| Buyback Miner | `0xD0B684Be70213dFbdeFaecaFECB50232897EC843` |
| Liquidity Pool | `0x32c80323dD73E2d30c0389Ea9fc6a0ad998770bF` |

---

Continue explorando: [Token BKC](./BKC-Token_Ecosystem-Fuel.md) | [Mineracao](./Mining_From-Fees-to-Rewards.md) | [Staking](./Staking_Lock-and-Earn.md) | [Taxas](./Fees_Complete-Table.md)
