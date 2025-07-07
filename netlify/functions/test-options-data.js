// netlify/functions/test-options-data.js - TEST YOUR OPTIONS ACCESS
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { symbol } = event.queryStringParameters;
    const testSymbol = symbol || 'AAPL'; // Default to AAPL for testing
    
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'ALPHA_VANTAGE_API_KEY environment variable not set'
        })
      };
    }

    console.log(`Testing options data access for ${testSymbol}`);
    
    // Test different possible Alpha Vantage options endpoints
    const optionsEndpoints = [
      // Common options endpoints that Alpha Vantage might support
      `https://www.alphavantage.co/query?function=OPTION_CHAIN&symbol=${testSymbol}&apikey=${API_KEY}`,
      `https://www.alphavantage.co/query?function=OPTIONS&symbol=${testSymbol}&apikey=${API_KEY}`,
      `https://www.alphavantage.co/query?function=REALTIME_OPTIONS&symbol=${testSymbol}&apikey=${API_KEY}`,
      `https://www.alphavantage.co/query?function=OPTIONS_DATA&symbol=${testSymbol}&apikey=${API_KEY}`,
      `https://www.alphavantage.co/query?function=OPTION_QUOTES&symbol=${testSymbol}&apikey=${API_KEY}`
    ];

    const results = [];
    
    for (let i = 0; i < optionsEndpoints.length; i++) {
      try {
        console.log(`Testing endpoint ${i + 1}: ${optionsEndpoints[i].split('&apikey=')[0]}`);
        
        const response = await fetch(optionsEndpoints[i]);
        const data = await response.json();
        
        results.push({
          endpoint: `Endpoint ${i + 1}`,
          function: optionsEndpoints[i].split('function=')[1].split('&')[0],
          status: response.status,
          hasData: !data['Error Message'] && !data['Note'] && Object.keys(data).length > 1,
          response: data,
          summary: data['Error Message'] ? 'Error: ' + data['Error Message'] : 
                  data['Note'] ? 'Rate Limited' :
                  Object.keys(data).length > 1 ? 'SUCCESS - Has Options Data!' : 'No data returned'
        });
        
        // Add delay between requests to avoid rate limiting
        if (i < optionsEndpoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (error) {
        results.push({
          endpoint: `Endpoint ${i + 1}`,
          function: optionsEndpoints[i].split('function=')[1].split('&')[0],
          status: 'Error',
          hasData: false,
          error: error.message,
          summary: 'Request failed'
        });
      }
    }

    // Check if any endpoint returned valid options data
    const workingEndpoints = results.filter(r => r.hasData);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        symbol: testSymbol,
        timestamp: new Date().toISOString(),
        summary: {
          totalEndpointsTested: results.length,
          workingEndpoints: workingEndpoints.length,
          hasOptionsAccess: workingEndpoints.length > 0,
          recommendation: workingEndpoints.length > 0 ? 
            'SUCCESS! You have options data access. Check the working endpoints below.' :
            'No options endpoints found. You may need to upgrade your Alpha Vantage plan or contact support.'
        },
        workingEndpoints: workingEndpoints,
        allResults: results,
        nextSteps: workingEndpoints.length > 0 ? [
          'Create a new function to fetch options data using the working endpoint',
          'Modify your stock-data function to also fetch options prices',
          'Update your app to display real options prices alongside stock prices'
        ] : [
          'Contact Alpha Vantage support to ask about options data access',
          'Check if your plan includes options data entitlements',
          'Consider upgrading to a plan that includes options data'
        ]
      })
    };

  } catch (error) {
    console.error('Options test error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Unable to test options data: ${error.message}`,
        suggestion: 'Check Alpha Vantage API key and network connection'
      })
    };
  }
};