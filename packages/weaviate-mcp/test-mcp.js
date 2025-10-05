#!/usr/bin/env node

// Simple test script to verify MCP server functionality
import { spawn } from 'child_process';

console.log('Testing Weaviate MCP Server...');

// Start the MCP server
const server = spawn('node', ['dist/server.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe']
});

// Test data
const testRequests = [
  // List tools
  {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  },
  // Test add_document
  {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'add_document',
      arguments: {
        content: 'function testFunction() { return "Hello World"; }',
        metadata: {
          contentType: 'code',
          title: 'Test Function',
          language: 'javascript',
          project: 'test-project'
        }
      }
    }
  },
  // Test search_content
  {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'search_content',
      arguments: {
        query: 'test function',
        filters: {
          contentType: ['code']
        }
      }
    }
  }
];

let requestIndex = 0;

// Send test requests
function sendNextRequest() {
  if (requestIndex >= testRequests.length) {
    console.log('All tests completed!');
    server.kill();
    return;
  }

  const request = testRequests[requestIndex++];
  console.log(`\nSending request ${requestIndex}:`, JSON.stringify(request, null, 2));
  
  server.stdin.write(JSON.stringify(request) + '\n');
  
  // Wait a bit before next request
  setTimeout(sendNextRequest, 2000);
}

// Handle server output
server.stdout.on('data', (data) => {
  console.log('Server response:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Start testing after a short delay
setTimeout(() => {
  console.log('Starting tests...');
  sendNextRequest();
}, 1000);