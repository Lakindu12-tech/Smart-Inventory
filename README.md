# Smart Inventory Management System

A comprehensive inventory management system built with Next.js, TypeScript, and MySQL. Features advanced billing system with product images similar to Starbucks.

## 🚀 Features

### Core Features
- **User Management**: Role-based access control (Owner, Storekeeper, Cashier)
- **Product Management**: Add, edit, and track products with categories
- **Stock Management**: Real-time stock tracking and movements
- **Advanced Billing System**: Modern POS-like interface with product images
- **Sales Tracking**: Complete transaction history and reporting
- **Request System**: Storekeepers can request product additions, price changes, and stock updates

### Advanced Billing System 🎨
- **Product Images**: Visual product selection with high-quality images
- **Dual Upload Methods**: Support for both URL links and local file uploads
- **Multiple Image Formats**: JPG, PNG, GIF, WebP, BMP support (max 5MB)
- **Drag & Drop**: Easy file upload with drag and drop functionality
- **Customization Panel**: Easy product image management for cashiers
- **Modern UI**: Starbucks-inspired interface with smooth animations
- **Visual Product Cards**: Product images with hover effects and stock indicators
- **Enhanced Cart**: Visual cart items with product images
- **Responsive Design**: Works perfectly on different screen sizes

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, React
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: JWT tokens
- **Styling**: CSS-in-JS with modern design patterns

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=smart_inventory
   DB_PORT=3306
   JWT_SECRET=your_jwt_secret
   ```

4. Run database migrations:
   ```bash
   node testing/migrate-add-product-images.js
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## 🎯 Usage

### Default Admin Account
- **Email**: admin@inventory.com
- **Password**: admin123

### Advanced Billing Features

1. **Product Customization**:
   - Click the 🎨 Customize button in the top-right corner of the billing page
   - Choose between URL input or file upload methods
   - Upload local images (drag & drop supported) or paste image URLs
   - Preview images before saving
   - Remove images if needed

2. **Visual Product Selection**:
   - Products display with images (if available)
   - Hover effects and animations
   - Stock indicators and availability status
   - Grid layout for easy browsing
   - Support for multiple image formats

3. **Enhanced Cart Experience**:
   - Visual cart items with product images
   - Real-time total calculation
   - Smooth quantity adjustments
   - Modern checkout process

## 📱 Screenshots

### Advanced Billing Interface
- Modern product grid with images
- Customization panel for product images
- Enhanced cart with visual items
- Starbucks-inspired design

### Product Customization
- Easy image management
- Preview functionality
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
- **Layout**: Responsive grid system for optimal viewing
- **Branding**: Customizable company information and styling

## 📊 Reporting

- Sales reports with detailed analytics
- Stock movement tracking
- User activity monitoring
- Transaction history

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Secure API endpoints
- Input validation and sanitization

## 🚀 Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for modern inventory management**
