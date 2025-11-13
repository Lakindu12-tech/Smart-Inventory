/**
 * COMPREHENSIVE SMART INVENTORY SYSTEM TEST
 * ==========================================
 * This script tests ALL functionalities of the Smart Inventory System
 * 
 * Tests Include:
 * 1. Authentication System (Login, Token Verification)
 * 2. User Management (Create, Read, Update, Password Change)
 * 3. Product Management (CRUD operations, Image Upload)
 * 4. Stock Management (Stock Movements, Approvals)
 * 5. Customer Management (CRUD operations)
 * 6. Sales/Billing System (Create transactions, View sales)
 * 7. Product Requests (Create, Approve, Reject)
 * 8. Reports System (Owner, Storekeeper, Cashier views)
 * 9. Analytics Dashboard
 * 10. Role-Based Access Control
 */

const mysql = require('mysql2/promise');
const fetch = require('node-fetch');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'lakindu',
  database: 'smart_inventory'
};

const BASE_URL = 'http://localhost:3000';

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper Functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

function logTest(testName) {
  log(`\n📋 Testing: ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
  testResults.passed++;
}

function logError(message, error = null) {
  log(`❌ ${message}`, 'red');
  if (error) {
    log(`   Error: ${error.message || error}`, 'red');
  }
  testResults.failed++;
  testResults.errors.push({ test: message, error: error?.message || error });
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
  testResults.skipped++;
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

async function makeRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Test Suite Variables (will be populated during tests)
let ownerToken = null;
let cashierToken = null;
let storekeeperToken = null;
let testProductId = null;
let testCustomerId = null;
let testTransactionId = null;
let testStockMovementId = null;
let testProductRequestId = null;

// =============================================================================
// TEST SUITE 1: AUTHENTICATION & AUTHORIZATION
// =============================================================================

async function testAuthenticationSystem() {
  logSection('TEST SUITE 1: AUTHENTICATION & AUTHORIZATION');
  testResults.total++;

  try {
    // Test 1.1: Login with Owner credentials
    logTest('1.1 - Owner Login');
    const ownerLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'owner@smart.lk',
        password: 'owner123'
      })
    });

    if (ownerLogin.ok && ownerLogin.data.token) {
      ownerToken = ownerLogin.data.token;
      logSuccess(`Owner login successful. Token received.`);
      logInfo(`Role: ${ownerLogin.data.role}, Name: ${ownerLogin.data.name}`);
    } else {
      logError('Owner login failed', ownerLogin.data);
    }

    // Test 1.2: Login with Cashier credentials
    logTest('1.2 - Cashier Login');
    const cashierLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'cashier@smart.lk',
        password: 'cashier123'
      })
    });

    if (cashierLogin.ok && cashierLogin.data.token) {
      cashierToken = cashierLogin.data.token;
      logSuccess(`Cashier login successful. Token received.`);
      logInfo(`Role: ${cashierLogin.data.role}, Name: ${cashierLogin.data.name}`);
    } else {
      logError('Cashier login failed', cashierLogin.data);
    }

    // Test 1.3: Login with Storekeeper credentials
    logTest('1.3 - Storekeeper Login');
    const storekeeperLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'storekeeper@smart.lk',
        password: 'store123'
      })
    });

    if (storekeeperLogin.ok && storekeeperLogin.data.token) {
      storekeeperToken = storekeeperLogin.data.token;
      logSuccess(`Storekeeper login successful. Token received.`);
      logInfo(`Role: ${storekeeperLogin.data.role}, Name: ${storekeeperLogin.data.name}`);
    } else {
      logError('Storekeeper login failed', storekeeperLogin.data);
    }

    // Test 1.4: Test invalid login
    logTest('1.4 - Invalid Login Attempt');
    const invalidLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid@test.com',
        password: 'wrongpassword'
      })
    });

    if (!invalidLogin.ok && invalidLogin.status === 401) {
      logSuccess('Invalid login correctly rejected');
    } else {
      logError('Invalid login should have been rejected');
    }

    // Test 1.5: Test unauthorized access
    logTest('1.5 - Unauthorized Access (No Token)');
    const unauthorizedAccess = await makeRequest('/api/products');

    if (unauthorizedAccess.ok) {
      logSuccess('Products endpoint is public (no auth required)');
    } else {
      logWarning('Products endpoint requires authentication');
    }

  } catch (error) {
    logError('Authentication system test failed', error);
  }
}

// =============================================================================
// TEST SUITE 2: USER MANAGEMENT
// =============================================================================

async function testUserManagement() {
  logSection('TEST SUITE 2: USER MANAGEMENT');
  testResults.total++;

  try {
    // Test 2.1: Get all users (Owner only)
    logTest('2.1 - Get All Users (Owner)');
    const users = await makeRequest('/api/users', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    if (users.ok && Array.isArray(users.data)) {
      logSuccess(`Retrieved ${users.data.length} users`);
      logInfo(`Users: ${users.data.map(u => `${u.name} (${u.role})`).join(', ')}`);
    } else {
      logError('Failed to retrieve users', users.data);
    }

    // Test 2.2: Cashier trying to access users (should fail)
    logTest('2.2 - Role-Based Access Control (Cashier accessing users)');
    const cashierAccessUsers = await makeRequest('/api/users', {
      headers: { Authorization: `Bearer ${cashierToken}` }
    });

    if (!cashierAccessUsers.ok && cashierAccessUsers.status === 403) {
      logSuccess('Cashier correctly denied access to user management');
    } else {
      logError('Cashier should not have access to user management');
    }

    // Test 2.3: Create new user (Owner only)
    logTest('2.3 - Create New User');
    const newUser = await makeRequest('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        name: 'Test User ' + Date.now(),
        email: `testuser${Date.now()}@test.com`,
        password: 'testpass123',
        role: 'cashier'
      })
    });

    if (newUser.ok) {
      logSuccess('New user created successfully');
      logInfo(`User ID: ${newUser.data.id || 'N/A'}`);
    } else {
      logError('Failed to create new user', newUser.data);
    }

    // Test 2.4: Change Password
    logTest('2.4 - Change Password');
    const passwordChange = await makeRequest('/api/users/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({
        currentPassword: 'cashier123',
        newPassword: 'cashier123' // Keep same for testing
      })
    });

    if (passwordChange.ok) {
      logSuccess('Password change successful');
    } else {
      logError('Password change failed', passwordChange.data);
    }

  } catch (error) {
    logError('User management test failed', error);
  }
}

// =============================================================================
// TEST SUITE 3: PRODUCT MANAGEMENT
// =============================================================================

async function testProductManagement() {
  logSection('TEST SUITE 3: PRODUCT MANAGEMENT');
  testResults.total++;

  try {
    // Test 3.1: Get all products
    logTest('3.1 - Get All Products');
    const products = await makeRequest('/api/products');

    if (products.ok && Array.isArray(products.data)) {
      logSuccess(`Retrieved ${products.data.length} products`);
      if (products.data.length > 0) {
        testProductId = products.data[0].id;
        logInfo(`Sample: ${products.data[0].name} - Rs.${products.data[0].price} (Stock: ${products.data[0].current_stock || products.data[0].stock})`);
      }
    } else {
      logError('Failed to retrieve products', products.data);
    }

    // Test 3.2: Create new product (Owner/Storekeeper)
    logTest('3.2 - Create New Product');
    const newProduct = await makeRequest('/api/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${storekeeperToken}` },
      body: JSON.stringify({
        name: `Test Product ${Date.now()}`,
        price: 500.00,
        stock: 100,
        category: 'Electronics'
      })
    });

    if (newProduct.ok) {
      testProductId = newProduct.data.id || newProduct.data.productId;
      logSuccess(`New product created successfully (ID: ${testProductId})`);
    } else {
      logError('Failed to create new product', newProduct.data);
    }

    // Test 3.3: Update product
    if (testProductId) {
      logTest('3.3 - Update Product');
      const updateProduct = await makeRequest(`/api/products/${testProductId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${storekeeperToken}` },
        body: JSON.stringify({
          name: `Updated Product ${Date.now()}`,
          price: 550.00
        })
      });

      if (updateProduct.ok) {
        logSuccess('Product updated successfully');
      } else {
        logError('Failed to update product', updateProduct.data);
      }
    } else {
      logWarning('Skipping product update test (no product ID)');
    }

    // Test 3.4: Get single product
    if (testProductId) {
      logTest('3.4 - Get Single Product Details');
      const singleProduct = await makeRequest(`/api/products/${testProductId}`);

      if (singleProduct.ok) {
        logSuccess('Single product retrieved successfully');
        logInfo(`Product: ${singleProduct.data.name} - Rs.${singleProduct.data.price}`);
      } else {
        logError('Failed to retrieve single product', singleProduct.data);
      }
    }

  } catch (error) {
    logError('Product management test failed', error);
  }
}

// =============================================================================
// TEST SUITE 4: STOCK MANAGEMENT
// =============================================================================

async function testStockManagement() {
  logSection('TEST SUITE 4: STOCK MANAGEMENT');
  testResults.total++;

  try {
    // Test 4.1: Get stock levels
    logTest('4.1 - Get Stock Levels');
    const stock = await makeRequest('/api/stock', {
      headers: { Authorization: `Bearer ${storekeeperToken}` }
    });

    if (stock.ok && Array.isArray(stock.data)) {
      logSuccess(`Retrieved stock data for ${stock.data.length} products`);
    } else {
      logError('Failed to retrieve stock levels', stock.data);
    }

    // Test 4.2: Get stock with movements
    logTest('4.2 - Get Stock with Movement History');
    const stockWithMovements = await makeRequest('/api/stock?movements=true', {
      headers: { Authorization: `Bearer ${storekeeperToken}` }
    });

    if (stockWithMovements.ok && Array.isArray(stockWithMovements.data)) {
      logSuccess('Stock with movement history retrieved');
      const withMovements = stockWithMovements.data.filter(p => p.movements && p.movements.length > 0);
      logInfo(`${withMovements.length} products have movement history`);
    } else {
      logError('Failed to retrieve stock with movements', stockWithMovements.data);
    }

    // Test 4.3: Create stock movement (IN)
    if (testProductId) {
      logTest('4.3 - Create Stock Movement (IN)');
      const stockIn = await makeRequest('/api/stock', {
        method: 'POST',
        headers: { Authorization: `Bearer ${storekeeperToken}` },
        body: JSON.stringify({
          product_id: testProductId,
          movement_type: 'in',
          quantity: 50,
          reason: 'Test stock in movement'
        })
      });

      if (stockIn.ok) {
        testStockMovementId = stockIn.data.movement_id || stockIn.data.id;
        logSuccess(`Stock IN movement created (ID: ${testStockMovementId})`);
      } else {
        logError('Failed to create stock IN movement', stockIn.data);
      }
    }

    // Test 4.4: Approve stock movement (Owner)
    if (testStockMovementId) {
      logTest('4.4 - Approve Stock Movement');
      const approveStock = await makeRequest(`/api/stock/${testStockMovementId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` }
      });

      if (approveStock.ok) {
        logSuccess('Stock movement approved successfully');
      } else {
        logError('Failed to approve stock movement', approveStock.data);
      }
    }

    // Test 4.5: Get low stock products
    logTest('4.5 - Get Low Stock Products');
    const lowStock = await makeRequest('/api/stock?status=low', {
      headers: { Authorization: `Bearer ${storekeeperToken}` }
    });

    if (lowStock.ok && Array.isArray(lowStock.data)) {
      const lowStockCount = lowStock.data.filter(p => {
        const stock = p.current_stock || p.stock || 0;
        return stock > 0 && stock <= 10;
      }).length;
      logSuccess(`Found ${lowStockCount} low stock products`);
    } else {
      logError('Failed to retrieve low stock products', lowStock.data);
    }

  } catch (error) {
    logError('Stock management test failed', error);
  }
}

// =============================================================================
// TEST SUITE 5: CUSTOMER MANAGEMENT
// =============================================================================

async function testCustomerManagement() {
  logSection('TEST SUITE 5: CUSTOMER MANAGEMENT');
  testResults.total++;

  try {
    // Test 5.1: Get all customers
    logTest('5.1 - Get All Customers');
    const customers = await makeRequest('/api/customers', {
      headers: { Authorization: `Bearer ${cashierToken}` }
    });

    if (customers.ok && Array.isArray(customers.data)) {
      logSuccess(`Retrieved ${customers.data.length} customers`);
      if (customers.data.length > 0) {
        testCustomerId = customers.data[0].id;
        logInfo(`Sample: ${customers.data[0].name} - ${customers.data[0].phone}`);
      }
    } else {
      logError('Failed to retrieve customers', customers.data);
    }

    // Test 5.2: Create new customer
    logTest('5.2 - Create New Customer');
    const newCustomer = await makeRequest('/api/customers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({
        name: `Test Customer ${Date.now()}`,
        phone: '0771234567',
        email: `customer${Date.now()}@test.com`,
        address: 'Test Address, Colombo'
      })
    });

    if (newCustomer.ok) {
      testCustomerId = newCustomer.data.id || newCustomer.data.customerId;
      logSuccess(`New customer created (ID: ${testCustomerId})`);
    } else {
      logError('Failed to create customer', newCustomer.data);
    }

    // Test 5.3: Update customer
    if (testCustomerId) {
      logTest('5.3 - Update Customer');
      const updateCustomer = await makeRequest(`/api/customers/${testCustomerId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify({
          name: `Updated Customer ${Date.now()}`,
          phone: '0779876543'
        })
      });

      if (updateCustomer.ok) {
        logSuccess('Customer updated successfully');
      } else {
        logError('Failed to update customer', updateCustomer.data);
      }
    }

  } catch (error) {
    logError('Customer management test failed', error);
  }
}

// =============================================================================
// TEST SUITE 6: SALES & BILLING SYSTEM
// =============================================================================

async function testSalesBillingSystem() {
  logSection('TEST SUITE 6: SALES & BILLING SYSTEM');
  testResults.total++;

  try {
    // Test 6.1: Get sales data (products for billing)
    logTest('6.1 - Get Sales Data (Products)');
    const salesData = await makeRequest('/api/sales', {
      headers: { Authorization: `Bearer ${cashierToken}` }
    });

    if (salesData.ok && salesData.data.products) {
      logSuccess(`Retrieved ${salesData.data.products.length} products for sale`);
    } else {
      logError('Failed to retrieve sales data', salesData.data);
    }

    // Test 6.2: Get recent transactions
    logTest('6.2 - Get Recent Transactions');
    const transactions = await makeRequest('/api/sales?transactions=true', {
      headers: { Authorization: `Bearer ${cashierToken}` }
    });

    if (transactions.ok && transactions.data.transactions) {
      logSuccess(`Retrieved ${transactions.data.transactions.length} recent transactions`);
      if (transactions.data.transactions.length > 0) {
        testTransactionId = transactions.data.transactions[0].id;
        logInfo(`Latest: ${transactions.data.transactions[0].transaction_number} - Rs.${transactions.data.transactions[0].total_amount}`);
      }
    } else {
      logError('Failed to retrieve transactions', transactions.data);
    }

    // Test 6.3: Create a sale transaction
    if (testProductId) {
      logTest('6.3 - Create New Sale Transaction');
      const newSale = await makeRequest('/api/sales', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify({
          items: [
            {
              product_id: testProductId,
              quantity: 2,
              unit_price: 500.00
            }
          ],
          total_amount: 1000.00,
          payment_method: 'cash',
          payment_status: 'completed',
          customer_id: testCustomerId || null,
          discount: 0
        })
      });

      if (newSale.ok) {
        testTransactionId = newSale.data.transaction_id || newSale.data.id;
        logSuccess(`Sale created successfully (Transaction ID: ${testTransactionId})`);
        logInfo(`Transaction Number: ${newSale.data.transaction_number || 'N/A'}`);
      } else {
        logError('Failed to create sale', newSale.data);
      }
    } else {
      logWarning('Skipping sale creation (no product available)');
    }

    // Test 6.4: Get single transaction details
    if (testTransactionId) {
      logTest('6.4 - Get Transaction Details');
      const transactionDetails = await makeRequest(`/api/sales/${testTransactionId}`, {
        headers: { Authorization: `Bearer ${cashierToken}` }
      });

      if (transactionDetails.ok) {
        logSuccess('Transaction details retrieved successfully');
        logInfo(`Total: Rs.${transactionDetails.data.transaction.total_amount}`);
        logInfo(`Items: ${transactionDetails.data.items.length} products`);
      } else {
        logError('Failed to retrieve transaction details', transactionDetails.data);
      }
    }

  } catch (error) {
    logError('Sales & billing system test failed', error);
  }
}

// =============================================================================
// TEST SUITE 7: PRODUCT REQUESTS
// =============================================================================

async function testProductRequests() {
  logSection('TEST SUITE 7: PRODUCT REQUESTS');
  testResults.total++;

  try {
    // Test 7.1: Get product requests
    logTest('7.1 - Get All Product Requests');
    const requests = await makeRequest('/api/product-requests', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    if (requests.ok && Array.isArray(requests.data)) {
      logSuccess(`Retrieved ${requests.data.length} product requests`);
      if (requests.data.length > 0) {
        testProductRequestId = requests.data[0].id;
        logInfo(`Sample: ${requests.data[0].request_type} - ${requests.data[0].status}`);
      }
    } else {
      logError('Failed to retrieve product requests', requests.data);
    }

    // Test 7.2: Create product request (Storekeeper)
    if (testProductId) {
      logTest('7.2 - Create Product Request (Stock Adjustment)');
      const newRequest = await makeRequest('/api/product-requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${storekeeperToken}` },
        body: JSON.stringify({
          request_type: 'stock_adjustment',
          product_id: testProductId,
          quantity_requested: 50,
          notes: 'Test stock adjustment request'
        })
      });

      if (newRequest.ok) {
        testProductRequestId = newRequest.data.request_id || newRequest.data.id;
        logSuccess(`Product request created (ID: ${testProductRequestId})`);
      } else {
        logError('Failed to create product request', newRequest.data);
      }
    }

    // Test 7.3: Approve product request (Owner)
    if (testProductRequestId) {
      logTest('7.3 - Approve Product Request');
      const approveRequest = await makeRequest(`/api/product-requests/${testProductRequestId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` }
      });

      if (approveRequest.ok) {
        logSuccess('Product request approved successfully');
      } else {
        logError('Failed to approve product request', approveRequest.data);
      }
    }

  } catch (error) {
    logError('Product requests test failed', error);
  }
}

// =============================================================================
// TEST SUITE 8: REPORTS SYSTEM
// =============================================================================

async function testReportsSystem() {
  logSection('TEST SUITE 8: REPORTS SYSTEM');
  testResults.total++;

  try {
    // Test 8.1: Owner Reports
    logTest('8.1 - Owner Reports (Full Analytics)');
    const ownerReports = await makeRequest('/api/reports/analytics', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    if (ownerReports.ok && ownerReports.data.role === 'owner') {
      logSuccess('Owner reports retrieved successfully');
      logInfo(`Today's Bills: ${ownerReports.data.todayTransactions?.billsCount || 0}`);
      logInfo(`Stock Movements: ${ownerReports.data.todayTransactions?.stockMovementsCount || 0}`);
      logInfo(`Inventory Value: Rs.${ownerReports.data.inventory?.totalValue || 0}`);
    } else {
      logError('Failed to retrieve owner reports', ownerReports.data);
    }

    // Test 8.2: Storekeeper Reports
    logTest('8.2 - Storekeeper Reports');
    const storekeeperReports = await makeRequest('/api/reports/analytics', {
      headers: { Authorization: `Bearer ${storekeeperToken}` }
    });

    if (storekeeperReports.ok && storekeeperReports.data.role === 'storekeeper') {
      logSuccess('Storekeeper reports retrieved successfully');
      logInfo(`Today's Bills: ${storekeeperReports.data.todayBills?.count || 0}`);
      logInfo(`Top Selling Products: ${storekeeperReports.data.insights?.topSellingProducts?.length || 0}`);
    } else {
      logError('Failed to retrieve storekeeper reports', storekeeperReports.data);
    }

    // Test 8.3: Cashier Reports
    logTest('8.3 - Cashier Reports (Own Sales)');
    const cashierReports = await makeRequest('/api/reports/analytics', {
      headers: { Authorization: `Bearer ${cashierToken}` }
    });

    if (cashierReports.ok && cashierReports.data.role === 'cashier') {
      logSuccess('Cashier reports retrieved successfully');
      logInfo(`Today's Bills: ${cashierReports.data.todayBills?.count || 0}`);
      logInfo(`Today's Total: Rs.${cashierReports.data.todayBills?.total || 0}`);
    } else {
      logError('Failed to retrieve cashier reports', cashierReports.data);
    }

    // Test 8.4: Sales Reports with filters
    logTest('8.4 - Sales Reports with Date Filters');
    const salesReports = await makeRequest('/api/reports/sales?startDate=2025-01-01&groupBy=day', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    if (salesReports.ok) {
      logSuccess('Sales reports with filters retrieved successfully');
    } else {
      logError('Failed to retrieve filtered sales reports', salesReports.data);
    }

  } catch (error) {
    logError('Reports system test failed', error);
  }
}

// =============================================================================
// TEST SUITE 9: ANALYTICS DASHBOARD
// =============================================================================

async function testAnalyticsDashboard() {
  logSection('TEST SUITE 9: ANALYTICS DASHBOARD');
  testResults.total++;

  try {
    // Test 9.1: Analytics for 7 days
    logTest('9.1 - Analytics Dashboard (7 days)');
    const analytics7d = await makeRequest('/api/analytics?period=7d');

    if (analytics7d.ok) {
      logSuccess('7-day analytics retrieved successfully');
      logInfo(`Total Revenue: Rs.${analytics7d.data.salesMetrics?.totalSales || 0}`);
      logInfo(`Transactions: ${analytics7d.data.salesMetrics?.totalTransactions || 0}`);
      logInfo(`Low Stock Items: ${analytics7d.data.kpis?.lowStockCount || 0}`);
    } else {
      logError('Failed to retrieve 7-day analytics', analytics7d.data);
    }

    // Test 9.2: Analytics for 30 days
    logTest('9.2 - Analytics Dashboard (30 days)');
    const analytics30d = await makeRequest('/api/analytics?period=30d');

    if (analytics30d.ok) {
      logSuccess('30-day analytics retrieved successfully');
      logInfo(`Total Revenue: Rs.${analytics30d.data.salesMetrics?.totalSales || 0}`);
      logInfo(`Average Sale: Rs.${analytics30d.data.salesMetrics?.avgSale?.toFixed(2) || 0}`);
    } else {
      logError('Failed to retrieve 30-day analytics', analytics30d.data);
    }

    // Test 9.3: Check analytics data structure
    logTest('9.3 - Analytics Data Structure Validation');
    if (analytics30d.ok) {
      const requiredFields = [
        'salesMetrics',
        'dailySales',
        'productPerformance',
        'categoryPerformance',
        'inventoryHealth',
        'kpis'
      ];

      const missingFields = requiredFields.filter(field => !analytics30d.data[field]);

      if (missingFields.length === 0) {
        logSuccess('All required analytics fields present');
      } else {
        logError(`Missing analytics fields: ${missingFields.join(', ')}`);
      }
    }

  } catch (error) {
    logError('Analytics dashboard test failed', error);
  }
}

// =============================================================================
// TEST SUITE 10: DATABASE INTEGRITY
// =============================================================================

async function testDatabaseIntegrity() {
  logSection('TEST SUITE 10: DATABASE INTEGRITY');
  testResults.total++;

  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    logSuccess('Database connection established');

    // Test 10.1: Check required tables exist
    logTest('10.1 - Verify Required Tables');
    const [tables] = await connection.execute("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    const requiredTables = [
      'users',
      'products',
      'customers',
      'transactions',
      'transaction_items',
      'stock_movements',
      'product_requests'
    ];

    const missingTables = requiredTables.filter(t => !tableNames.includes(t));

    if (missingTables.length === 0) {
      logSuccess(`All ${requiredTables.length} required tables exist`);
      logInfo(`Tables: ${tableNames.join(', ')}`);
    } else {
      logError(`Missing tables: ${missingTables.join(', ')}`);
    }

    // Test 10.2: Check data integrity
    logTest('10.2 - Check Data Integrity');
    
    const [userCount] = await connection.execute("SELECT COUNT(*) as count FROM users WHERE is_active = TRUE");
    const [productCount] = await connection.execute("SELECT COUNT(*) as count FROM products");
    const [transactionCount] = await connection.execute("SELECT COUNT(*) as count FROM transactions");
    
    logSuccess(`Active Users: ${userCount[0].count}`);
    logSuccess(`Products: ${productCount[0].count}`);
    logSuccess(`Transactions: ${transactionCount[0].count}`);

    // Test 10.3: Check for orphaned records
    logTest('10.3 - Check for Orphaned Records');
    
    const [orphanedItems] = await connection.execute(
      `SELECT COUNT(*) as count FROM transaction_items ti 
       LEFT JOIN transactions t ON ti.transaction_id = t.id 
       WHERE t.id IS NULL`
    );

    if (orphanedItems[0].count === 0) {
      logSuccess('No orphaned transaction items found');
    } else {
      logWarning(`Found ${orphanedItems[0].count} orphaned transaction items`);
    }

    // Test 10.4: Verify schema consistency
    logTest('10.4 - Verify transaction_items Schema');
    
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM transaction_items WHERE Field = 'total_price'"
    );

    if (columns.length > 0) {
      logSuccess('transaction_items table has correct schema (total_price column exists)');
    } else {
      logError('transaction_items table missing total_price column (should not use subtotal)');
    }

    await connection.end();

  } catch (error) {
    logError('Database integrity test failed', error);
  }
}

// =============================================================================
// TEST SUMMARY REPORT
// =============================================================================

function generateTestReport() {
  logSection('TEST EXECUTION SUMMARY');

  const passRate = testResults.total > 0 
    ? ((testResults.passed / testResults.total) * 100).toFixed(2) 
    : 0;

  console.log('\n📊 Overall Results:');
  console.log('━'.repeat(70));
  log(`Total Test Suites: ${testResults.total}`, 'cyan');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⚠️  Skipped: ${testResults.skipped}`, 'yellow');
  log(`📈 Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');
  console.log('━'.repeat(70));

  if (testResults.errors.length > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.test}`);
      if (error.error) {
        log(`   ${error.error}`, 'red');
      }
    });
  }

  // Token summary
  console.log('\n🔐 Authentication Tokens:');
  console.log('━'.repeat(70));
  log(`Owner Token: ${ownerToken ? '✓ Available' : '✗ Not available'}`, ownerToken ? 'green' : 'red');
  log(`Cashier Token: ${cashierToken ? '✓ Available' : '✗ Not available'}`, cashierToken ? 'green' : 'red');
  log(`Storekeeper Token: ${storekeeperToken ? '✓ Available' : '✗ Not available'}`, storekeeperToken ? 'green' : 'red');

  // Test data summary
  console.log('\n📦 Test Data Created:');
  console.log('━'.repeat(70));
  log(`Product ID: ${testProductId || 'N/A'}`, testProductId ? 'cyan' : 'yellow');
  log(`Customer ID: ${testCustomerId || 'N/A'}`, testCustomerId ? 'cyan' : 'yellow');
  log(`Transaction ID: ${testTransactionId || 'N/A'}`, testTransactionId ? 'cyan' : 'yellow');
  log(`Stock Movement ID: ${testStockMovementId || 'N/A'}`, testStockMovementId ? 'cyan' : 'yellow');
  log(`Product Request ID: ${testProductRequestId || 'N/A'}`, testProductRequestId ? 'cyan' : 'yellow');

  console.log('\n' + '='.repeat(70));
  
  if (testResults.failed === 0) {
    log('🎉 ALL TESTS PASSED! System is working correctly.', 'green');
  } else if (passRate >= 80) {
    log('⚠️  Most tests passed, but some issues found. Review errors above.', 'yellow');
  } else {
    log('❌ Multiple test failures detected. System requires attention.', 'red');
  }
  
  console.log('='.repeat(70) + '\n');
}

// =============================================================================
// MAIN TEST EXECUTION
// =============================================================================

async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════════════════════╗', 'bright');
  log('║     SMART INVENTORY SYSTEM - COMPREHENSIVE FUNCTIONALITY TEST     ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'bright');
  
  logInfo(`Start Time: ${new Date().toLocaleString()}`);
  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`Database: ${DB_CONFIG.database}@${DB_CONFIG.host}\n`);

  const startTime = Date.now();

  try {
    // Run all test suites
    await testAuthenticationSystem();
    await testUserManagement();
    await testProductManagement();
    await testStockManagement();
    await testCustomerManagement();
    await testSalesBillingSystem();
    await testProductRequests();
    await testReportsSystem();
    await testAnalyticsDashboard();
    await testDatabaseIntegrity();

  } catch (error) {
    log('\n💥 CRITICAL ERROR: Test execution failed', 'red');
    console.error(error);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  logInfo(`\nEnd Time: ${new Date().toLocaleString()}`);
  logInfo(`Total Duration: ${duration} seconds`);

  // Generate final report
  generateTestReport();
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
