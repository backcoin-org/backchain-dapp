# Agora — Decentralized Social Network

A censorship-resistant social protocol where your content lives on-chain forever. No central authority can delete your posts, ban your account, or silence your voice.

**Contract:** `0x60088001DB6Ae83Bc9513426e415895802DBA39a`

## What Is Agora?

Agora is a fully on-chain social network built into Backcoin. Every post, reply, like, and follow is a blockchain transaction. This means:

- **Nobody can censor you** — No admin can delete your content
- **Your data is yours** — Posts live on Arbitrum, not someone's server
- **You earn from engagement** — SuperLikes send ETH directly to authors
- **Operators earn** — Build a social frontend and collect commissions

## Features

### Content
- **Posts** with 15 predefined categories (tags)
- **Replies** with threading (conversation chains)
- **Reposts** with optional quotes
- **Media support** — Text, image, video, and live stream types
- **Pin** one post to your profile
- **Soft delete** — Mark content as deleted (blockchain record stays)

### Engagement
- **Like** — Free, one per user per post
- **SuperLike** — 100 gwei each (unlimited), ETH goes to the post author
- **Downvote** — 100 gwei each (unlimited), ETH goes to the ecosystem (not the author)
- **Community Score** = SuperLikes - Downvotes

SuperLikes are important: they're a direct financial reward to content creators. Good content literally earns ETH.

### Identity
- **Username registration** — Claim your handle (price varies by length)
- **Profile metadata** — Avatar, bio, links via IPFS
- **Trust badge** — Premium verification marker
- **Profile boost** — Increase your visibility
- **Follow/Unfollow** — Build your audience

### Networks
Posts are tagged with one of 15 categories, acting as virtual networks. Operators can build specialized frontends around specific categories — a sports Agora, a tech Agora, a local news Agora — all reading from the same contract.

## How Users Earn

1. **Content creators** receive ETH from SuperLikes
2. **Engaged users** build reputation through community scoring
3. **Operators** earn commissions on posts, SuperLikes, and username registrations

The more valuable your content, the more SuperLikes you attract, and the more ETH you earn. No algorithms deciding who sees what — just direct value exchange between creators and their audience.

## Fees

- **Post creation** — ETH fee (varies by media type: text is cheapest, video costs more)
- **Replies** — ETH fee
- **SuperLike** — 100 gwei per like (goes to author)
- **Downvote** — 100 gwei per vote (goes to ecosystem)
- **Username** — Length-based pricing (shorter = more expensive)
- **Likes, follows** — Free

All ETH fees support the ecosystem: operators, referrers, treasury, and buyback.

## Why It Matters

Traditional social media is controlled by corporations. They decide what you see, who gets banned, and what content is allowed. Agora is different — it's a protocol, not a platform. The rules are in the smart contract, visible to everyone, and nobody can change them after deployment.

This contributes to Arbitrum's vision of a decentralized internet. Every Agora post is a transaction that strengthens the network.

## Operator Opportunity

Building a social frontend on Agora is one of the biggest operator opportunities:
- Social apps have daily active users (recurring commissions)
- You can specialize by category (build the best crypto news app, or sports, or local content)
- All data comes from the same contract — interoperability is built in
- Users created through your app continue to generate commissions

See also: [Fee Schedule](./FEES.md) | [Operator Guide](./BE_YOUR_OWN_CEO.md)
