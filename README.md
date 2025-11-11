# SD Bandara Trading - Inventory Management System

A comprehensive offline inventory management system built with Next.js, TypeScript, and MySQL for retail operations.

## 🎯 Quick Start

### For Users (Customer Installation)
1. **Start the system**: Double-click `START.bat`
2. **Access**: Open browser → `http://localhost:3000`
3. **Login**: Use credentials from installation guide
4. **Stop**: Double-click `STOP.bat`

### For Developers
```bash
npm install          # Install dependencies
npm run dev          # Development mode
npm run build        # Production build
npm start            # Production mode
```

## 📁 Project Structure

```
project01/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (sales, products, users, reports)
│   ├── components/        # Reusable React components
│   ├── dashboard/         # Dashboard pages (billing, reports, etc.)
│   └── globals.css        # Global styles
│
├── lib/                   # Core utilities
│   ├── database.ts        # Database connection
│   ├── auth.ts           # Authentication utilities
│   └── setup-database.ts  # Database initialization
│
├── public/                # Static assets
│   └── images/           # Product images
│
├── docs/                  # Documentation
│   ├── INSTALLATION_GUIDE.md   # Installation instructions
│   ├── USER_MANUAL.md          # User guide for all roles
│   └── *.md                    # Other documentation
│
├── scripts/               # Utility scripts
│   ├── start-system.bat        # Full start script
│   ├── stop-system.bat         # Stop script
│   └── backup-database.bat     # Database backup
│
├── testing/               # Test scripts
│   └── *.js              # Various test utilities
│
├── START.bat             # Quick start launcher
├── STOP.bat              # Quick stop launcher
├── .env                  # Environment configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## 🚀 Features

### Core Features
- **User Management**: Role-based access (Owner, Storekeeper, Cashier)
- **Product Management**: Catalog with images and categories
- **Stock Management**: Real-time tracking with movements approval
- **Billing System**: Modern POS with product images
- **Reports & Analytics**: Role-specific insights and charts
- **Receipt Generation**: Print & Download capabilities
- **Offline Operation**: No internet required

## �️ Technology Stack

- **Frontend**: Next.js 15, TypeScript, React
- **Backend**: Next.js API Routes
- **Database**: MySQL 8.0
- **Authentication**: JWT tokens
- **Styling**: CSS-in-JS
- Bulk product selection
- User-friendly interface

## 🔧 API Endpoints

### Products
- `GET /api/products` - List all products
- `PATCH /api/products/[id]/image` - Update product image

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Sales
- `POST /api/sales` - Create new sale
- `GET /api/sales` - Get sales history

## 🎨 Customization

The system supports extensive customization:

- **Product Images**: Add high-quality product images via URL
- **UI Themes**: Modern, clean interface with smooth animations

## 📦 Installation

See detailed instructions in `docs/INSTALLATION_GUIDE.md`

**Quick Setup:**
1. Install Node.js and MySQL
2. Configure `.env` file
3. Run `npm install`
4. Run `node lib/setup-database.js`
5. Start with `START.bat`

## 🎯 Default Login Credentials

### Owner Account
- Email: `admin@inventory.com`
- Password: `admin123`
- Access: Full system control

### Cashier Account
- Email: `cashier@inventory.com`
- Password: `cashier123`
- Access: Billing only

### Storekeeper Account
- Email: `store@inventory.com`
- Password: `store123`
- Access: Inventory management

⚠️ **Change these passwords after first login!**

## 📚 Documentation

- **Installation Guide**: `docs/INSTALLATION_GUIDE.md`
- **User Manual**: `docs/USER_MANUAL.md`
- **Reports Documentation**: `docs/REPORTS_MODULE_COMPLETE.md`

## 🔧 Maintenance

### Database Backup
```bash
# Quick backup
scripts\backup-database.bat

# Manual backup
mysqldump -u root -p smart_inventory > backup.sql
```

### Daily Operations
- **Start**: `START.bat`
- **Stop**: `STOP.bat`
- **Backup**: `scripts\backup-database.bat`

## 🔒 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Secure password storage
- Session management
- Input validation

## 🆘 Support

For issues or questions:
1. Check `docs/INSTALLATION_GUIDE.md`
2. Review `docs/USER_MANUAL.md`
3. Contact: [Your Support Email]

## 📝 Version

**v1.0.0** - Production Release
- Complete billing system with print/download
- Role-based reports module
- Stock management with approvals
- Multi-user authentication

## � License

Proprietary software developed for SD Bandara Trading.
All rights reserved © 2025

---

**SD Bandara Trading - Inventory Management System**  
*Fresh Produce & Groceries*  
Developed by: Lakindu  
GitHub: https://github.com/Lakindu12-tech/Smart-Inventory
