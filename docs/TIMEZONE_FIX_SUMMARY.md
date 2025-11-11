# TIMEZONE FIX - Reports Now Show Real-Time Data

## Critical Issue Found & Fixed

### The Problem
Reports were showing **6 transactions (Rs.610)** instead of **9 transactions (Rs.7,110)** including your new papaya sales.

### Root Cause: **Timezone Mismatch**

Your system:
- **Database timezone:** SYSTEM (Asia/Colombo, GMT+5:30)
- **Node.js timezone:** UTC (GMT+0)
- **Transaction dates:** Stored in local time (Asia/Colombo)
- **Query dates:** Sent as UTC ISO strings from Node.js

When the analytics API calculated "30 days ago" in Node.js UTC time and compared it to database timestamps in Asia/Colombo local time, the 3 newest transactions appeared to be "in the future" and were excluded from results!

**Example:**
- Node.js sends: `2025-11-10T17:11:00.000Z` (5:11 PM UTC)
- Your transaction: `2025-11-10T22:34:33` (10:34 PM local = 5:04 PM UTC)
- MySQL compares them as strings: `22:34` > `17:11` = EXCLUDED ❌

### The Fix

Changed from passing ISO date strings to using MySQL's `DATE_SUB(NOW(), INTERVAL X DAY)`:

**Before:**
```typescript
const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const startStr = start.toISOString(); // UTC time as string

await conn.execute(
  `WHERE t.date >= ? AND t.date <= ?`,
  [startStr, endStr] // ❌ Timezone mismatch!
);
```

**After:**
```typescript
const days = 30;

await conn.execute(
  `WHERE t.date >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
  [days] // ✅ MySQL calculates in local time!
);
```

Now MySQL uses its own `NOW()` function which respects the database timezone, so all comparisons are in the same timezone.

### Verification

**Database query test:**
```
📊 Total Transactions: 9 (was 6)
💰 Total Sales: Rs.7,110 (was Rs.610)
📊 Average: Rs.790 (was Rs.102)

Recent transactions now included:
✅ Transaction 10: Rs.1,500 (10 Apples)
✅ Transaction 11: Rs.2,500 (10 Papayas) ← Your new bill!
✅ Transaction 12: Rs.2,500 (10 Papayas) ← Your new bill!
```

### What You Need To Do

1. **Restart your development server** if it's running:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Clear browser cache** or do a hard refresh:
   - Chrome/Edge: `Ctrl + Shift + R` or `Ctrl + F5`
   - Firefox: `Ctrl + Shift + R`

3. **Login and test:**
   - Login as owner or storekeeper
   - Go to Reports/Analytics
   - Select "30d" period
   - You should now see:
     - **9 transactions** (not 6)
     - **Rs.7,110 total revenue** (not Rs.610)
     - Your **2 papaya transactions** at Rs.2,500 each in the data

4. **Create a new bill** as cashier:
   - It should appear **immediately** in reports after refresh

### Files Changed
- `/app/api/analytics/route.ts` - Fixed date filtering to use `DATE_SUB(NOW(), ...)` instead of ISO strings
- Multiple test files added to verify the fix

### Status
✅ **FIXED** - Reports now show real-time data without timezone issues
✅ **TESTED** - Verified with database queries and test scripts
✅ **COMMITTED** - Pushed to GitHub master branch

---
**Date:** November 10, 2025  
**Issue:** Timezone mismatch causing new transactions to be excluded from reports  
**Solution:** Use MySQL's DATE_SUB with NOW() instead of Node.js ISO date strings  
**Result:** All transactions now appear correctly in reports
