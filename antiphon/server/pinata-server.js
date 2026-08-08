/**
 * Pinata x402 Agent Server with Bazaar Discovery
 * Self-hosted x402 storage; Pinata JWT as IPFS backend (free tier).
 *
 * Test:
 * curl -X POST -F "file=@test.txt" http://localhost:8000/upload
 * curl "http://localhost:8000/retrieve?cid=bafybei..."
 */

import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { paymentMiddleware } from '@x402/express';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import { facilitator as cdpFacilitator } from '@coinbase/x402';
import { uploadFileToPinata, retrieveFileFromPinata, ipfsGatewayUrl } from './initPinata.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
  exposedHeaders: ['PAYMENT-REQUIRED', 'PAYMENT-RESPONSE', 'X-PAYMENT-RESPONSE']
}));
app.use(express.json());

const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS;
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://facilitator.xpay.sh';

const useCdp = !!(process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET);
const NETWORK = process.env.X402_NETWORK || 'eip155:84532';

const facilitatorClient = useCdp
  ? new HTTPFacilitatorClient(cdpFacilitator)
  : new HTTPFacilitatorClient({ url: FACILITATOR_URL });

const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(NETWORK, new ExactEvmScheme());

console.log('✅ x402 resource server initialized (Pinata storage)');

const gatewayExample = ipfsGatewayUrl('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu');

const routes = {
  'POST /upload': {
    accepts: [
      {
        scheme: 'exact',
        price: '$0.1',
        network: NETWORK,
        payTo: RECIPIENT_ADDRESS,
        extra: { assetTransferMethod: 'permit2', name: 'USD Coin', version: '2' },
      },
    ],
    description: 'Upload files to decentralized IPFS storage via Pinata. Returns CID and gateway URL.',
    mimeType: 'application/json',
    extensions: {
      ...declareDiscoveryExtension({
        input: {
          contentType: 'multipart/form-data',
          bodyParams: {
            file: {
              type: 'file',
              description: 'File to upload to IPFS storage',
              required: true,
            },
          },
        },
        output: {
          example: {
            status: 'success',
            data: {
              cid: 'bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu',
              filename: 'document.pdf',
              size: 524288,
              type: 'application/pdf',
              url: gatewayExample,
              uploadedAt: '2025-01-31T12:00:00.000Z',
            },
          },
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['success'] },
              data: {
                type: 'object',
                properties: {
                  cid: { type: 'string', description: 'IPFS Content Identifier' },
                  filename: { type: 'string', description: 'Original filename' },
                  size: { type: 'number', description: 'File size in bytes' },
                  type: { type: 'string', description: 'MIME type' },
                  url: { type: 'string', description: 'IPFS gateway URL' },
                  uploadedAt: { type: 'string', format: 'date-time' },
                },
                required: ['cid', 'filename', 'size', 'url'],
              },
            },
            required: ['status', 'data'],
          },
        },
      }),
    },
  },

  'GET /retrieve': {
    accepts: [
      {
        scheme: 'exact',
        price: '$0.005',
        network: NETWORK,
        payTo: RECIPIENT_ADDRESS,
        extra: { assetTransferMethod: 'permit2', name: 'USD Coin', version: '2' },
      },
    ],
    description: 'Retrieve files from IPFS storage using CID. Returns file data and metadata.',
    mimeType: 'application/json',
    extensions: {
      ...declareDiscoveryExtension({
        input: {
          queryParams: {
            cid: {
              type: 'string',
              description: 'IPFS Content Identifier (CID) of the file to retrieve',
              required: true,
              example: 'bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu',
            },
          },
        },
        output: {
          example: {
            status: 'success',
            data: {
              name: 'document.pdf',
              size: 524288,
              type: 'application/pdf',
            },
          },
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['success'] },
              data: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  size: { type: 'number' },
                  type: { type: 'string' },
                },
              },
            },
            required: ['status', 'data'],
          },
        },
      }),
    },
  },
};

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Pinata x402 Agent',
    recipient: RECIPIENT_ADDRESS,
    network: NETWORK,
    facilitator: useCdp ? 'CDP (production)' : FACILITATOR_URL,
    bazaarEnabled: true,
    ipfsBackend: 'pinata',
    endpoints: {
      upload: { method: 'POST', path: '/upload', price: '$0.1', discoverable: true },
      retrieve: { method: 'GET', path: '/retrieve', price: '$0.005', discoverable: true },
    },
  });
});

const _rawPaymentMiddleware = paymentMiddleware(routes, resourceServer, undefined, undefined, false);
app.use((req, res, next) => {
  const hasPayment = !!(req.headers['x-payment'] || req.headers['payment']);
  if (hasPayment) {
    setTimeout(() => _rawPaymentMiddleware(req, res, next), 1200);
  } else {
    _rawPaymentMiddleware(req, res, next);
  }
});

app.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: 'Invalid multipart body',
        message: err.message || 'Unexpected end of form or malformed multipart',
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Missing required parameter: file',
        message: 'Please upload a file using multipart/form-data',
      });
    }

    const file = {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    };

    console.log(`📤 Uploading file: ${file.name} (${file.size} bytes)`);
    const storeData = await uploadFileToPinata(file);

    res.json({
      status: 'success',
      data: storeData,
      link: ipfsGatewayUrl(storeData.cid),
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file to Pinata',
      message: error.message,
    });
  }
});

app.get('/retrieve', async (req, res) => {
  try {
    const { cid } = req.query;

    if (!cid) {
      return res.status(400).json({
        error: 'Missing required parameter: cid',
        message: 'Please provide a CID in the query string: ?cid=bafybei...',
      });
    }

    console.log(`📥 Retrieving file with CID: ${cid}`);
    const file = await retrieveFileFromPinata(cid);

    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', file.size);
    res.setHeader('X-CID', file.cid);
    res.send(file.data);
  } catch (error) {
    console.error('Retrieve error:', error);
    res.status(500).json({
      error: 'Failed to retrieve file',
      message: error.message,
    });
  }
});

async function warmAndInitialize(maxAttempts = 5) {
  const facilitatorUrl = useCdp ? null : FACILITATOR_URL;
  if (facilitatorUrl) {
    for (let i = 1; i <= maxAttempts; i++) {
      try {
        const res = await fetch(`${facilitatorUrl}/health`, { signal: AbortSignal.timeout(8000) });
        console.log(`✅ Facilitator reachable (${res.status})`);
        break;
      } catch (err) {
        console.warn(`⏳ Facilitator ping ${i}/${maxAttempts}: ${err.message}`);
        if (i === maxAttempts) {
          console.warn('⚠️ Facilitator not reachable — will retry initialize on first request');
          break;
        }
        await new Promise(r => setTimeout(r, 3000 * i));
      }
    }
  }

  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await resourceServer.initialize();
      console.log('✅ Resource server initialized (payment kinds loaded)');
      return;
    } catch (err) {
      console.warn(`⏳ initialize() attempt ${i}/${maxAttempts}: ${err.message}`);
      if (i < maxAttempts) await new Promise(r => setTimeout(r, 3000 * i));
    }
  }
  console.warn('⚠️ initialize() failed after retries — first request may fail');
}

async function start() {
  try {
    await warmAndInitialize();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Pinata x402 Agent server running on http://localhost:${PORT}`);
      console.log(`💰 Recipient: ${RECIPIENT_ADDRESS}`);
      console.log(`🌐 Network: ${NETWORK}`);
      console.log(`📡 Facilitator: ${useCdp ? 'CDP (production)' : FACILITATOR_URL}`);
      console.log(`🔍 Bazaar Discovery: ENABLED`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   POST /upload  - $0.1 per upload`);
      console.log(`   GET /retrieve - $0.005 per retrieval`);
    });
    server.on('error', (err) => {
      console.error(`❌ Pinata storage server failed to bind port ${PORT}:`, err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
