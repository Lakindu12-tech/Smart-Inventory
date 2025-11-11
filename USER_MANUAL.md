# SD Bandara Trading - User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Owner Guide](#owner-guide)
3. [Cashier Guide](#cashier-guide)
4. [Storekeeper Guide](#storekeeper-guide)
5. [Common Tasks](#common-tasks)

---

## Getting Started

### First Time Login
1. Open your browser (Chrome, Edge, Firefox)
2. Go to: `http://localhost:3000`
3. Login with your credentials:
   - Owner: `admin@inventory.com` / `admin123`
   - Cashier: `cashier@inventory.com` / `cashier123`
   - Storekeeper: `store@inventory.com` / `store123`

### Changing Your Password
1. Click your name in the top right
2. Select "Change Password"
3. Enter current password
4. Enter new password (minimum 6 characters)
5. Confirm new password
6. Click "Update Password"

---

## Owner Guide

### Accessing the Dashboard
- After login, you'll see the main dashboard
- View today's sales, stock status, pending approvals

### Managing Users
1. Click "Users" in sidebar
2. Click "Add User" button
3. Fill in details:
   - Name
   - Email
   - Password
   - Role (Owner/Cashier/Storekeeper)
4. Click "Create User"

**To edit a user:**
- Click pencil icon next to user
- Update information
- Click "Update"

**To delete a user:**
- Click trash icon
- Confirm deletion

### Viewing Reports
1. Click "Reports" in sidebar
2. See comprehensive analytics:
   - Today's bills and stock movements
   - 30-day revenue trends
   - Top selling products
   - Complete inventory value
3. Click ▶ arrow to expand bill details
4. View product breakdown for each transaction

### Approving Stock Requests
1. Click "Approvals" in sidebar
2. Review pending requests:
   - Product requests (add new products)
   - Stock movements (in/out/adjustments)
3. Click "Approve" or "Reject"
4. System updates automatically

### Managing Products
1. Click "Products" in sidebar
2. View all products with:
   - Name, category, price
   - Current stock
   - Status
3. Add new product:
   - Click "Add Product"
   - Enter name, price, category
   - Upload image (optional)
   - Set initial stock
   - Click "Create"
4. Edit product:
   - Click pencil icon
   - Update details
   - Click "Save"

---

## Cashier Guide

### Creating a Bill
1. Click "Billing" in sidebar
2. You'll see all available products with images
3. Click on a product to add to cart
4. Set quantity in the popup
5. Click "Add to Cart"
6. Repeat for more products

### Managing Cart
- **Change quantity**: Click +/- buttons or type directly
- **Remove item**: Click trash icon
- **View total**: Bottom of cart shows total amount

### Completing a Sale
1. Review cart items
2. Select payment method:
   - Cash
   - Card
   - Digital Payment
3. Apply discount if needed (optional)
4. Click "Complete Sale"
5. Receipt popup appears

### Handling Receipt
After completing sale:
- **Print**: Click 🖨️ Print button
  - Opens print-friendly window
  - Click "Print Receipt" to print
- **Download**: Click 📥 Download button
  - Saves as text file
  - Can be emailed to customer
- **Close**: Click "Close Receipt" to continue

### Tips for Fast Billing
- Use search bar to find products quickly
- Products show current stock (don't oversell!)
- Red products are out of stock (disabled)
- Cart stays until you complete or clear it

---

## Storekeeper Guide

### Viewing Inventory
1. Click "Stock Management" in sidebar
2. See all products with current stock levels:
   - ✅ Green: In stock (>10 units)
   - ⚠️ Yellow: Low stock (1-10 units)
   - ❌ Red: Out of stock (0 units)

### Adding Stock (Stock In)
1. Click "Stock Management"
2. Click "Add Stock Movement"
3. Select:
   - Product
   - Movement type: "In"
   - Quantity
   - Reason (e.g., "New delivery")
4. Click "Submit"
5. Wait for owner approval

### Removing Stock (Stock Out)
1. Same process as adding
2. Select movement type: "Out"
3. Provide reason (e.g., "Damaged goods")
4. Submit for approval

### Stock Adjustment
- Use when correcting stock levels
- Select "Adjustment" type
- Explain reason clearly

### Requesting New Products
1. Click "Products" tab
2. Click "Request New Product"
3. Fill details:
   - Product name
   - Category
   - Suggested price
   - Initial stock quantity
4. Submit for owner approval

### Viewing Reports
- Click "Reports" to see:
  - Inventory value
  - Stock status summary
  - Top selling products
  - Products not sold recently

---

## Common Tasks

### Searching for Products
- Use search box at top of product list
- Type product name
- Results filter automatically

### Handling Low Stock Alerts
When product is low:
1. Note which products need restock
2. Create "Stock In" movement
3. Enter delivery quantity
4. Submit for approval
5. Owner approves
6. Stock updates automatically

### End of Day Process (Owner)
1. Go to Reports
2. Review today's sales
3. Check stock movements
4. Create backup:
   - Double-click `backup-database.bat`
   - Backup saves to `database-backups` folder
5. Keep backup safe

### Monthly Tasks (Owner)
1. Review 30-day reports
2. Check product performance
3. Remove slow-moving products
4. Update prices if needed
5. Create new users if staff changed

### Troubleshooting

**Can't login?**
- Check email and password carefully
- Ask owner to reset your password

**Product not showing?**
- Check if it's in stock (cashiers only see in-stock items)
- Ask storekeeper to add stock

**Bill total is wrong?**
- Check product prices (owner can update)
- Clear cart and re-add items

**System is slow?**
- Close other programs
- Clear browser cache (Ctrl+Shift+Delete)
- Restart system

**Receipt won't print?**
- Check printer is on and connected
- Try "Download" button instead
- Check browser allows pop-ups

### Need Help?
Contact system administrator or refer to:
- Installation Guide
- README.md
- Technical support

---

## Keyboard Shortcuts
- **Search products**: Click search box or press `/`
- **Print receipt**: Ctrl+P (when receipt is open)
- **Logout**: Click your name → Logout

## Best Practices

### For Cashiers
- ✅ Verify quantities before completing sale
- ✅ Double-check total amount
- ✅ Print receipt for every transaction
- ✅ Check product stock before adding to cart

### For Storekeepers
- ✅ Update stock immediately when deliveries arrive
- ✅ Document all stock movements clearly
- ✅ Check inventory levels daily
- ✅ Report damaged goods promptly

### For Owners
- ✅ Review reports daily
- ✅ Approve requests promptly
- ✅ Backup database regularly
- ✅ Update product prices as needed
- ✅ Monitor system performance

---

**SD Bandara Trading - Inventory Management System**  
Version 1.0.0  
© 2025
