# Manual Test Instructions: User Creation and Deletion

## Test Scenario: Owner creates a cashier, then deletes them

### Step 1: Owner Login
1. Open browser and go to `http://localhost:3000`
2. Login as owner:
   - Email: `admin@inventory.com`
   - Password: `admin123`
3. Verify you're on the owner dashboard

### Step 2: Create a New Cashier
1. Navigate to "User Management" in the sidebar
2. Click "+ Add New User" button
3. Fill in the form:
   - Name: `Test Cashier`
   - Email: `testcashier@test.com`
   - Role: `Cashier`
4. Click "Create User"
5. Verify success message shows "User created successfully! Default password: 1234"

### Step 3: Test Cashier Login (Should Work)
1. Open a new incognito/private browser window
2. Go to `http://localhost:3000`
3. Login with the new cashier credentials:
   - Email: `testcashier@test.com`
   - Password: `1234`
4. Verify login is successful and you see the cashier dashboard

### Step 4: Delete the Cashier
1. Go back to the owner browser window
2. In the User Management page, find "Test Cashier" in the user list
3. Click the "🗑️ Delete" button next to the cashier
4. In the confirmation modal, click "Yes, Delete User"
5. Verify success message shows "User deleted successfully"
6. Verify the cashier is no longer in the user list

### Step 5: Test Cashier Login After Deletion (Should Fail)
1. Go back to the cashier browser window
2. Try to refresh the page or navigate to a different page
3. You should be redirected to login page
4. Try to login again with the same credentials:
   - Email: `testcashier@test.com`
   - Password: `1234`
5. Verify login fails with "User not found" error

### Expected Results:
✅ Owner can create new cashier
✅ Cashier can login after creation
✅ Owner can delete cashier
✅ Cashier cannot login after deletion
✅ Cashier disappears from user list
✅ Cashier session is invalidated

## Test Results:
- [ ] Owner login successful
- [ ] Cashier creation successful
- [ ] Cashier login after creation successful
- [ ] Cashier deletion successful
- [ ] Cashier login after deletion failed
- [ ] Cashier removed from user list
- [ ] All functionality working as expected 