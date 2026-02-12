# Token BKC — O Combustivel do Ecossistema

BKC e o token nativo do Backcoin. Ele movimenta staking, jogos, trading, rede social e governanca em todos os servicos do protocolo.

Contrato: 0x1c8B7951ae769871470e9a8951d01dB39AA34123

---

## Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Nome | Backcoin |
| Simbolo | BKC |
| Decimais | 18 |
| Supply Maximo | 200.000.000 BKC (teto fixo, pra sempre) |
| Padrao | ERC-20 + EIP-2612 Permit |

---

## Distribuicao

O supply e dividido em duas partes:

- 40M BKC (20%) — Mintados no lancamento pra liquidez inicial, crescimento do ecossistema e faucet
- 160M BKC (80%) — Liberados gradualmente pelo Buyback Miner como recompensas de atividade

Zero alocacao pra time, advisors, VCs ou investidores privados. Cada token BKC ou foi pra liquidez ou vai direto pra usuarios ativos.

---

## Caracteristicas Principais

Teto fixo. O limite de 200M esta codificado no contrato e nao pode ser alterado. Nenhuma inflacao, nenhum mint surpresa, nenhuma votacao de governanca pode aumentar. Nunca.

Mint por atividade. Novos BKC so sao criados quando o Buyback Miner converte taxas do protocolo em recompensas. Quanto mais gente usa o Backcoin, mais BKC entra em circulacao — mas sempre dentro do teto de 200M.

Pressao deflacionaria. Multiplos mecanismos de burn reduzem o supply circulante com o tempo:
- Burn no claim de staking (ate 50% sem NFT boost)
- Buyback Miner queima 5% por ciclo
- Taxas BKC do Fortune Pool incluem componente de burn
- Qualquer pessoa pode queimar seus proprios tokens voluntariamente

Aprovacoes sem gas. BKC suporta EIP-2612 Permit, entao usuarios podem aprovar gasto de tokens sem transacao separada. Isso economiza gas e melhora a experiencia.

Sem backdoors. Uma vez deployado, o contrato do token nao tem funcao de pausa, nao tem blacklist, nao tem restricao de transferencia. Funciona igual pra todo mundo, pra sempre.

---

## Como o BKC e Criado

1. Usuarios interagem com os servicos Backcoin (staking, jogos, trading, etc.)
2. Cada interacao gera taxas em ETH
3. ETH acumula no contrato do ecossistema
4. Qualquer pessoa pode acionar o Buyback Miner (e ganhar 5% por fazer isso)
5. O Miner compra BKC do pool de liquidez e minta novos BKC baseado na escassez
6. Recompensas vao para os delegadores

A taxa de mineracao diminui conforme o supply cresce — essa e a curva de escassez. Quando o supply e baixo, a mineracao e generosa. Conforme se aproxima do teto, o mint desacelera e eventualmente para. Depois disso, recompensas vem puramente de buybacks (yield real).

---

## Onde o BKC e Usado

| Servico | Uso do BKC |
|---------|-----------|
| Staking | Trava BKC pra ganhar recompensas |
| Fortune Pool | Aposta BKC (20% taxa, 80% pro prize pool) |
| NFT Pools | Compra/vende Booster NFTs com BKC |
| Agora | Paga taxas BKC por funcoes sociais |
| Notary | Paga taxas BKC por certificacoes |

---

## Para Desenvolvedores

```javascript
// Adicionar BKC ao MetaMask
const BKC = {
    address: "0x1c8B7951ae769871470e9a8951d01dB39AA34123",
    symbol: "BKC",
    decimals: 18,
    image: "https://backcoin.org/assets/bkc_logo.png"
};
```

Veja tambem: [Economia](./Economy_How-It-Works.md) | [Mineracao](./Mining_From-Fees-to-Rewards.md) | [Staking](./Staking_Lock-and-Earn.md)
