// Test script to verify stock display logic
function getActualStock(product) {
  return product.current_stock !== undefined ? product.current_stock : product.stock;
}

// Test data similar to what the API returns
const testProducts = [
  {
    id: 7,
    name: "Apple",
    price: "120.00",
    stock: 0,
    category: "Fruits",
    current_stock: "55"
  },
  {
    id: 1,
    name: "Papaya",
    price: "250.00",
    stock: 180,
    category: "Other",
    current_stock: "230"
  },
  {
    id: 2,
    name: "Carrot",
    price: "240.00",
    stock: 0,
    category: "Other",
    current_stock: "50"
  }
];

console.log('🧪 Testing Stock Display Logic');
console.log('');

testProducts.forEach(product => {
  const actualStock = getActualStock(product);
  console.log(`📦 ${product.name}:`);
  console.log(`  - Base Stock: ${product.stock}kg`);
  console.log(`  - Current Stock: ${product.current_stock}kg`);
  console.log(`  - Displayed Stock: ${actualStock}kg`);
  console.log(`  - Status: ${actualStock <= 0 ? 'Out of Stock' : actualStock <= 10 ? 'Low Stock' : 'In Stock'}`);
  console.log('');
});

// Test edge cases
console.log('🔍 Testing Edge Cases:');
const edgeCaseProduct = {
  id: 999,
  name: "Test Product",
  price: "100.00",
  stock: 5,
  category: "Test"
  // No current_stock field
};

const edgeCaseStock = getActualStock(edgeCaseProduct);
console.log(`📦 ${edgeCaseProduct.name}:`);
console.log(`  - Base Stock: ${edgeCaseProduct.stock}kg`);
console.log(`  - Current Stock: undefined`);
console.log(`  - Displayed Stock: ${edgeCaseStock}kg (fallback to base stock)`);
console.log('');

console.log('✅ Stock display logic test completed!');
console.log('📝 Summary:');
console.log('  - Products with current_stock use that value');
console.log('  - Products without current_stock fallback to base stock');
console.log('  - Stock status is calculated based on actual displayed stock');
