# Mineracao — De Taxas a Recompensas

O Buyback Miner e o coracao economico do Backcoin. Ele faz tres coisas ao mesmo tempo: compra BKC do mercado (pressao de alta), minta novos BKC como recompensa (incentivo), e queima uma parte (deflacao). Tudo automatico, sem permissao, e qualquer pessoa pode acionar — e ganhar por fazer isso.

> **Contrato:** `0x47B9F6F8517542eb93130af4B04834E7da279Bcd`

---

## O Ciclo em 7 Passos

```
1. Usuarios usam o Backcoin (staking, jogos, NFTs, posts...)
       ↓
2. Taxas ETH acumulam no contrato do ecossistema
       ↓
3. Qualquer pessoa chama executeBuyback()
       ↓
4. Quem chamou ganha 5% do ETH como incentivo
       ↓
5. Os 95% restantes compram BKC do Pool de Liquidez
       ↓
6. Novos BKC sao mintados baseado na curva de escassez
       ↓
7. 5% do BKC total e queimado | 95% vai como recompensas
```

Nao tem agenda. Nao tem admin. Nao tem whitelist. Se tem ETH acumulado, **qualquer pessoa** pode acionar o ciclo e ficar com 5% do valor. O restante vira recompensas pros delegadores.

---

## A Curva de Escassez: Por Que Entrar Cedo Importa

A quantidade de novos BKC mintados por ciclo diminui conforme o supply cresce. Isso e intencional — cria escassez natural e recompensa participantes que entram cedo.

```
Taxa de Mineracao = (200M - Supply Atual) / 160M

Supply 40M  → 100% — Cada 1 BKC comprado = 1 BKC mintado extra
Supply 80M  →  75%
Supply 120M →  50% — Mineracao cai pela metade
Supply 160M →  25%
Supply 200M →   0% — Teto alcancado, yield real puro
```

**O ponto crucial:** recompensas **nunca param**. Quando o teto de 200M e alcancado, nenhum BKC novo e mintado — mas os buybacks continuam. Delegadores ainda ganham com BKC comprado do pool de liquidez. Apenas o bonus de mineracao vai a zero.

Isso significa que staking no Backcoin gera **yield real** baseado em atividade real do protocolo, nao em impressao inflacionaria.

---

## Os Tres Efeitos Simultaneos

Cada ciclo de buyback cria tres forcas que trabalham juntas:

| Efeito | O Que Acontece | Por Que Importa |
|--------|---------------|-----------------|
| **Pressao de compra** | ETH compra BKC do pool de liquidez | Demanda constante no mercado |
| **Burn permanente** | 5% de todo BKC (comprado + mintado) e destruido | Supply circulante encolhe |
| **Recompensas** | 95% vai pros delegadores como yield | Incentivo real pra participar |

Nao e inflacao disfaracada de recompensa. E um mecanismo que converte **atividade real** (taxas ETH) em **valor real** (BKC) pra quem participa.

---

## O Incentivo de 5%: Uma Oportunidade Aberta

Qualquer pessoa pode chamar `executeBuyback()` e levar 5% do ETH acumulado. Sem whitelist. Sem permissao. Sem fila.

Na pratica, isso cria um mercado competitivo saudavel:
- **Bots** monitoram o ETH acumulado e acionam quando o lucro justifica o gas
- **Usuarios atentos** podem acionar manualmente quando o acumulo esta alto
- **O resultado:** o ciclo roda sozinho, sem nenhum operador centralizado

Se voce montar um bot que detecta quando o ETH acumulado esta suficientemente alto, voce tem uma fonte de renda automatica que funciona 24/7.

---

## Os Numeros

| Parametro | Valor |
|-----------|-------|
| Maximo Mintavel | 160.000.000 BKC |
| Incentivo pro Caller | 5% do ETH acumulado |
| Burn por Ciclo | 5% do total de BKC (comprado + mintado) |
| Recompensas por Ciclo | 95% do total de BKC |
| Supply Minimo | 40.000.000 BKC (lancamento) |
| Supply Maximo | 200.000.000 BKC |

---

## Pra Operadores: Efeito Cascata

O Buyback Miner transforma atividade dos seus usuarios em valor pro ecossistema inteiro:

```
Seus usuarios usam seu frontend
    → Geram taxas ETH
    → ETH alimenta o Buyback Miner
    → Miner gera recompensas
    → Recompensas atraem mais delegadores
    → Mais usuarios descobrem o Backcoin
    → Mais gente usa seu frontend
```

Mais usuarios na sua plataforma nao so geram comissoes diretas — tambem alimentam o motor economico que atrai mais usuarios pro ecossistema todo.

---

Continue: [Economia](./Economy_How-It-Works.md) | [Staking](./Staking_Lock-and-Earn.md) | [Taxas](./Fees_Complete-Table.md)
