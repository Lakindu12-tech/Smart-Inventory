# SD Bandara Trading - Inventory System Installation Guide

## System Requirements
- Windows 10 or later
- 4GB RAM minimum (8GB recommended)
- 500MB free disk space
- No internet required after installation

## Installation Steps

### Step 1: Install Node.js
1. Run `node-v20.x.x-x64.msi` (included in package)
2. Click "Next" through the installer
3. Accept default settings
4. Click "Finish"

### Step 2: Install MySQL
1. Run `mysql-installer-community.msi` (included in package)
2. Choose "Developer Default" installation
3. Set MySQL root password: `lakindu` (or your preferred password)
4. Complete installation

### Step 3: Setup Database
1. Open Command Prompt as Administrator
2. Navigate to project folder:
   ```
   cd C:\SD-Bandara-Inventory
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Setup database:
   ```
   node lib\setup-database.js
   ```

### Step 4: Configure Database Connection
1. Open `.env` file with Notepad
2. Update with your MySQL password:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=lakindu
   DB_NAME=smart_inventory
   JWT_SECRET=your-secret-key-here
   ```

### Step 5: Start the System
1. Double-click `start-system.bat`
2. Wait for "Ready on http://localhost:3000"
3. Open browser and go to: `http://localhost:3000`

### Step 6: First Login
- **Owner Account:**
  - Email: `admin@inventory.com`
  - Password: `admin123`

- **Cashier Account:**
  - Email: `cashier@inventory.com`
  - Password: `cashier123`

- **Storekeeper Account:**
  - Email: `store@inventory.com`
  - Password: `store123`

## Daily Usage

### Starting the System
1. Double-click `start-system.bat`
2. Open browser: `http://localhost:3000`

### Stopping the System
1. Close the Command Prompt window
OR
2. Press `Ctrl + C` in the Command Prompt

### Running as Background Service (Optional)
1. Open Command Prompt as Administrator
2. Install PM2:
   ```
   npm install -g pm2
   npm install -g pm2-windows-startup
   pm2-startup install
   ```
3. Start system with PM2:
   ```
   cd C:\SD-Bandara-Inventory
   npm run build
   pm2 start npm --name "SD-Bandara" -- start
   pm2 save
   ```
4. System will now start automatically when Windows boots

## Backup Database

### Manual Backup
```bash
mysqldump -u root -p smart_inventory > backup_2025-11-11.sql
```

### Restore from Backup
```bash
mysql -u root -p smart_inventory < backup_2025-11-11.sql
```

## Troubleshooting

### Port 3000 Already in Use
```bash
# Stop the running process
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### Database Connection Failed
1. Check if MySQL service is running:
   - Open Services (`services.msc`)
   - Find "MySQL80" service
   - Start if stopped
2. Verify `.env` file has correct password

### System Not Loading
1. Check Node.js is installed: `node --version`
2. Check MySQL is running
3. Restart the system

## Support
- Check README.md for detailed features
- Contact: [Your Contact Info]

## Security Notes
- Change default passwords after first login
- Keep regular database backups
- Don't expose port 3000 to internet
- Keep the system updated
