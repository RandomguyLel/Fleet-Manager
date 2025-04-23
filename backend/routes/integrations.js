// API endpoints for third-party integrations
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const router = express.Router();

// Store user sessions temporarily (in a real app, use a database or Redis)
const userSessions = {};

// Helper function to log request details
const logRequest = (method, url, headers, body) => {
  console.log('\n==== REQUEST DETAILS ====');
  console.log(`${method} ${url}`);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  if (body) {
    console.log('Body:', typeof body === 'string' ? body : JSON.stringify(body, null, 2));
  }
  console.log('========================\n');
};

// Helper function to log response details
const logResponse = (url, status, headers, body) => {
  console.log('\n==== RESPONSE DETAILS ====');
  console.log(`Response from: ${url}`);
  console.log(`Status: ${status}`);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  if (body) {
    const bodyPreview = typeof body === 'string' 
      ? (body.length > 1000 ? body.substring(0, 100000) + '... (truncated)' : body)
      : JSON.stringify(body, null, 2);
    console.log('Body preview:', bodyPreview);
  }
  console.log('=========================\n');
};

// e.csdd.lv integration endpoints
router.post('/csdd/connect', async (req, res) => {
  try {
    const { email, password, userId = 'default' } = req.body;
    
    console.log(`[${new Date().toISOString()}] Attempting to connect to e.csdd.lv with email: ${email}`);
    
    if (!email || !password) {
      console.log(`[${new Date().toISOString()}] Connection attempt failed: Missing email or password`);
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Make a real request to e.csdd.lv
    try {
      const requestUrl = 'https://e.csdd.lv/login/?action=doLogin';
      const requestBody = `email=${encodeURIComponent(email)}&psw=${encodeURIComponent(password)}`; //&longses=1 could be added for long session
      const requestHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      };
      
      // Log request details
      logRequest('POST', requestUrl, requestHeaders, requestBody);
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
        redirect: 'manual',
      });

      // Get cookies from response
      const cookies = response.headers.get('set-cookie');
      const isSuccess = cookies && (cookies.includes('eSign') || cookies.includes('PHPSESSID'));
      
      // Also check if we were redirected to the dashboard (success) or back to login (failure)
      const location = response.headers.get('location');
      const isRedirectSuccess = location && !location.includes('login');
      
      // Log response details
      logResponse(
        requestUrl, 
        response.status, 
        Object.fromEntries([...response.headers.entries()]), 
        `Cookies: ${cookies || 'none'}, Location: ${location || 'none'}`
      );
      
      if (isSuccess || isRedirectSuccess) {
        // Extract and store cookies
        const cookieHeader = response.headers.get('set-cookie');
        const cookieArray = cookieHeader ? cookieHeader.split(',').map(cookie => cookie.split(';')[0].trim()) : [];
        
        console.log(`[${new Date().toISOString()}] Login successful, cookies received:`, cookieArray);
        
        // Make a follow-up request to get user info from the dashboard
        const dashboardUrl = 'https://e.csdd.lv/';
        // Log dashboard request
        logRequest('GET', dashboardUrl, {
          'Cookie': cookieArray.join('; '),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        });
        const dashboardResponse = await fetch(dashboardUrl, {
          headers: {
            'Cookie': cookieArray.join('; '),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
          }
        });
        const dashboardHtml = await dashboardResponse.text();
        // Log dashboard response
        logResponse(
          dashboardUrl, 
          dashboardResponse.status, 
          Object.fromEntries([...dashboardResponse.headers.entries()]),
          dashboardHtml.substring(0) + '... (truncated)'
        );
        // Extract user name from dashboard HTML
        let firstName = 'Unknown';
        let lastName = 'User';
        // Look for <h4 class="capitalize">Full Name</h4>
        const h4Match = dashboardHtml.match(/<h4 class="capitalize">(.*?)<\/h4>/i);
        if (h4Match && h4Match[1]) {
          const fullName = h4Match[1].trim();
          const nameParts = fullName.split(' ');
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else {
            firstName = fullName;
          }
          console.log(`[${new Date().toISOString()}] Extracted user name from dashboard:`, fullName);
        } else {
          console.log(`[${new Date().toISOString()}] Could not extract user name from dashboard HTML`);
        }
        
        console.log(`[${new Date().toISOString()}] Extracted user info:`, { firstName, lastName });
        
        // Store session for future requests
        userSessions[userId] = {
          cookies: cookieArray.join('; '),
          timestamp: Date.now(),
          userInfo: { firstName, lastName }
        };
        
        console.log(`[${new Date().toISOString()}] Session stored for user ID: ${userId}`);
        
        return res.json({
          success: true,
          message: 'Successfully connected to e.csdd.lv',
          userInfo: { firstName, lastName }
        });
      } else {
        console.log(`[${new Date().toISOString()}] Login failed: Invalid credentials or connection failed`);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials or connection failed'
        });
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] CSDD request error:`, error);
      return res.status(500).json({
        success: false,
        message: `API request failed: ${error.message}`
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error connecting to CSDD:`, error);
    return res.status(500).json({
      success: false,
      message: `Connection failed: ${error.message}`
    });
  }
});

// Get user session if exists
router.get('/csdd/session/:userId', async (req, res) => {
  const { userId = 'default' } = req.params;
  
  console.log(`[${new Date().toISOString()}] Checking session for user ID: ${userId}`);
  
  if (userSessions[userId]) {
    // Check if session is still valid (less than 1 hour old)
    const sessionAge = Date.now() - userSessions[userId].timestamp;
    const isSessionValid = sessionAge < 3600000;
    
    console.log(`[${new Date().toISOString()}] Session found for user ID: ${userId}`);
    console.log(`[${new Date().toISOString()}] Session age: ${Math.round(sessionAge/1000)} seconds`);
    console.log(`[${new Date().toISOString()}] Session valid: ${isSessionValid}`);
    
    if (isSessionValid) {
      return res.json({
        success: true,
        connected: true,
        userInfo: userSessions[userId].userInfo
      });
    } else {
      // Session expired
      console.log(`[${new Date().toISOString()}] Session expired for user ID: ${userId}, removing...`);
      delete userSessions[userId];
    }
  } else {
    console.log(`[${new Date().toISOString()}] No session found for user ID: ${userId}`);
  }
  
  return res.json({
    success: true,
    connected: false
  });
});

// Logout from CSDD
router.post('/csdd/disconnect/:userId', async (req, res) => {
  const { userId = 'default' } = req.params;
  
  console.log(`[${new Date().toISOString()}] Disconnecting session for user ID: ${userId}`);
  
  if (userSessions[userId]) {
    delete userSessions[userId];
    console.log(`[${new Date().toISOString()}] Session removed for user ID: ${userId}`);
  } else {
    console.log(`[${new Date().toISOString()}] No session found for user ID: ${userId} to disconnect`);
  }
  
  return res.json({
    success: true,
    message: 'Disconnected from e.csdd.lv'
  });
});

// Get vehicle details by registration number
router.get('/csdd/vehicle/:registrationNumber', async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    const { userId = 'default' } = req.query;
    
    console.log(`[${new Date().toISOString()}] Fetching details for vehicle: ${registrationNumber} with user ID: ${userId}`);
    
    // Check if user has an active session
    if (!userSessions[userId]) {
      console.log(`[${new Date().toISOString()}] No active session found for user ID: ${userId}`);
      return res.status(401).json({
        success: false,
        message: 'No active session. Please connect to e.csdd.lv first.'
      });
    }
    
    try {
      // Make a real request to e.csdd.lv to search for the vehicle
      // Use the new URL and remove dashes from the registration number
      const searchUrl = `https://e.csdd.lv/tadati?rn=${encodeURIComponent(registrationNumber.replace(/-/g, ''))}`;
      const headers = {
        'Cookie': userSessions[userId].cookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      };
      
      // Log request
      logRequest('GET', searchUrl, headers);
      
      const searchResponse = await fetch(searchUrl, { headers });
      
      const searchHtml = await searchResponse.text();
      
      // Log response
      logResponse(
        searchUrl, 
        searchResponse.status, 
        Object.fromEntries([...searchResponse.headers.entries()]),
        searchHtml.substring(0) + '... (truncated)'
      );
      
      // Use cheerio to parse the HTML and extract values
      const $ = cheerio.load(searchHtml);
      let vehicleData = {
        success: true,
        registrationNumber
      };
      // Find the first #refer-table in the first accordion section (Tehniskie dati)
      let found = 0;
      $('div.accordion section').first().find('table#refer-table tr').each((i, el) => {
        const tds = $(el).find('td');
        if (tds.length === 2) {
          const label = $(tds[0]).text().replace(/\s|\u00a0/g, '').replace(':', '');
          const value = $(tds[1]).text().trim();
          if (label.includes('Marka,modelis')) {
            const parts = value.split(' ');
            vehicleData.make = parts[0];
            vehicleData.model = parts.slice(1).join(' ');
            found++;
            console.log('cheerio make/model:', value);
          }
          if (label.includes('Pirmāsreģistrācijasdatums')) {
            const yearMatch = value.match(/(\d{4})/);
            if (yearMatch) {
              vehicleData.year = parseInt(yearMatch[1], 10);
              found++;
            }
            console.log('cheerio regDate:', value);
          }
          if (label.includes('Odometra rādījums') || label.includes('Odometrarādījums')) {
            const mileageMatch = value.replace(/\s/g, '').match(/(\d+)/);
            if (mileageMatch) {
              vehicleData.mileage = parseInt(mileageMatch[1], 10);
              found++;
            }
            console.log('cheerio mileage:', value);
          }
          if (label.includes('Nākamāsapskatesdatums') || label.includes('Nākamās apskates datums')) {
            // Extract the road worthiness date (format: DD.MM.YYYY)
            vehicleData.roadWorthinessDate = value.trim();
            found++;
            console.log('cheerio roadWorthinessDate:', value);
          }
        }
      });
      // If we couldn't extract any data, return an error instead of mock data
      if (!found) {
        console.log(`[${new Date().toISOString()}] Could not extract vehicle data from CSDD using cheerio, returning error`);
        return res.status(502).json({
          success: false,
          message: 'Could not extract vehicle data from CSDD. The page structure may have changed or the vehicle does not exist.'
        });
      }
      console.log(`[${new Date().toISOString()}] Returning vehicle data (cheerio):`, vehicleData);
      return res.json(vehicleData);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] CSDD vehicle data request error:`, error);
      return res.status(500).json({
        success: false,
        message: `API request failed: ${error.message}`
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching vehicle data:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve vehicle data: ${error.message}`
    });
  }
});

module.exports = router;