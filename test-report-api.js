const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api/reports/sales';

async function testReportAPI() {
  // Example: test with a date range and groupBy
  const params = new URLSearchParams({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    groupBy: 'month'
  });

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testReportAPI(); 