// Test script for local Vercel API
import { config } from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testKVConnection() {
  try {
    console.log('Testing KV connection...');
    
    // Test basic KV operations
    await kv.set('test-key', 'test-value');
    const value = await kv.get('test-key');
    
    console.log('✅ KV Connection successful!');
    console.log('Test value:', value);
    
    // Clean up test key
    await kv.del('test-key');
    console.log('✅ Test cleanup complete');
    
    return true;
  } catch (error) {
    console.error('❌ KV Connection failed:', error.message);
    return false;
  }
}

async function testGameAPI() {
  try {
    console.log('\nTesting game API locally...');
    
    // Import our game handler
    const { default: handler } = await import('./api/game.js');
    
    // Create mock request/response objects
    const mockReq = {
      method: 'POST',
      query: { action: 'createRoom' },
      body: { playerName: 'TestPlayer', aiPlayerCount: 1 }
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log('✅ API Response Status:', code);
          console.log('✅ API Response Data:', JSON.stringify(data, null, 2));
          return data;
        }
      }),
      setHeader: () => {},
      json: (data) => console.log('Response:', data)
    };
    
    await handler(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Game API test failed:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Bibliostador Local Setup\n');
  
  const kvWorking = await testKVConnection();
  
  if (kvWorking) {
    await testGameAPI();
  } else {
    console.log('❌ Skipping API test due to KV connection failure');
  }
  
  console.log('\n🏁 Tests completed');
}

runTests();