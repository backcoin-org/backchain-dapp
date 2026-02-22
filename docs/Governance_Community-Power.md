# Governanca — Do Admin ao DAO, Sem Volta

O Backcoin segue um modelo de **descentralizacao progressiva**. Comeca com um admin pra iterar rapido, e gradualmente transfere controle total pra comunidade em quatro fases. Cada transicao e **irreversivel** — uma vez que o poder e distribuido, nunca pode ser recentralizado.

> **Contrato:** `0x28244003181711f09f9573BAf0E26F879A278227`

---

## As Quatro Fases

Cada fase e uma transicao de mao unica. O poder so flui numa direcao: do centro pra comunidade.

### Fase 1: Admin (Atual)
- Uma carteira admin controla parametros do ecossistema
- Mudancas executam instantaneamente
- Necessario pra iteracao rapida durante testnet e mainnet inicial

### Fase 2: Multisig
- Controle transferido pra um Gnosis Safe (carteira multi-assinatura)
- Multiplos signatarios precisam concordar em qualquer mudanca
- Nenhuma pessoa sozinha pode agir unilateralmente

### Fase 3: Timelock
- Todas as mudancas sao **enfileiradas com atraso** (1 hora a 30 dias)
- Qualquer pessoa pode inspecionar mudancas pendentes antes de executarem
- Periodo de graca de 7 dias — se nao executada a tempo, expira
- A comunidade tem tempo real pra reagir a qualquer proposta

### Fase 4: DAO
- Membros da comunidade **propoem e votam** em mudancas
- Propostas aprovadas executam pelo timelock
- Controle total da comunidade sobre parametros
- O time original nao tem nenhum privilegio especial

> **A garantia:** Cada transicao e gravada na blockchain e **impossivel de reverter**. Uma vez na Fase 4, ninguem — nem o time original — pode voltar atras.

---

## O Que Governanca Pode Mudar

Governanca controla **apenas** os parametros do contrato BackchainEcosystem:

| Parametro | Exemplo |
|-----------|---------|
| Valores e multiplicadores de taxas | Ajustar custo de cada acao |
| Divisao de taxas ETH | Proporcao entre operador, referenciador, tesouro, buyback |
| Divisao de taxas BKC | Proporcao entre burn, delegadores, tesouro |
| Enderecos de tesouro e buyback | Alterar destino de fundos |

---

## O Que Governanca NAO Pode Mudar

E aqui esta o mais importante. **Todos os outros contratos sao imutaveis.** Governanca nao tem poder pra:

| Acao Impossivel | Por Que |
|----------------|---------|
| Pausar ou congelar qualquer contrato | Nao existe funcao de pause |
| Mudar supply do BKC ou regras de mint | Codificado no token |
| Modificar mecanica do Staking Pool | Contrato imutavel |
| Alterar probabilidades do Fortune Pool | Codificado no contrato |
| Mudar taxas de burn dos NFT Boosters | Codificado no contrato |
| Modificar taxa de swap do Pool de Liquidez | Codificado no contrato |
| Blacklist ou congelar tokens de usuarios | Nao existe funcao |
| Fazer upgrade de qualquer contrato | Nao sao upgradeable |

Isso e por design. O protocolo central e **imparavel**. Governanca ajusta parametros economicos, nao as regras do jogo.

---

## Limites de Seguranca (Mesmo com DAO)

Mesmo com controle total da comunidade, existem limites **codificados no contrato** que ninguem pode ultrapassar:

| Limite | Valor |
|--------|-------|
| Taxa ETH maxima | 50% (5.000 basis points) |
| Multiplicador de gas maximo | 2.000.000x |
| Estimativa de gas maxima | 30.000.000 |

Esses limites sao hardcoded. Nem governanca, nem admin, nem nenhum exploit pode exceder.

---

## Por Que Progressiva (E Nao Dia Um)?

DAO desde o dia um soa otimo em teoria. Na pratica, e uma receita pra problemas:

| Realidade | Por Que Descentralizacao Gradual Funciona Melhor |
|-----------|-----------------------------------------------|
| Iteracao rapida | Protocolos novos precisam ajustar parametros constantemente |
| Distribuicao de tokens | Leva tempo pra tokens estarem bem distribuidos pra votacao justa |
| Testes | Parametros precisam de calibragem antes de travar |
| Seguranca | Governanca imatura pode ser explorada por whales |

Comecando centralizado e descentralizando **de forma irreversivel**, o Backcoin captura o melhor dos dois mundos: agilidade quando o protocolo e jovem, e controle total da comunidade quando o sistema esta maduro.

---

## Cronograma

Nao tem data fixa pra cada transicao. Cada avanco acontece quando a comunidade e o ecossistema estao prontos. O que **e** garantido e que cada transicao so vai numa direcao — uma vez que o controle e distribuido, ele nunca volta.

---

Continue: [Economia](./Economy_How-It-Works.md) | [Enderecos](./Addresses_All-Contracts.md)
