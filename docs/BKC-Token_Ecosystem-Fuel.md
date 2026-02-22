# Token BKC — O Combustivel do Ecossistema

Tudo no Backcoin gira em torno do BKC. Staking, jogos, trading de NFTs, rede social, certificacao de documentos — cada servico usa BKC de alguma forma. Mas diferente da maioria dos tokens DeFi, o BKC foi desenhado pra ficar **mais escasso** com o tempo, nao mais inflacionado.

> **Endereco do contrato:** `0x080627Bd394e0F34535B0F3c70090D181f87d913`

---

## Numeros que Importam

| Propriedade | Valor |
|-------------|-------|
| Nome | Backcoin |
| Simbolo | BKC |
| Decimais | 18 |
| Supply Maximo | **200.000.000 BKC** — teto fixo, impossivel de aumentar |
| Padrao | ERC-20 + EIP-2612 Permit |
| Alocacao pro time | **0%** |
| Alocacao pra VCs | **0%** |

Voce leu certo. Zero tokens pro time. Zero pra investidores privados. 80% de todo o supply vai direto pra usuarios ativos atraves de recompensas de mineracao.

---

## Distribuicao: Sem Privilegios

O supply e dividido em duas partes simples:

**40M BKC (20%)** — Mintados no lancamento
- Liquidez inicial no pool ETH/BKC
- Faucet pra novos usuarios
- Crescimento do ecossistema

**160M BKC (80%)** — Liberados gradualmente pelo Buyback Miner
- So sao criados quando taxas reais do protocolo justificam
- Vao direto pra quem participa ativamente (delegadores)
- A taxa de mineracao **diminui** com o tempo (curva de escassez)

Nenhum insider, nenhum VC, nenhum advisor recebeu tokens. O time ganha da mesma forma que qualquer outro usuario — participando.

---

## O Que Torna o BKC Diferente

**Teto fixo, de verdade.** O limite de 200M esta codificado no smart contract. Nenhuma funcao de mint, nenhuma votacao de governanca, nenhum multisig pode aumentar. O supply maximo e 200M hoje, amanha e daqui a 100 anos.

**Mint por atividade, nao por cronograma.** Novos BKC so entram em circulacao quando o Buyback Miner converte taxas reais do protocolo em recompensas. Sem uso, sem mint. Quanto mais gente usa o Backcoin, mais BKC entra — mas sempre dentro do teto.

**Multiplos mecanismos de burn.** Enquanto o supply cresce com a mineracao, multiplas forcas trabalham contra:
- Burn no claim de staking — ate 50% sem NFT Booster
- Burn no Buyback Miner — 5% por ciclo
- Fortune Pool — taxa de 20% BKC inclui burn
- Burn voluntario — qualquer pessoa pode queimar seus tokens

O resultado? Conforme o ecossistema amadurece, mais BKC e queimado do que mintado. O supply circulante **encolhe**.

**Aprovacoes sem gas.** BKC suporta EIP-2612 Permit — usuarios podem aprovar gasto de tokens assinando uma mensagem, sem transacao separada. Economiza gas e melhora a experiencia.

**Sem backdoors.** Uma vez deployado, ninguem pode pausar o token, criar blacklist, ou restringir transferencias. Funciona igual pra todo mundo. Pra sempre.

---

## De Onde Vem Cada BKC

O ciclo de criacao e elegante:

```
1. Usuarios interagem com o Backcoin (staking, jogos, trading...)
       ↓
2. Cada interacao gera taxas em ETH
       ↓
3. ETH acumula no contrato do ecossistema
       ↓
4. Qualquer pessoa aciona o Buyback Miner (e ganha 5% por fazer isso)
       ↓
5. O Miner compra BKC do pool de liquidez + minta novos BKC
       ↓
6. Recompensas vao pros delegadores
```

A **curva de escassez** e a peca chave: quando o supply e baixo, a mineracao e generosa. Conforme se aproxima de 200M, o mint desacelera e eventualmente para. Depois disso, recompensas vem puramente de buybacks — yield real de atividade real.

---

## Onde o BKC e Usado

| Servico | Como o BKC e Usado |
|---------|-------------------|
| **Staking** | Trave BKC pra ganhar recompensas de mineracao |
| **Fortune Pool** | Aposte BKC (20% taxa, 80% vai pro prize pool) |
| **NFT Pools** | Compre e venda Booster NFTs com BKC |
| **Agora** | Pague taxas BKC por funcoes sociais |
| **Cartorio** | Pague taxas BKC por certificacoes |
| **Governanca** | Participe de votacoes (futuro) |

---

## Pra Desenvolvedores

Adicionar BKC ao MetaMask programaticamente:

```javascript
const BKC = {
    address: "0x080627Bd394e0F34535B0F3c70090D181f87d913",
    symbol: "BKC",
    decimals: 18,
    image: "https://backcoin.org/assets/bkc_logo.png"
};

await ethereum.request({
    method: 'wallet_watchAsset',
    params: { type: 'ERC20', options: BKC }
});
```

---

Proximo passo: Entenda como o valor flui no ecossistema → [Economia](./Economy_How-It-Works.md) | [Mineracao](./Mining_From-Fees-to-Rewards.md) | [Staking](./Staking_Lock-and-Earn.md)
