/**
 * Storacha x402 Agent Server with Bazaar Discovery
 * Implements x402 protocol for Storacha Storage services with enhanced discovery
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { paymentMiddleware } from '@x402/express';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import { uploadFileToStoracha, retrieveFileFromStoracha } from './initStoracha.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Configure multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// CORS middleware - expose payment headers
app.use(cors({
  exposedHeaders: ['PAYMENT-REQUIRED', 'PAYMENT-RESPONSE', 'X-PAYMENT-RESPONSE']
}));
app.use(express.json());

// Configuration
const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS || '0x23792579e2979a98d12a33a85e35914079304a56';
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://x402.org/facilitator';

// Create facilitator client
const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });

// Create x402 resource server and register EVM scheme
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register('eip155:84532', new ExactEvmScheme()); // Base Sepolia

console.log('✅ x402 resource server initialized');

// Define route configurations with Bazaar discovery extension
const routes = {
  'POST /upload': {
    accepts: [
      {
        scheme: 'exact',
        price: '$0.001', // Price per upload
        network: 'eip155:84532', // Base Sepolia (CAIP-2 format)
        payTo: RECIPIENT_ADDRESS,
      },
    ],
    description: 'Upload files to decentralized IPFS storage via Storacha. Returns CID and IPFS gateway URL.',
    mimeType: 'application/json',
    extensions: {
      // Bazaar discovery extension
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
              url: 'https://w3s.link/ipfs/bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu',
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
        price: '$0.0005', // Lower price for retrieval
        network: 'eip155:84532',
        payTo: RECIPIENT_ADDRESS,
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
              // File content would be included here
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

// Apply x402 payment middleware with Bazaar-enabled routes
app.use(paymentMiddleware(routes, resourceServer));

console.log('✅ Payment middleware registered with Bazaar discovery');

// Upload endpoint - protected by x402 (multer errors caught by error handler below)
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

    // Convert buffer to File-like object for Storacha
    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    console.log(`📤 Uploading file: ${file.name} (${file.size} bytes)`);

    const storeData = await uploadFileToStoracha(file);

    res.json({
      status: 'success',
      data: storeData,
      link: `https://w3s.link/ipfs/${storeData.cid}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file to Storacha',
      message: error.message,
    });
  }
});

// Retrieve endpoint - protected by x402
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

    const file = await retrieveFileFromStoracha(cid);

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

// Health check endpoint (no payment required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Storacha x402 Agent',
    recipient: RECIPIENT_ADDRESS,
    network: 'eip155:84532', // Base Sepolia
    facilitator: FACILITATOR_URL,
    bazaarEnabled: true,
    endpoints: {
      upload: {
        method: 'POST',
        path: '/upload',
        price: '$0.001',
        discoverable: true,
      },
      retrieve: {
        method: 'GET',
        path: '/retrieve',
        price: '$0.0005',
        discoverable: true,
      },
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Storacha x402 Agent server running on http://localhost:${PORT}`);
  console.log(`💰 Recipient: ${RECIPIENT_ADDRESS}`);
  console.log(`🌐 Network: eip155:84532 (Base Sepolia)`);
  console.log(`📡 Facilitator: ${FACILITATOR_URL}`);
  console.log(`🔍 Bazaar Discovery: ENABLED`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST /upload  - $0.001 per upload`);
  console.log(`   GET /retrieve - $0.0005 per retrieval`);
});