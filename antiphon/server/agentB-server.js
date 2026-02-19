/**
 * Agent B Server - Complete Implementation
 * 
 * This server acts as a PAYMENT GATEWAY + PROCESSOR
 * It does NOT run ElizaOS - instead it contains the processing logic directly
 * 
 * Flow:
 * 1. Receives HTTP POST from Agent A
 * 2. x402 middleware returns 402 Payment Required
 * 3. Agent A retries with payment header
 * 4. x402 middleware validates payment
 * 5. This handler processes the CSV analysis
 * 6. Returns resultCID to Agent A
 */

import express from 'express';
import cors from 'cors';
import { paymentMiddleware } from '@x402/express';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import Papa from 'papaparse';
import { initStorachaClient } from './initStoracha.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PROVIDER_PORT || 8001;

// Middleware
app.use(cors({
  exposedHeaders: ['PAYMENT-REQUIRED', 'PAYMENT-RESPONSE', 'X-PAYMENT-RESPONSE']
}));
app.use(express.json());

// Configuration
const RECIPIENT_ADDRESS = process.env.PROVIDER_WALLET_ADDRESS;
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://x402.org/facilitator';

console.log('🔧 Initializing Agent B Server...');
console.log(`   Recipient: ${RECIPIENT_ADDRESS}`);
console.log(`   Facilitator: ${FACILITATOR_URL}`);

/**
 * Initialize Storacha client for Agent B
 * This allows Agent B to download input data and upload results
 */

/**
 * Create x402 resource server
 * This is what handles the payment verification
 */
const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register('eip155:84532', new ExactEvmScheme()); // Base Sepolia

/**
 * Define payment-gated routes
 * IMPORTANT: This configuration tells x402 what to do
 */
const routes = {
  'POST /analyze': {
    accepts: [
      {
        scheme: 'exact',      // Payment scheme
        price: '$0.01',       // Price in USDC
        network: 'eip155:84532', // Base Sepolia network
        payTo: RECIPIENT_ADDRESS, // Where payment goes
      },
    ],
    description: 'Analyze CSV dataset with statistical computation',
    mimeType: 'application/json',
  },
};

/**
 * Apply x402 payment middleware
 * THIS IS CRITICAL - it intercepts requests before they reach your handler
 * 
 * What it does:
 * 1. First request: Returns 402 with PAYMENT-REQUIRED header
 * 2. Second request (with X-PAYMENT header): Validates payment, then calls your handler
 */
app.use(paymentMiddleware(routes, resourceServer));

console.log('✅ Payment middleware configured');

/**
 * CSV Analysis Function
 * This is the actual data processing logic
 */

async function analyzeCSV(csvContent) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data;
          const columns = results.meta.fields || [];

          // Calculate statistics for numerical columns
          const numericalStats= {};
          const insights = [];

          columns.forEach((column) => {
            const values = data
              .map(row => row[column])
              .filter(val => typeof val === 'number' && !isNaN(val));

            if (values.length > 0) {
              const sorted = values.sort((a, b) => a - b);
              const sum = values.reduce((a, b) => a + b, 0);
              const mean = sum / values.length;
              const median = sorted[Math.floor(sorted.length / 2)];
              
              // Calculate standard deviation
              const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
              const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
              const stdDev = Math.sqrt(variance);

              numericalStats[column] = {
                mean: Number(mean.toFixed(2)),
                median: Number(median.toFixed(2)),
                stdDev: Number(stdDev.toFixed(2)),
                min: sorted[0],
                max: sorted[sorted.length - 1],
              };

              // Generate insights
              if (stdDev > mean * 0.5) {
                insights.push(`High variance detected in ${column} (σ=${stdDev.toFixed(2)})`);
              }
              if (sorted[sorted.length - 1] > mean + 2 * stdDev) {
                insights.push(`Potential outliers detected in ${column}`);
              }
            }
          });

          const summary = `Analyzed ${data.length} rows across ${columns.length} columns. ` +
            `Found ${Object.keys(numericalStats).length} numerical columns.`;

          resolve({
            summary,
            statistics: {
              rowCount: data.length,
              columnCount: columns.length,
              columns,
              numericalStats,
            },
            insights,
          });
        } catch (error) {
          reject(new Error(`Analysis failed: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

function formatAnalysisResults(result) {
  let output = `${result.summary}\n\n`;

  output += '📊 Statistical Summary:\n';
  Object.entries(result.statistics.numericalStats).forEach(([column, stats]) => {
    output += `\n${column}:\n`;
    output += `  Mean: ${stats.mean}\n`;
    output += `  Median: ${stats.median}\n`;
    output += `  Std Dev: ${stats.stdDev}\n`;
    output += `  Range: ${stats.min} - ${stats.max}\n`;
  });

  if (result.insights.length > 0) {
    output += `\n💡 Insights:\n`;
    result.insights.forEach((insight, i) => {
      output += `${i + 1}. ${insight}\n`;
    });
  }

  return output;
}

/**
 * Main processing function
 * Called after payment is verified
 */
async function processAnalysisTask(inputCID, requirements) {
  console.log(`\n📊 Starting analysis for CID: ${inputCID}`);
  console.log(`   Requirements: ${requirements}`);

  try {
    // Step 1: Download CSV data from Storacha
    console.log('   📥 Downloading data from Storacha...');
    const response = await fetch(`https://w3s.link/ipfs/${inputCID}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data from Storacha: ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    console.log(`   ✅ Downloaded ${csvContent.length} bytes`);

    // Step 2: Analyze CSV
    console.log('   🔬 Analyzing data...');
    const analysisResult = await analyzeCSV(csvContent);
    const formattedResults = formatAnalysisResults(analysisResult);
    console.log(`   ✅ Analysis complete: ${analysisResult.statistics.rowCount} rows processed`);

    // Step 3: Upload results to Storacha
    console.log('   📤 Uploading results to Storacha...');
    if (!storachaClient) {
      await initStorachaClient();
    }

    const resultsBlob = new Blob([formattedResults], { type: 'text/plain' });
    const resultsFile = new File([resultsBlob], 'analysis-results.txt', { 
      type: 'text/plain' 
    });
    
    const resultCID = await storachaClient.uploadFile(resultsFile);
    console.log(`   ✅ Results uploaded: ${resultCID}`);

    return {
      resultCID: resultCID.toString(),
      summary: analysisResult.summary,
      statistics: analysisResult.statistics,
      insights: analysisResult.insights,
    };
  } catch (error) {
    console.error('   ❌ Processing error:', error.message);
    throw error;
  }
}

/**
 * /analyze endpoint
 * 
 * IMPORTANT: This is only reached AFTER payment is verified by x402 middleware
 * The middleware has already:
 * 1. Checked for payment header
 * 2. Validated the signature
 * 3. Verified the payment amount matches
 * 
 * If you're in this function, payment was successful!
 */
app.post('/analyze', async (req, res) => {
  try {
    const { inputCID, requirements } = req.body;

    if (!inputCID) {
      return res.status(400).json({ 
        error: 'Missing inputCID',
        message: 'Please provide the CID of the data to analyze'
      });
    }

    console.log(`\n✅ Payment verified. Processing analysis...`);

    // Process the task
    const result = await processAnalysisTask(
      inputCID, 
      requirements || 'statistical analysis'
    );

    res.json({
      status: 'success',
      message: 'Analysis complete',
      resultCID: result.resultCID,
      summary: result.summary,
      statistics: result.statistics,
      insights: result.insights,
    });

    console.log(`✅ Analysis completed and returned to client\n`);
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
    });
  }
});

/**
 * Health check endpoint
 * No payment required
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Agent B Provider (DataAnalyzer)',
    recipient: RECIPIENT_ADDRESS,
    network: 'eip155:84532',
    facilitator: FACILITATOR_URL,
    storachaReady: storachaClient !== null,
  });
});

/**
 * Start server
 */
async function start() {
  try {
    // Initialize Storacha first
    await initStorachaClient();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🤖 Agent B Provider running on http://localhost:${PORT}`);
      console.log(`💰 Recipient: ${RECIPIENT_ADDRESS}`);
      console.log(`🌐 Network: Base Sepolia (eip155:84532)`);
      console.log(`📡 Facilitator: ${FACILITATOR_URL}`);
      console.log(`\n📋 Protected endpoints:`);
      console.log(`   POST /analyze - $0.01 per analysis`);
      console.log(`\n💡 Ready to process data analysis requests!\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

start();