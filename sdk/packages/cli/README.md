# @backchain/cli (create-backchain-app)

CLI scaffold tool for bootstrapping a Backchain DeFi frontend.

## Install

No installation needed. Use directly via npx:

```bash
npx create-backchain-app my-app
```

## Status

Under development. Not yet published to npm.

## Planned Usage

```bash
npx create-backchain-app my-app
cd my-app
npm install
npm run dev
```

## Planned Features

- Scaffold a complete Backchain DeFi frontend project
- Pre-configured with `@backchain/core`, `@backchain/swap`, `@backchain/staking`, and other modules
- Includes wallet connection, contract address loading, and transaction engine wiring
- Targets opBNB Mainnet by default, with optional Sepolia testnet mode
- Vanilla JS output (no framework dependency) matching the reference Backchain DApp architecture

## API

This package will be invoked as a CLI tool, not imported as a library. No programmatic API is planned.

### CLI Options (planned)

| Flag | Description |
|---|---|
| `--template <name>` | Starter template to use (default: `vanilla`) |
| `--testnet` | Pre-configure for Sepolia testnet instead of opBNB Mainnet |
| `--skip-install` | Scaffold files without running `npm install` |

## License

MIT
