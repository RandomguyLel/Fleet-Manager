// API endpoints for third-party integrations
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const bcrypt = require('bcrypt');
const db = require('../db');
const { createAuditLog } = require('../audit-logger');
const { authenticateToken } = require('./auth');
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
    const { email, password, userId = '${currentUser.id}' } = req.body;
    
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
  const { userId = '${currentUser.id}' } = req.params;
  
  console.log(`[${new Date().toISOString()}] Checking session for user ID: ${userId}`);
  
  if (userSessions[userId]) {
    // Check if session is still valid (less than 6 hours old)
    const sessionAge = Date.now() - userSessions[userId].timestamp;
    const isSessionValid = sessionAge < 21600000;
    
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
  const { userId = '${currentUser.id}' } = req.params;
  
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
    const { userId = '${currentUser.id}' } = req.query;
    
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
          // Look for Registration Certificate Number (stored in the regaplnr field)
          if (label.includes('Reģistrācijasapliecībasnumurs') || label.includes('Reģistrācijas apliecības numurs')) {
            vehicleData.regaplnr = value.trim();
            found++;
            console.log('cheerio registrationCertificateNumber:', value);
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

// Get insurance info from manapolise.lv
router.get('/insurance/:registrationNumber/:regaplnr', async (req, res) => {
  try {
    const { registrationNumber, regaplnr } = req.params;
    
    console.log(`[${new Date().toISOString()}] Fetching insurance info for vehicle: ${registrationNumber} with cert number: ${regaplnr}`);
    
    // Remove any dashes or spaces from both numbers
    const cleanRegNumber = registrationNumber.replace(/[-\s]/g, '');
    const cleanCertNumber = regaplnr.replace(/[-\s]/g, '');
    
    try {
      // First, make a request to the main calculator page to get necessary cookies/session
      const mainUrl = `https://www.manapolise.lv/lv/octa/calculator/?octa_step=-1&promotion_code=&octa_vehiclenr=${cleanRegNumber}&octa_regnr=${cleanCertNumber}&octa_period=1`;
      
      console.log(`[${new Date().toISOString()}] Making initial request to: ${mainUrl}`);
      
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };
      
      // Log request
      logRequest('GET', mainUrl, headers);
      
      const mainResponse = await fetch(mainUrl, { headers });
      
      // Get cookies that will be needed for subsequent requests
      const cookies = mainResponse.headers.get('set-cookie') || '';
      let sessionCookies = '';
      
      if (cookies) {
        // Extract the session cookie using regex
        const cookieRegex = /(MANA_POLISE_SESSION_ID=[^;]+)/;
        const match = cookies.match(cookieRegex);
        if (match) {
          sessionCookies = match[1];
          console.log(`[${new Date().toISOString()}] Extracted session cookie: ${sessionCookies}`);
        }
        
        // Add the octa cookie with vehicle info
        sessionCookies += `; octa=${cleanRegNumber}%2C${cleanCertNumber}; language=lv`;
      }
      
      // Wait a bit to simulate the page loading
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Now make a POST request to the connector endpoint
      const connectorUrl = 'https://www.manapolise.lv/lv/octa/connector/';
      
      // Generate a random transId similar to what the website would use
      const transId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Create the payload as per the observed request
      const payload = new URLSearchParams({
        'octa_step': 'last_date',
        'octa_regnr': cleanCertNumber,
        'octa_vehiclenr': cleanRegNumber,
        'transId': transId
      }).toString();
      
      // Set up the headers for the POST request
      const postHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://www.manapolise.lv',
        'Referer': mainUrl,
        'Cookie': sessionCookies
      };
      
      console.log(`[${new Date().toISOString()}] Making POST request to connector: ${connectorUrl}`);
      console.log(`[${new Date().toISOString()}] Payload: ${payload}`);
      
      // Log the connector request
      logRequest('POST', connectorUrl, postHeaders, payload);
      
      const connectorResponse = await fetch(connectorUrl, {
        method: 'POST',
        headers: postHeaders,
        body: payload
      });
      
      // Get the JSON response
      let connectorData = null;
      try {
        connectorData = await connectorResponse.json();
        
        // Log the connector response
        logResponse(
          connectorUrl,
          connectorResponse.status,
          Object.fromEntries([...connectorResponse.headers.entries()]),
          JSON.stringify(connectorData)
        );
        
        console.log(`[${new Date().toISOString()}] Connector response data:`, connectorData);
      } catch (e) {
        console.error(`[${new Date().toISOString()}] Error parsing connector response:`, e);
        
        // Try to get the text response if JSON parsing fails
        const text = await connectorResponse.text();
        logResponse(
          connectorUrl,
          connectorResponse.status,
          Object.fromEntries([...connectorResponse.headers.entries()]),
          text
        );
      }
      
      // Extract the date from the connector response
      let lastPolicyDate = null;
      
      if (connectorData && connectorData.lastDate) {
        lastPolicyDate = connectorData.lastDate;
        console.log(`[${new Date().toISOString()}] Found policy date in connector response: ${lastPolicyDate}`);
      }
      
      // If we couldn't get the date from the connector, fall back to HTML scraping as a last resort
      if (!lastPolicyDate) {
        console.log(`[${new Date().toISOString()}] Connector didn't provide a date, falling back to HTML scraping`);
        
        // Get the full page HTML
        const htmlResponse = await fetch(mainUrl, { headers });
        const html = await htmlResponse.text();
        
        // Use cheerio to look for the date
        const $ = cheerio.load(html);
        lastPolicyDate = $('#octaLastPolicyDate').text().trim();
        
        // If still no date, try three more times with delays
        if (!lastPolicyDate || lastPolicyDate.includes('loading')) {
          for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`[${new Date().toISOString()}] Attempt ${attempt} to get policy date through HTML scraping`);
            
            // Wait for 5 seconds
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Fetch the page again
            const retryResponse = await fetch(mainUrl, { headers });
            const retryHtml = await retryResponse.text();
            
            const $retry = cheerio.load(retryHtml);
            lastPolicyDate = $retry('#octaLastPolicyDate').text().trim();
            
            if (lastPolicyDate && !lastPolicyDate.includes('loading')) {
              console.log(`[${new Date().toISOString()}] Found policy date in HTML on retry ${attempt}: ${lastPolicyDate}`);
              break;
            }
          }
        }
      }
      
      // Parse the date if found
      let insuranceData = { success: false };
      
      if (lastPolicyDate && !lastPolicyDate.includes('loading')) {
        console.log(`[${new Date().toISOString()}] Raw policy date extracted: "${lastPolicyDate}"`);
        
        // Remove any non-date characters (sometimes there might be extra text)
        lastPolicyDate = lastPolicyDate.replace(/[^0-9\.\-]/g, '').trim();
        
        // Convert the date format if needed
        let parsedDate = null;
        
        // Try different date formats
        const dateFormats = [
          // DD.MM.YYYY
          /(\d{2})\.(\d{2})\.(\d{4})/,
          // YYYY-MM-DD
          /(\d{4})-(\d{2})-(\d{2})/,
          // YYYY.MM.DD
          /(\d{4})\.(\d{2})\.(\d{2})/
        ];
        
        for (const format of dateFormats) {
          const match = lastPolicyDate.match(format);
          if (match) {
            if (format === dateFormats[0]) {
              // DD.MM.YYYY -> YYYY-MM-DD
              parsedDate = `${match[3]}-${match[2]}-${match[1]}`;
            } else if (format === dateFormats[1]) {
              // Already in YYYY-MM-DD format
              parsedDate = lastPolicyDate;
            } else if (format === dateFormats[2]) {
              // YYYY.MM.DD -> YYYY-MM-DD
              parsedDate = `${match[1]}-${match[2]}-${match[3]}`;
            }
            break;
          }
        }
        
        if (parsedDate) {
          // Calculate the renewal date (usually 1 year after the policy date)
          const policyDate = new Date(parsedDate);
          const renewalDate = new Date(policyDate);
          renewalDate.setFullYear(renewalDate.getFullYear() + 1);
          
          // Format as YYYY-MM-DD
          const formattedRenewalDate = renewalDate.toISOString().split('T')[0];
          
          insuranceData = {
            success: true,
            lastPolicyDate: parsedDate,
            renewalDate: formattedRenewalDate
          };
          
          console.log(`[${new Date().toISOString()}] Successfully extracted insurance data:`, insuranceData);
        } else {
          console.log(`[${new Date().toISOString()}] Could not parse date: ${lastPolicyDate}`);
        }
      } else {
        console.log(`[${new Date().toISOString()}] No valid policy date found`);
      }
      
      return res.json(insuranceData);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error fetching insurance data:`, error);
      return res.status(500).json({
        success: false,
        message: `Error fetching insurance data: ${error.message}`
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in insurance info endpoint:`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

// Save CSDD credentials for the current user
router.post('/csdd/credentials', authenticateToken, async (req, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.user.id;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Check if user already has saved credentials
    const existingCredentials = await db.query(
      'SELECT * FROM user_csdd_credentials WHERE user_id = $1',
      [userId]
    );

    if (existingCredentials.rows.length > 0) {
      // Update existing credentials
      await db.query(
        `UPDATE user_csdd_credentials 
         SET email = $1, password_hash = $2, updated_at = NOW()
         WHERE user_id = $3`,
        [email, passwordHash, userId]
      );
    } else {
      // Insert new credentials
      await db.query(
        `INSERT INTO user_csdd_credentials (user_id, email, password_hash)
         VALUES ($1, $2, $3)`,
        [userId, email, passwordHash]
      );
    }

    // Create audit log
    await createAuditLog({
      user_id: userId,
      username: req.user.username,
      action: existingCredentials.rows.length > 0 ? 'Update' : 'Create',
      page: 'System Settings',
      field: 'csdd_credentials',
      new_value: JSON.stringify({ email }),
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'CSDD credentials saved successfully'
    });
  } catch (error) {
    console.error('Error saving CSDD credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save CSDD credentials'
    });
  }
});

// Get saved CSDD credentials for the current user
router.get('/csdd/credentials', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT email FROM user_csdd_credentials WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        hasCredentials: false
      });
    }

    res.json({
      success: true,
      hasCredentials: true,
      email: result.rows[0].email
    });
  } catch (error) {
    console.error('Error getting CSDD credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get CSDD credentials'
    });
  }
});

// Delete saved CSDD credentials for the current user
router.delete('/csdd/credentials', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'DELETE FROM user_csdd_credentials WHERE user_id = $1 RETURNING email',
      [userId]
    );

    if (result.rows.length > 0) {
      // Create audit log
      await createAuditLog({
        user_id: userId,
        username: req.user.username,
        action: 'Delete',
        page: 'System Settings',
        field: 'csdd_credentials',
        old_value: JSON.stringify({ email: result.rows[0].email }),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
    }

    res.json({
      success: true,
      message: 'CSDD credentials deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting CSDD credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete CSDD credentials'
    });
  }
});

// Get all vehicles from CSDD
router.get('/csdd/vehicles', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has an active session
    if (!userSessions[userId]) {
      return res.status(401).json({
        success: false,
        message: 'No active session. Please connect to e.csdd.lv first.'
      });
    }

    try {
      // Make a request to the vehicle list page
      const vehiclesUrl = 'https://e.csdd.lv/tldati/';
      const headers = {
        'Cookie': userSessions[userId].cookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      };

      // Log request
      logRequest('GET', vehiclesUrl, headers);

      const response = await fetch(vehiclesUrl, { headers });
      const html = await response.text();

      // Log response
      logResponse(
        vehiclesUrl,
        response.status,
        Object.fromEntries([...response.headers.entries()]),
        html.substring(0) + '... (truncated)'
      );

      // Use cheerio to parse the HTML and extract vehicle data
      const $ = cheerio.load(html);
      const vehicles = [];

      // Find all vehicle rows in the table
      $('#vehicles-table tbody tr.tr-data').each((i, el) => {
        const $row = $(el);
        const status = $row.find('td.collapse-mobile.translate').text().trim();
        
        // Only include vehicles that are "Uzskaitē" (registered)
        if (status === 'Uzskaitē') {
          const tds = $row.find('td');
          if (tds.length >= 6) {
            const vehicle = {
              id: $row.attr('value'), // License plate number
              make: $(tds[2]).text().trim(), // Make/Model
              regaplnr: $(tds[3]).text().trim(), // Registration number
              type: $(tds[4]).text().trim(), // Vehicle type
              status: status
            };
            vehicles.push(vehicle);
          }
        }
      });

      console.log(`[${new Date().toISOString()}] Found ${vehicles.length} registered vehicles`);
      
      return res.json({
        success: true,
        vehicles
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error fetching vehicles from CSDD:`, error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch vehicles: ${error.message}`
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in vehicles endpoint:`, error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

module.exports = router;