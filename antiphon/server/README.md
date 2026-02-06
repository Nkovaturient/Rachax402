# Storacha x402 Agent - Quick Start

Pay-per-use decentralized storage API with x402 payments and Bazaar discovery.

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Storacha Credentials
```bash
# Install CLI
npm install -g @storacha/cli

# Login with GitHub (get 100MB free)
storacha login

# Create space
storacha space create my-storage

# Generate agent key
storacha key create
# → Copy AgentId and PrivateKey

# Create delegation
storacha delegation create <AgentId> \
  --can 'filecoin/offer' \
  --can 'upload/add' \
  --can 'space/blob/add' \
  --can 'space/index/add' \
  --base64
# → Copy base64 output
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

Required:
- `STORACHA_PRIVATE_KEY` or `STORACHA_PVT_KEY` - Multibase-encoded key from step 2
- `STORACHA_DELEGATION_KEY` - From step 2
- `RECIPIENT_ADDRESS` - Your wallet address for receiving payments

### 4. Run Server
```bash
npm run dev
```

You should see:
```
✅ x402 resource server initialized
✅ Payment middleware registered with Bazaar discovery
🚀 Storacha x402 Agent server running on http://localhost:8000
💰 Recipient: 0x9D48b65Bb45f144CBC5662Fd3Fd011659371D0f8
🌐 Network: eip155:84532 (Base Sepolia)
📡 Facilitator: https://x402.org/facilitator
🔍 Bazaar Discovery: ENABLED

📋 Available endpoints:
   POST /upload  - $0.001 per upload
   GET /retrieve - $0.0005 per retrieval
```

On upload/retrieve you’ll see logs like:
```
📤 Uploading file: test.txt (86 bytes)
✅Uploaded successfully! File metadata: { cid: 'bafkre...', filename: 'test.txt', ... }
📥 Retrieving file with CID: bafkre...
✅Retrieved successfully! CID: bafkre... size: 86
```

### 5. Test (Optional)
Get test USDC from [Circle Faucet](https://faucet.circle.com/) for Base Sepolia.

Add your test wallet private key to `.env`:
```bash
EVM_PRIVATE_KEY=0x...
```

Run tests:
```bash
npm test
```

Successful test run:
```
============================================================
Starting x402 Storacha Integration Tests
============================================================

📋 Test 1: Health Check (no payment)
✅ Server is healthy

📤 Test 2: Upload File with Payment
✅ Upload successful!
   CID: bafkreigp5qp42xsgaqkpkx2vc5kzcb5piqi6fwieg6ppjzfzbwvr3c4oyq
   Size: 86 bytes
   URL: https://w3s.link/ipfs/bafkre...

📥 Test 3: Retrieve File with Payment
✅ Retrieval successful!
   CID: bafkre...
   Size: 86 bytes
   Type: text/plain; charset=ISO-8859-1

🚫 Test 4: Request Without Payment (should fail)
✅ Server correctly returned 402 Payment Required
   Network: eip155:84532

============================================================
✅ All tests completed successfully!
============================================================
```

**Why Test 4?** It checks that the server enforces payment: a request sent without payment headers must get `402 Payment Required`. Testnet is fine for paying; Test 4 only verifies that unpaid requests are rejected.

## 📡 API Endpoints

### POST /upload
**Price:** $0.001 per upload

Upload file to IPFS:
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@document.pdf" \
  -H "X-PAYMENT: <payment_proof>"
```

Response:
```json
{
  "status": "success",
  "data": {
    "cid": "bafybei...",
    "filename": "document.pdf",
    "size": 524288,
    "url": "https://w3s.link/ipfs/bafybei...",
    "uploadedAt": "2025-01-31T12:00:00.000Z"
  }
}
```

### GET /retrieve
**Price:** $0.0005 per retrieval

Retrieve file from IPFS:
```bash
curl "http://localhost:8000/retrieve?cid=bafybei..." \
  -H "X-PAYMENT: <payment_proof>"
```

### GET /health
**Price:** Free

Check server status:
```bash
curl http://localhost:8000/health
```

## 🔍 Bazaar Discovery

Your endpoints are automatically discoverable via Bazaar:

```javascript
import { HTTPFacilitatorClient } from '@x402/core/http';
import { withBazaar } from '@x402/extensions/bazaar';

const client = withBazaar(new HTTPFacilitatorClient({
  url: 'https://x402.org/facilitator'
}));

// Discover Storacha storage services
const services = await client.extensions.discovery.listResources({
  type: 'http'
});
```

## 🤖 Agent Integration

Agents can discover and use your service automatically:

```javascript
// 1. Discover service via Bazaar
const storachaService = services.find(s => 
  s.description.includes('Storacha')
);

// 2. Make paid request (x402 handles payment)
const response = await fetchWithPayment(storachaService.url, {
  method: 'POST',
  body: formData
});

// 3. Get CID back
const { cid } = await response.json();
```

## 🌐 Going to Mainnet

1. Change network to `eip155:8453` (Base mainnet)
2. Update `RECIPIENT_ADDRESS` to your mainnet wallet
3. Ensure wallet has USDC for gas
4. Test thoroughly first!

## 📚 More Info

- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Detailed guide
- [x402 Docs](https://x402.gitbook.io/x402) - Protocol docs
- [Storacha Docs](https://docs.storacha.network) - Storage docs
- [Bazaar Discovery](https://x402.gitbook.io/x402/core-concepts/bazaar-discovery-layer) - Discovery layer

## 🐛 Troubleshooting

**Server won't start:**
- Check `.env` has correct Storacha credentials
- Verify delegation has all required permissions

**Payments not working:**
- Ensure using Base Sepolia (`eip155:84532`)
- Check wallet has test USDC
- Verify facilitator URL is correct

**Not appearing in Bazaar:**
- Confirm `declareDiscoveryExtension` is configured
- Check server is publicly accessible
- Wait a few minutes for indexing

## 💡 Next Steps

1. Test locally with the test client
2. Deploy to production (Vercel, Railway, etc.)
3. Monitor usage via Bazaar analytics
4. Build agent clients that auto-discover your service

---

Built with ❤️ using x402 + Storacha