# @backchain/agora

Agora module for the Backchain DeFi ecosystem on opBNB. On-chain social protocol for posts, replies, reposts, follows, tips, and more.

## Install

```bash
npm install @backchain/agora
```

## Quick Start

```js
import { AgoraModule } from '@backchain/agora';

const agora = new AgoraModule(context); // context from @backchain/core
await agora.createProfile('alice', 'ipfs://Qm...');
const postId = await agora.createPost('Hello Backchain!', 'general', 0);
await agora.like(postId);
```

## API

### Write Methods

**`createProfile(username: string, metadataURI: string): Promise<TransactionResult>`**
Register an on-chain profile. `username` must be unique across the protocol. `metadataURI` is an IPFS or Firebase URL pointing to a JSON object with the shape `{ avatar, banner, bio, links, location }`. Calling again updates the profile.

**`createPost(content: string, tag: string, contentType: number): Promise<TransactionResult>`**
Publish a new root post. `content` is stored on-chain (keep it short; use a URI for long-form). `tag` is a freeform category string. `contentType` is an integer the frontend uses to render the post (e.g., 0 = text, 1 = link, 2 = image URI).

**`createReply(parentId: bigint, content: string, contentType: number): Promise<TransactionResult>`**
Post a reply to an existing post or reply. `parentId` is the post ID being replied to.

**`createRepost(originalId: bigint, content: string): Promise<TransactionResult>`**
Repost an existing post with optional commentary. `content` may be empty for a plain repost.

**`editPost(postId: bigint, newContent: string): Promise<TransactionResult>`**
Edit the content of a post. Only the original author can edit. Edits are recorded on-chain.

**`deletePost(postId: bigint): Promise<TransactionResult>`**
Soft-delete a post. Only the original author can delete. The post record remains on-chain but is flagged as deleted.

**`like(postId: bigint): Promise<TransactionResult>`**
Like a post. Each address can like a post once. Calling again unliked the post.

**`follow(address: string): Promise<TransactionResult>`**
Follow another user's profile. Calling again with the same address unfollows.

**`tipPost(postId: bigint, amount: bigint): Promise<TransactionResult>`**
Send a BNB tip directly to the author of a post. `amount` is in wei. A small protocol fee is deducted from the tip before forwarding.

### Read Methods

**`getPost(postId: bigint): Promise<Post>`**
Returns full post data: author, content, tag, content type, like count, reply count, repost count, parent ID, and timestamps.

**`getUserProfile(address: string): Promise<Profile>`**
Returns the on-chain profile for an address: username, metadata URI, follower count, following count, post count, and registration timestamp.

## License

MIT
