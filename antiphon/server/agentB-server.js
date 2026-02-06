/**
 * Agent B (Provider) Express Server
 * Implements x402 payment middleware for data analysis service
 * Integrates with ElizaOS agent for actual processing
 */

import express from 'express';
import cors from 'cors';
import { paymentMiddleware } from '@x402/express';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PROVIDER_PORT || 3001;

app.use(cors());
app.use(express.json());

// x402 Configuration
const RECIPIENT_ADDRESS = process.env.PROVIDER_WALLET_ADDRESS;
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://x402.org/facilitator';

// Create facilitator client and resource server
const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register('eip155:84532', new ExactEvmScheme()); // Base Sepolia

// Define payment-gated routes
const routes = {
  'POST /analyze': {
    accepts: [
      {
        scheme: 'exact',
        price: '$0.01',
        network: 'eip155:84532',
        payTo: RECIPIENT_ADDRESS,
      },
    ],
    description: 'Analyze CSV dataset with statistical computation',
    mimeType: 'application/json',
  },
};

// Apply x402 payment middleware
app.use(paymentMiddleware(routes, resourceServer));

/**
 * /analyze endpoint - protected by x402
 * Called by Agent A after payment verification
 */
app.post('/analyze', async (req, res) => {
  try {
    const { inputCID, requirements } = req.body;

    if (!inputCID) {
      return res.status(400).json({ error: 'Missing inputCID' });
    }

    console.log(`✅ Payment verified. Processing analysis for CID: ${inputCID}`);
    console.log(`   Requirements: ${requirements}`);

    // Forward task to ElizaOS Agent B for actual processing
    const elizaResponse = await axios.post('http://localhost:3000/message', {
      text: `Analyze data at CID: ${inputCID}. Requirements: ${requirements}`,
      userId: 'agent-a',
      roomId: 'agent-coordination',
    });

    // Extract result CID from ElizaOS response
    const resultCID = elizaResponse.data.resultCID || 'bafybei...placeholder';

    res.json({
      status: 'success',
      message: 'Analysis complete',
      resultCID,
      summary: elizaResponse.data.summary || 'Statistical analysis completed',
    });
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Agent B Provider (DataAnalyzer)',
    recipient: RECIPIENT_ADDRESS,
    network: 'eip155:84532',
    facilitator: FACILITATOR_URL,
  });
});

app.listen(PORT, () => {
  console.log(`🤖 Agent B Provider running on http://localhost:${PORT}`);
  console.log(`💰 Recipient: ${RECIPIENT_ADDRESS}`);
  console.log(`🌐 Network: Base Sepolia (eip155:84532)`);
  console.log(`📡 Facilitator: ${FACILITATOR_URL}`);
  console.log(`\n📋 Protected endpoints:`);
  console.log(`   POST /analyze - $0.01 per analysis`);
});