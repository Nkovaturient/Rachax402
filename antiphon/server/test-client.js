/**
 * Test Client for Storacha x402 Agent
 * Demonstrates the complete agent payment flow
 */

import { wrapFetchWithPayment } from '@x402/fetch';
import { x402Client, x402HTTPClient } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8000';
const PRIVATE_KEY = process.env.EVM_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ Error: EVM_PRIVATE_KEY not set in .env file');
  console.log('Get test USDC from: https://faucet.circle.com/ (Base Sepolia)');
  process.exit(1);
}

// Setup x402 payment client
const signer = privateKeyToAccount(PRIVATE_KEY);
const client = new x402Client();
registerExactEvmScheme(client, { signer });
const httpClient = new x402HTTPClient(client);
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

console.log('🤖 Storacha x402 Test Client');
console.log(`💰 Wallet: ${signer.address}`);
console.log(`🌐 Server: ${SERVER_URL}\n`);

/**
 * Test 1: Check server health (no payment required)
 */
async function testHealth() {
  console.log('📋 Test 1: Health Check (no payment)');
  
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const data = await response.json();
    
    console.log('✅ Server is healthy');
    console.log(`   Bazaar: ${data.bazaarEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   Network: ${data.network}`);
    console.log(`   Endpoints:`);
    Object.entries(data.endpoints).forEach(([name, info]) => {
      console.log(`     - ${info.method} ${info.path}: ${info.price}`);
    });
    console.log('');
    
    return data;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    throw error;
  }
}

/**
 * Test 2: Upload a file with x402 payment.
 * Uses two-step flow: get 402 first, then POST with payment + fresh body
 * (wrapFetchWithPayment's clone shares body stream so retry has no body).
 */
async function testUpload(filename = 'test.txt') {
  console.log('📤 Test 2: Upload File with Payment');
  console.log(`   File: ${filename}`);
  
  try {
    if (!fs.existsSync(filename)) {
      console.log('   Creating test file...');
      fs.writeFileSync(filename, `Test file created at ${new Date().toISOString()}\nThis file was uploaded via x402 payment.`);
    }
    
    const fileBuffer = fs.readFileSync(filename);
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename });
    const body1 = formData.getBuffer();
    const headers1 = formData.getHeaders();
    
    console.log('   Attempting upload...');
    
    const firstRes = await fetch(`${SERVER_URL}/upload`, {
      method: 'POST',
      body: body1,
      headers: headers1,
    });
    
    if (firstRes.status !== 402) {
      if (!firstRes.ok) {
        const errText = await firstRes.text();
        let errMsg = errText;
        try {
          errMsg = JSON.parse(errText).message || JSON.parse(errText).error || errText;
        } catch {}
        throw new Error(`Upload failed: ${errMsg}`);
      }
      const result = await firstRes.json();
      console.log('✅ Upload successful!');
      console.log(`   CID: ${result.data.cid}`);
      console.log(`   Size: ${result.data.size} bytes`);
      console.log(`   URL: ${result.data.url}`);
      console.log('');
      return result.data.cid;
    }
    
    const getHeader = (name) => firstRes.headers.get(name);
    let body;
    try {
      const text = await firstRes.text();
      if (text) body = JSON.parse(text);
    } catch {}
    const paymentRequired = httpClient.getPaymentRequiredResponse(getHeader, body);
    const paymentPayload = await client.createPaymentPayload(paymentRequired);
    const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
    
    const formData2 = new FormData();
    formData2.append('file', fileBuffer, { filename });
    const body2 = formData2.getBuffer();
    const headers2 = { ...formData2.getHeaders(), ...paymentHeaders };
    
    const secondRes = await fetch(`${SERVER_URL}/upload`, {
      method: 'POST',
      body: body2,
      headers: headers2,
    });
    
    if (!secondRes.ok) {
      const errText = await secondRes.text();
      let errMsg = errText;
      try {
        errMsg = JSON.parse(errText).message || JSON.parse(errText).error || errText;
      } catch {}
      throw new Error(`Upload failed: ${errMsg}`);
    }
    
    const result = await secondRes.json();
    console.log('✅ Upload successful!');
    console.log(`   CID: ${result.data.cid}`);
    console.log(`   Size: ${result.data.size} bytes`);
    console.log(`   URL: ${result.data.url}`);
    console.log('');
    return result.data.cid;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

/**
 * Test 3: Retrieve a file with x402 payment
 */
async function testRetrieve(cid) {
  console.log('📥 Test 3: Retrieve File with Payment');
  console.log(`   CID: ${cid}`);
  
  try {
    console.log('   Attempting retrieval...');
    
    // Make paid request
    const response = await fetchWithPayment(`${SERVER_URL}/retrieve?cid=${cid}`);
    
    if (!response.ok) {
      const text = await response.text();
      let msg = text;
      try {
        const err = JSON.parse(text);
        msg = err.message || err.error || text;
      } catch (_) {}
      throw new Error(`Retrieval failed: ${msg}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const resolvedCid = response.headers.get('X-CID') || cid;
    const type = response.headers.get('Content-Type') || 'application/octet-stream';
    const size = buffer.length;

    console.log('✅ Retrieval successful!');
    console.log(`   CID: ${resolvedCid}`);
    console.log(`   Size: ${size} bytes`);
    console.log(`   Type: ${type}`);
    console.log('');

    return { cid: resolvedCid, size, type, data: buffer };
  } catch (error) {
    console.error('❌ Retrieval failed:', error.message);
    throw error;
  }
}

/**
 * Test 4: Test without payment (should fail with 402)
 */
async function testWithoutPayment() {
  console.log('🚫 Test 4: Request Without Payment (should fail)');
  
  try {
    const response = await fetch(`${SERVER_URL}/retrieve?cid=test`);
    
    if (response.status === 402) {
      console.log('✅ Server correctly returned 402 Payment Required');
      
      const paymentHeader = response.headers.get('PAYMENT-REQUIRED');
      if (paymentHeader) {
        const paymentInfo = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
        console.log(`   Price: $${paymentInfo.accepts[0].price}`);
        console.log(`   Network: ${paymentInfo.accepts[0].network}`);
      }
      console.log('');
    } else {
      console.error('❌ Expected 402, got:', response.status);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=' .repeat(60));
  console.log('Starting x402 Storacha Integration Tests');
  console.log('=' .repeat(60) + '\n');
  
  try {
    // Test 1: Health check
    await testHealth();
    
    // Test 2: Upload with payment
    const cid = await testUpload();
    
    // Test 3: Retrieve with payment
    await testRetrieve(cid);
    
    // Test 4: Request without payment
    await testWithoutPayment();
    
    console.log('=' .repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n' + '=' .repeat(60));
    console.error('❌ Tests failed:', error.message);
    console.error('=' .repeat(60));
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testHealth, testUpload, testRetrieve, testWithoutPayment };