const express = require('express');
const app = express();
const port = 8080;

app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ReddyTalk Backend'
  });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    version: '1.0.0'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Test endpoint: http://localhost:${port}/api/test`);
});