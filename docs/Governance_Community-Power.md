# Governanca — O Poder Vai pra Comunidade

Backcoin segue um modelo de descentralizacao progressiva. O sistema comeca com um admin pra iteracao rapida, e gradualmente transfere controle pra comunidade em etapas irreversiveis.

Contrato: 0xA82F69f079566958c16F601A9625E40AeEeFbFf8

---

## As Quatro Fases

Cada fase e uma transicao de mao unica. Uma vez que avanca, nao tem volta.

Fase 1: Admin (Atual)
- Uma carteira admin controla parametros do ecossistema
- Mudancas executam instantaneamente
- Permite iteracao rapida durante testnet e mainnet inicial

Fase 2: Multisig
- Admin transfere controle pra um Gnosis Safe (carteira multi-assinatura)
- Multiplos signatarios precisam concordar em qualquer mudanca
- Execucao ainda instantanea, mas nenhuma pessoa sozinha pode agir

Fase 3: Timelock
- Todas as mudancas precisam ser enfileiradas com atraso (1 hora a 30 dias)
- Qualquer pessoa pode inspecionar mudancas pendentes antes de executarem
- Periodo de graca de 7 dias — se uma mudanca nao e executada a tempo, expira
- Comunidade tem tempo pra reagir a qualquer proposta de mudanca

Fase 4: DAO
- Membros da comunidade propoem e votam em mudancas
- Propostas executam pelo timelock
- Controle total da comunidade sobre parametros do ecossistema
- O time original nao tem privilegios especiais

---

## O Que Governanca Pode Mudar

Governanca controla apenas parametros do contrato BackchainEcosystem:
- Valores e multiplicadores de taxas
- Divisao de distribuicao de taxas (operador, referenciador, tesouro, buyback)
- Parametros de distribuicao BKC (burn, delegadores, tesouro)
- Enderecos de tesouro e buyback

---

## O Que Governanca Nao Pode Mudar

Todos os outros contratos sao imutaveis. Governanca nao pode:
- Pausar ou congelar nenhum contrato
- Mudar o supply do token BKC ou regras de mint
- Modificar a mecanica do Staking Pool
- Alterar tiers ou probabilidades do Fortune Pool
- Mudar taxas de burn dos NFT Boosters
- Modificar a taxa de swap do Pool de Liquidez
- Criar blacklist ou congelar tokens de nenhum usuario
- Fazer upgrade ou substituir nenhum contrato deployado

Isso e por design. O protocolo central e imparavel — governanca so ajusta parametros economicos.

---

## Limites de Seguranca

Mesmo com controle total da DAO, o ecossistema impoe limites codificados:
- Taxa ETH maxima: 50% (nao pode cobrar mais)
- Multiplicador de gas maximo: 2.000.000x
- Estimativa de gas maxima: 30.000.000

Esses limites estao no codigo do contrato e nao podem ser mudados por governanca ou nenhum admin.

---

## Por Que Progressiva?

Governanca DAO desde o dia um soa otimo na teoria, mas na pratica:
- Protocolos em estagio inicial precisam iterar rapido
- Distribuicao de tokens precisa de tempo pra ficar ampla o suficiente pra votacao justa
- Parametros de smart contracts precisam de testes antes de travar

Comecando centralizado e descentralizando progressivamente, o Backcoin pega o melhor dos dois mundos: agilidade quando necessario, e controle total da comunidade quando o sistema esta maduro.

---

## Cronograma

Nao tem cronograma fixo pra transicoes de fase. Cada avanco acontece quando a comunidade e o ecossistema estao prontos. A garantia chave e que cada transicao e irreversivel — uma vez que o controle e distribuido, nunca pode ser recentralizado.

Veja tambem: [Economia](./Economy_How-It-Works.md) | [Enderecos](./Addresses_All-Contracts.md)
