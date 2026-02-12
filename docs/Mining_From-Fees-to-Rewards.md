# Mineracao — De Taxas a Recompensas

O Buyback Miner e o motor economico do Backcoin. Ele converte taxas do protocolo em recompensas de staking, cria pressao de compra no BKC, e reduz supply com burns. Tudo automatico e sem permissao.

Contrato: 0xD0B684Be70213dFbdeFaecaFECB50232897EC843

---

## Como Funciona

1. Usuarios interagem com os servicos Backcoin → taxas ETH acumulam no ecossistema
2. Qualquer pessoa pode chamar executeBuyback() pra iniciar um ciclo de mineracao
3. Quem chama ganha 5% do ETH como incentivo (sem whitelist, sem permissao)
4. Os 95% restantes compram BKC do Pool de Liquidez
5. Novos BKC sao mintados baseado na curva de escassez
6. 5% do total de BKC (comprado + mintado) e queimado permanentemente
7. 95% vai pro Staking Pool como recompensas pros delegadores

Esse ciclo roda toda vez que alguem aciona. Nao tem agenda, nao tem admin, nao tem gatekeeper. Se tem ETH pra converter, qualquer pessoa pode fazer e ganhar o incentivo de 5%.

---

## Curva de Escassez

A quantidade de novos BKC mintados por ciclo diminui conforme o supply cresce:

```
Taxa de Mineracao = (200M - Supply Atual) / 160M

Inicio (supply 40M):   100% — 1 BKC comprado = 1 BKC mintado
Meio (supply 120M):     50% — 1 BKC comprado = 0.5 BKC mintado
Fim (supply 180M):    12.5% — 1 BKC comprado = 0.125 BKC mintado
Teto (supply 200M):      0% — sem novo mint, yield real puro
```

Isso e importante: recompensas nunca param. Quando o teto de 200M e alcancado, delegadores ainda ganham com a parte de buyback (BKC comprado do pool). Apenas o bonus de mineracao vai a zero.

---

## Por Que Isso Importa

O Buyback Miner cria tres forcas poderosas:

1. Pressao de compra constante — Taxas do protocolo compram BKC do mercado continuamente
2. Reducao de supply — 5% de burn por ciclo remove BKC de circulacao permanentemente
3. Recompensas pros delegadores — Participantes ativos ganham yield real baseado em uso real do protocolo

Isso nao e impressao inflacionaria. Novos BKC so sao mintados quando taxas do protocolo justificam, e a taxa diminui com o tempo. Eventualmente, todas as recompensas vem de buybacks.

---

## O Incentivo de 5% pro Caller

Qualquer pessoa pode chamar executeBuyback() e ganhar 5% do ETH acumulado. Isso e intencional — transforma o buyback numa oportunidade sem permissao que mantem o sistema rodando sem nenhum operador centralizado.

Na pratica, bots e usuarios ativos competem pra acionar buybacks quando o ETH acumulado e grande o suficiente pra justificar o custo de gas. Isso e saudavel — significa que o ciclo de mineracao roda sozinho.

---

## Numeros

| Parametro | Valor |
|-----------|-------|
| Maximo Mintavel | 160.000.000 BKC |
| Incentivo pro Caller | 5% do ETH |
| Burn por Ciclo | 5% do total de BKC (comprado + mintado) |
| Recompensas por Ciclo | 95% do total de BKC |
| Supply Minimo pra Mineracao | 40.000.000 BKC (TGE) |
| Supply Maximo | 200.000.000 BKC |

---

## Pra Operadores

O ciclo de buyback em si suporta operadores. Quando voce constroi um frontend, a atividade dos seus usuarios gera taxas que alimentam o miner. Mais usuarios na sua plataforma significa mais ETH acumulado, mais buybacks, e mais recompensas pra todo mundo no ecossistema.

Veja tambem: [Economia](./Economy_How-It-Works.md) | [Staking](./Staking_Lock-and-Earn.md)
