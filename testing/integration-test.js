// Integration test for SD Bandara Trading Inventory & Billing System
// Run with: node integration-test.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API = 'http://localhost:3000/api';

const users = {
  owner: { email: 'admin@inventory.com', password: 'admin123' },
  storekeeper: { email: 's1@dd.com', password: '1234' },
  cashier: { email: 'c1@dd.com', password: '1234' }
};

const results = [];

function logResult(module, test, pass, details = '') {
  const status = pass ? '✅ PASS' : '❌ FAIL';
  results.push({ module, test, pass, details });
  console.log(`[${status}] [${module}] ${test}${details ? ' - ' + details : ''}`);
}

async function login(role) {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: users[role].email, password: users[role].password })
    });
    if (!res.ok) {
      const error = await res.json();
      console.log(`Login failed for ${role}:`, error);
      return null;
    }
    const data = await res.json();
    return data.token;
  } catch (error) {
    console.log(`Login error for ${role}:`, error.message);
    return null;
  }
}

async function testAuth() {
  // Only test owner login initially since other users will be created
  const token = await login('owner');
  logResult('Auth', 'Login as owner', !!token);
  return !!token;
}

async function testUserCreation(ownerToken) {
  // Owner creates storekeeper and cashier (ignore if already exist)
  let res = await fetch(`${API}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ name: 'Test Storekeeper', email: 's1@dd.com', role: 'storekeeper' })
  });
  if (!res.ok) {
    const err = await res.json();
    if (err.message && err.message.includes('already exists')) {
      logResult('UserMgmt', 'Owner creates Storekeeper', true, '(already exists)');
    } else {
      logResult('UserMgmt', 'Owner creates Storekeeper', false, JSON.stringify(err));
    }
  } else {
    logResult('UserMgmt', 'Owner creates Storekeeper', true);
  }
  
  res = await fetch(`${API}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ name: 'Test Cashier', email: 'c1@dd.com', role: 'cashier' })
  });
  if (!res.ok) {
    const err = await res.json();
    if (err.message && err.message.includes('already exists')) {
      logResult('UserMgmt', 'Owner creates Cashier', true, '(already exists)');
    } else {
      logResult('UserMgmt', 'Owner creates Cashier', false, JSON.stringify(err));
    }
  } else {
    logResult('UserMgmt', 'Owner creates Cashier', true);
  }
}

async function testUserManagement(ownerToken) {
  // Try different password combinations for existing users
  let storekeeperToken = null;
  let cashierToken = null;
  
  // Try storekeeper login with different passwords
  const storekeeperPasswords = ['1234', '5678', 'lakindu'];
  for (const pw of storekeeperPasswords) {
    const tempUsers = { ...users };
    tempUsers.storekeeper.password = pw;
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 's1@dd.com', password: pw })
    });
    if (res.ok) {
      const data = await res.json();
      storekeeperToken = data.token;
      users.storekeeper.password = pw;
      logResult('UserMgmt', 'Storekeeper login with default password', true, `(password: ${pw})`);
      break;
    }
  }
  if (!storekeeperToken) {
    logResult('UserMgmt', 'Storekeeper login with default password', false, 'No valid password found');
  }
  
  // Try cashier login with different passwords
  const cashierPasswords = ['1234', '5678'];
  for (const pw of cashierPasswords) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'c1@dd.com', password: pw })
    });
    if (res.ok) {
      const data = await res.json();
      cashierToken = data.token;
      users.cashier.password = pw;
      logResult('UserMgmt', 'Cashier login with default password', true, `(password: ${pw})`);
      break;
    }
  }
  if (!cashierToken) {
    logResult('UserMgmt', 'Cashier login with default password', false, 'No valid password found');
  }
  
  // Storekeeper changes password
  if (storekeeperToken) {
    let res = await fetch(`${API}/users/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storekeeperToken}` },
      body: JSON.stringify({ currentPassword: users.storekeeper.password, newPassword: '5678', confirmPassword: '5678' })
    });
    if (!res.ok) {
      const err = await res.json();
      logResult('UserMgmt', 'Storekeeper changes password', false, JSON.stringify(err));
    } else {
      logResult('UserMgmt', 'Storekeeper changes password', true, '(changed to 5678)');
      users.storekeeper.password = '5678';
    }
  } else {
    logResult('UserMgmt', 'Storekeeper changes password', false, 'Cannot login as storekeeper');
  }
  
  // Cashier changes password
  if (cashierToken) {
    let res = await fetch(`${API}/users/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
      body: JSON.stringify({ currentPassword: users.cashier.password, newPassword: '5678', confirmPassword: '5678' })
    });
    if (!res.ok) {
      const err = await res.json();
      logResult('UserMgmt', 'Cashier changes password', false, JSON.stringify(err));
    } else {
      logResult('UserMgmt', 'Cashier changes password', true, '(changed to 5678)');
      users.cashier.password = '5678';
    }
  } else {
    logResult('UserMgmt', 'Cashier changes password', false, 'Cannot login as cashier');
  }
  
  // Test login with new passwords
  const newStorekeeperToken = await login('storekeeper');
  logResult('UserMgmt', 'Storekeeper login with new password', !!newStorekeeperToken);
  
  const newCashierToken = await login('cashier');
  logResult('UserMgmt', 'Cashier login with new password', !!newCashierToken);
}

async function testProductManagement(storekeeperToken, ownerToken, cashierToken) {
  // Storekeeper requests new product
  const prodName = 'TestProduct' + Date.now();
  let res = await fetch(`${API}/product-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storekeeperToken}` },
    body: JSON.stringify({ type: 'add', product_name: prodName, requested_price: 100 })
  });
  if (!res.ok) {
    const err = await res.json();
    logResult('ProductMgmt', 'Storekeeper requests new product', false, JSON.stringify(err));
    return;
  } else {
    logResult('ProductMgmt', 'Storekeeper requests new product', true);
  }
  
  // Owner fetches and approves the request
  let reqs = await fetch(`${API}/product-requests`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  let reqsJson = await reqs.json();
  if (!Array.isArray(reqsJson)) {
    logResult('ProductMgmt', 'Owner fetches product requests', false, JSON.stringify(reqsJson));
    return;
  }
  const req = reqsJson.find(r => r.product_name === prodName);
  if (!req) {
    logResult('ProductMgmt', 'Owner finds product request', false, 'Request not found');
    return;
  }
  
  // Owner approves the request
  res = await fetch(`${API}/product-requests/${req.id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!res.ok) {
    const err = await res.json();
    logResult('ProductMgmt', 'Owner approves product request', false, JSON.stringify(err));
    return;
  } else {
    logResult('ProductMgmt', 'Owner approves product request', true);
  }
  
  // Test rejection - create another request and reject it
  const rejectProdName = 'RejectProduct' + Date.now();
  res = await fetch(`${API}/product-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storekeeperToken}` },
    body: JSON.stringify({ type: 'add', product_name: rejectProdName, requested_price: 200 })
  });
  if (res.ok) {
    logResult('ProductMgmt', 'Storekeeper requests product for rejection', true);
    
    // Find and reject this request
    reqs = await fetch(`${API}/product-requests`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    reqsJson = await reqs.json();
    const rejectReq = reqsJson.find(r => r.product_name === rejectProdName);
    if (rejectReq) {
      res = await fetch(`${API}/product-requests/${rejectReq.id}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        logResult('ProductMgmt', 'Owner rejects product request', true);
      } else {
        const err = await res.json();
        logResult('ProductMgmt', 'Owner rejects product request', false, JSON.stringify(err));
      }
    }
  }
  
  // Add stock-in movement for the approved product
  let prods = await fetch(`${API}/products`, {
    headers: { Authorization: `Bearer ${storekeeperToken}` }
  });
  prods = await prods.json();
  const newProduct = prods.find(p => p.name === prodName);
  if (!newProduct) {
    logResult('ProductMgmt', 'Find new product after approval', false, JSON.stringify(prods));
    return;
  }
  
  // Storekeeper submits stock-in
  res = await fetch(`${API}/stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storekeeperToken}` },
    body: JSON.stringify({ product_id: newProduct.id, movement_type: 'in', quantity: 10, reason: 'Initial stock' })
  });
  if (!res.ok) {
    const err = await res.json();
    logResult('ProductMgmt', 'Storekeeper submits stock-in for new product', false, JSON.stringify(err));
    return;
  } else {
    logResult('ProductMgmt', 'Storekeeper submits stock-in for new product', true);
  }
  
  // Owner approves stock-in
  let moves = await fetch(`${API}/stock?movements=true`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  moves = await moves.json();
  const move = moves.movements.find(m => m.product_id === newProduct.id && m.status === 'pending');
  if (!move) {
    logResult('ProductMgmt', 'Owner finds stock-in movement', false, JSON.stringify(moves));
    return;
  }
  res = await fetch(`${API}/stock/${move.id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  if (!res.ok) {
    const err = await res.json();
    logResult('ProductMgmt', 'Owner approves stock-in for new product', false, JSON.stringify(err));
    return;
  } else {
    logResult('ProductMgmt', 'Owner approves stock-in for new product', true);
  }
  
  // Cashier can see product
  prods = await fetch(`${API}/products`, {
    headers: { Authorization: `Bearer ${cashierToken}` }
  });
  prods = await prods.json();
  const found = prods.find(p => p.name === prodName);
  if (!found) {
    logResult('ProductMgmt', 'Cashier sees new product', false, JSON.stringify(prods));
  } else {
    logResult('ProductMgmt', 'Cashier sees new product', true);
  }
  
  // Return the new product for the sales test
  return found;
}

async function testStockManagement(storekeeperToken, ownerToken) {
  // Storekeeper submits stock in for a product
  let prods = await fetch(`${API}/products`, {
    headers: { Authorization: `Bearer ${storekeeperToken}` }
  });
  prods = await prods.json();
  const product = prods[0];
  if (!product) {
    logResult('StockMgmt', 'Storekeeper submits stock in', false, 'No products available');
    return;
  }
  let res = await fetch(`${API}/stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storekeeperToken}` },
    body: JSON.stringify({ product_id: product.id, movement_type: 'in', quantity: 5, reason: 'Restock' })
  });
  logResult('StockMgmt', 'Storekeeper submits stock in', res.ok);
  
  // Owner approves
  let moves = await fetch(`${API}/stock?movements=true`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  moves = await moves.json();
  const move = moves.movements.find(m => m.product_id === product.id && m.status === 'pending');
  if (!move) {
    logResult('StockMgmt', 'Owner approves stock movement', false, 'No pending movement found');
    return;
  }
  res = await fetch(`${API}/stock/${move.id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  logResult('StockMgmt', 'Owner approves stock movement', res.ok);
}

async function testSalesBilling(cashierToken, newProduct) {
  // Cashier creates a bill - always get products with current stock from stock API
  const stockRes = await fetch(`${API}/stock`, {
    headers: { Authorization: `Bearer ${cashierToken}` }
  });
  const stockData = await stockRes.json();
  let prods = stockData.products || [];
  
  // If we have a new product, find it in the stock data
  if (newProduct) {
    const foundProduct = prods.find(p => p.id === newProduct.id);
    if (foundProduct) {
      prods = [foundProduct];
      console.log('Using new product for sale:', foundProduct.name, 'Stock:', foundProduct.current_stock);
    } else {
      console.log('New product not found in stock data, using first available product');
    }
  }
  
  console.log('Available products for sale:', prods.length);
  
  const product = prods[0];
  if (!product) {
    logResult('Sales', 'Cashier creates bill', false, 'No products available');
    return;
  }
  
  // Get current stock before sale
  const beforeStock = Number(product.current_stock || product.stock || 0);
  console.log('Product for sale:', product.name, 'Stock before:', beforeStock);
  
  // Only proceed if product has stock
  if (beforeStock <= 0) {
    logResult('Sales', 'Cashier creates bill', false, 'No stock available for sale');
    return;
  }
  
  const txnNum = 'TXN' + Date.now();
  let res = await fetch(`${API}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
    body: JSON.stringify({
      transaction_number: txnNum,
      items: [{ product_id: product.id, quantity: 1, price: product.price }],
      total_amount: product.price,
      payment_method: 'cash',
      discount: 0
    })
  });
  logResult('Sales', 'Cashier creates bill', res.ok);
  
  // Wait a moment for the database to update
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check stock updated using stock API
  let updated = await fetch(`${API}/stock`, {
    headers: { Authorization: `Bearer ${cashierToken}` }
  });
  updated = await updated.json();
  const updatedProduct = updated.products.find(p => p.id === product.id);
  if (!updatedProduct) {
    logResult('Sales', 'Stock updated after sale', false, 'Product not found after sale');
    return;
  }
  // Handle both 'stock' and 'current_stock' fields
  const afterStock = Number(updatedProduct.current_stock || updatedProduct.stock || 0);
  console.log('Stock after sale:', afterStock);
  console.log('Comparison:', afterStock, '<', beforeStock, '=', afterStock < beforeStock);
  if (afterStock < beforeStock) {
    logResult('Sales', 'Stock updated after sale', true);
  } else {
    logResult('Sales', 'Stock updated after sale', false, `Before: ${beforeStock}, After: ${afterStock}`);
  }
}

async function testRoleAccess(ownerToken, storekeeperToken, cashierToken) {
  // Cashier can view stock but cannot submit stock movements
  let res = await fetch(`${API}/stock`, {
    headers: { Authorization: `Bearer ${cashierToken}` }
  });
  if (res.ok) {
    logResult('Access', 'Cashier can view stock levels', true);
  } else {
    const body = await res.text();
    logResult('Access', 'Cashier can view stock levels', false, `Status: ${res.status}, Body: ${body}`);
  }
  
  // Cashier cannot submit stock movements
  res = await fetch(`${API}/stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
    body: JSON.stringify({ product_id: 1, movement_type: 'in', quantity: 1, reason: 'test' })
  });
  if (res.status === 403 || res.status === 401) {
    logResult('Access', 'Cashier denied stock movement submission', true);
  } else {
    const body = await res.text();
    logResult('Access', 'Cashier denied stock movement submission', false, `Status: ${res.status}, Body: ${body}`);
  }
  
  // Storekeeper cannot access user management
  res = await fetch(`${API}/users`, {
    headers: { Authorization: `Bearer ${storekeeperToken}` }
  });
  if (res.status === 403 || res.status === 401) {
    logResult('Access', 'Storekeeper denied user management', true);
  } else {
    const body = await res.text();
    logResult('Access', 'Storekeeper denied user management', false, `Status: ${res.status}, Body: ${body}`);
  }
}

(async () => {
  console.log('--- SD Bandara Trading System Integration Test ---');
  
  // Initial login tests
  await testAuth();
  
  // User management (creates users and changes passwords)
  const ownerToken = await login('owner');
  await testUserCreation(ownerToken);
  await testUserManagement(ownerToken);
  
  // Re-login with updated credentials
  const storekeeperToken = await login('storekeeper');
  const cashierToken = await login('cashier');
  
  // Run remaining tests with updated tokens
  const newProduct = await testProductManagement(storekeeperToken, ownerToken, cashierToken);
  await testStockManagement(storekeeperToken, ownerToken);
  await testSalesBilling(cashierToken, newProduct);
  await testRoleAccess(ownerToken, storekeeperToken, cashierToken);

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  if (failed === 0) {
    console.log('🎉 All modules are working perfectly together!');
  } else {
    console.log('❌ Some tests failed. Please review the output above.');
  }
})();


