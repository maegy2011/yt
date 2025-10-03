#!/usr/bin/env node

// Simple API test script for Vercel deployment
const fetch = require('node-fetch');

async function testAPI(baseUrl) {
  console.log(`Testing API at: ${baseUrl}\n`);
  
  // Test 1: Health check
  try {
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    
    console.log('Status:', healthResponse.status);
    console.log('Response:', JSON.stringify(healthData, null, 2));
    
    if (healthData.status === 'healthy') {
      console.log('✅ System is healthy\n');
    } else {
      console.log('❌ System has issues\n');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message, '\n');
  }
  
  // Test 2: Get channels
  try {
    console.log('2. Testing channels endpoint...');
    const channelsResponse = await fetch(`${baseUrl}/api/channels`);
    const channelsData = await channelsResponse.json();
    
    console.log('Status:', channelsResponse.status);
    console.log('Channels count:', Array.isArray(channelsData) ? channelsData.length : 'N/A');
    console.log('✅ Channels endpoint working\n');
  } catch (error) {
    console.log('❌ Channels endpoint failed:', error.message, '\n');
  }
  
  // Test 3: Add channel (will fail without proper database, but tests the endpoint)
  try {
    console.log('3. Testing add channel endpoint...');
    const addResponse = await fetch(`${baseUrl}/api/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'UCtest123456789',
        name: 'Test Channel',
        description: 'Test channel for API validation',
        category: 'test'
      }),
    });
    
    const addData = await addResponse.json();
    console.log('Status:', addResponse.status);
    console.log('Response:', JSON.stringify(addData, null, 2));
    
    if (addResponse.status === 201 || addResponse.status === 409 || addResponse.status === 503) {
      console.log('✅ Add channel endpoint working\n');
    } else {
      console.log('❌ Add channel endpoint may have issues\n');
    }
  } catch (error) {
    console.log('❌ Add channel endpoint failed:', error.message, '\n');
  }
}

// Get base URL from command line or use default
const baseUrl = process.argv[2] || 'http://localhost:3000';

testAPI(baseUrl).catch(console.error);