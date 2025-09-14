"use client";
import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  price: string;
  current_stock: number;
  category: string;
  image_filename?: string;
}

interface ProductCustomizationModalProps {
  show: boolean;
  onClose: () => void;
  products: Product[];
  onImageUpdate: (productId: number, imageFilename: string) => void;
}

export default function ProductCustomizationModal({
  show,
  onClose,
  products,
  onImageUpdate
}: ProductCustomizationModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImageUpdate = async () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Upload file first
      const formData = new FormData();
      formData.append('image', selectedFile);

      console.log('Uploading file:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        throw new Error(uploadData.message || 'Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      const imageFilename = uploadResult.filename;
      
      console.log('Upload successful, filename:', imageFilename);

      // Update product image in database
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${selectedProduct.id}/image`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image_filename: imageFilename })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update product image');
      }

      setSuccess('Product image updated successfully!');
      onImageUpdate(selectedProduct.id, imageFilename);
      
      // Reset form
      setImageUrl('');
      setSelectedFile(null);
      setSelectedProduct(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error: any) {
      console.error('Error in handleImageUpdate:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setImageUrl(product.image_filename || '');
    setSelectedFile(null);
    setError('');
    setSuccess('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError(`Invalid file type: ${file.type}. Please select JPG, PNG, GIF, WebP, or BMP images only.`);
        return;
      }
      
      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.`);
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  if (!show) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '16px'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#333', fontSize: '24px', fontWeight: 700 }}>
              🎨 Product Customization
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
              Manage product images for better billing experience
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '8px',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Product Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '18px' }}>
            Select Product
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '12px',
            maxHeight: '200px',
            overflow: 'auto',
            padding: '8px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px'
          }}>
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => handleProductSelect(product)}
                style={{
                  background: selectedProduct?.id === product.id ? '#1ecb4f' : '#f8f9fa',
                  color: selectedProduct?.id === product.id ? 'white' : '#333',
                  border: `2px solid ${selectedProduct?.id === product.id ? '#1ecb4f' : '#e0e0e0'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{product.name}</span>
                                 <span style={{ fontSize: '12px', opacity: 0.8 }}>
                   {product.image_filename ? '🖼️ Has Image' : '📷 No Image'}
                 </span>
              </button>
            ))}
          </div>
        </div>

                 {/* Image Management */}
         {selectedProduct && (
           <div style={{ 
             background: '#f8f9fa', 
             padding: '20px', 
             borderRadius: '12px',
             border: '1px solid #e0e0e0'
           }}>
             <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '18px' }}>
               Manage Image for: <span style={{ color: '#1ecb4f' }}>{selectedProduct.name}</span>
             </h3>
             
                           {/* Upload Method Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#333' }}>
                  Upload Image File:
                </label>
                <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
                  Select an image file to upload. The system will automatically save it and display it in the billing system.
                </p>
              </div>

                           {/* File Upload */}
               <div style={{ marginBottom: '16px' }}>
                 <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>
                   Select Image File:
                 </label>
                 <div style={{
                   border: '2px dashed #ddd',
                   borderRadius: '8px',
                   padding: '20px',
                   textAlign: 'center',
                   background: '#fafafa',
                   cursor: 'pointer',
                   transition: 'all 0.2s'
                 }}
                 onDragOver={(e) => {
                   e.preventDefault();
                   e.currentTarget.style.borderColor = '#1ecb4f';
                   e.currentTarget.style.background = '#f0f9f0';
                 }}
                 onDragLeave={(e) => {
                   e.currentTarget.style.borderColor = '#ddd';
                   e.currentTarget.style.background = '#fafafa';
                 }}
                                   onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      console.log('File dropped:', file.name, file.type, file.size);
                      
                      // Validate file type
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
                      const fileExtension = file.name.toLowerCase().split('.').pop();
                      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
                      
                      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
                        setError(`Invalid file type: ${file.type}. Please select JPG, PNG, GIF, WebP, or BMP images only.`);
                        e.currentTarget.style.borderColor = '#ddd';
                        e.currentTarget.style.background = '#fafafa';
                        return;
                      }
                      
                      // Validate file size (5MB)
                      const maxSize = 5 * 1024 * 1024;
                      if (file.size > maxSize) {
                        setError(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.`);
                        e.currentTarget.style.borderColor = '#ddd';
                        e.currentTarget.style.background = '#fafafa';
                        return;
                      }
                      
                      setSelectedFile(file);
                      setError('');
                    } else {
                      setError('Please drop a valid image file (JPG, PNG, GIF, WebP, or BMP)');
                    }
                    e.currentTarget.style.borderColor = '#ddd';
                    e.currentTarget.style.background = '#fafafa';
                  }}
                 >
                   <input
                     type="file"
                     accept="image/*"
                     onChange={handleFileSelect}
                     style={{ display: 'none' }}
                     id="file-upload"
                   />
                   <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                     <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
                     <div style={{ fontSize: '16px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                       {selectedFile ? selectedFile.name : 'Click to select or drag & drop'}
                     </div>
                     <div style={{ fontSize: '14px', color: '#666' }}>
                       Supports: JPG, PNG, GIF, WebP, BMP (Max 5MB)
                     </div>
                   </label>
                 </div>
                 {selectedFile && (
                   <div style={{ 
                     marginTop: '12px', 
                     padding: '8px 12px', 
                     background: '#e8f5e8', 
                     borderRadius: '6px',
                     fontSize: '14px',
                     color: '#2d5a2d'
                   }}>
                     ✅ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                   </div>
                 )}
                               </div>

                          {/* Preview */}
              {selectedFile && (
               <div style={{ marginBottom: '16px' }}>
                 <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>
                   Preview:
                 </label>
                 <div style={{
                   width: '120px',
                   height: '120px',
                   border: '2px solid #e0e0e0',
                   borderRadius: '8px',
                   overflow: 'hidden',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   background: '#f0f0f0'
                 }}>
                                       <img
                      src={URL.createObjectURL(selectedFile)}
                      alt={selectedProduct.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                   <div style={{
                     display: 'none',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: '#666',
                     fontSize: '12px',
                     textAlign: 'center',
                     padding: '8px'
                   }}>
                     Invalid Image
                   </div>
                 </div>
               </div>
             )}

                         {/* Action Buttons */}
             <div style={{ display: 'flex', gap: '12px' }}>
                               <button
                  onClick={handleImageUpdate}
                  disabled={loading || !selectedFile}
                  style={{
                    background: loading || !selectedFile ? '#ccc' : '#1ecb4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  {loading ? 'Updating...' : 'Update Image'}
                </button>
               
                               {selectedProduct.image_filename && (
                  <button
                    onClick={() => {
                      setImageUrl('');
                      setSelectedFile(null);
                      setSelectedProduct({ ...selectedProduct, image_filename: undefined });
                    }}
                    style={{
                      background: '#ff3b3b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    Remove Image
                  </button>
                )}
             </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div style={{
            background: '#ff3b3b',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            marginTop: '16px',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#1ecb4f',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            marginTop: '16px',
            fontSize: '14px'
          }}>
            ✅ {success}
          </div>
        )}

                 {/* Footer */}
         <div style={{ 
           marginTop: '24px', 
           paddingTop: '16px', 
           borderTop: '1px solid #e0e0e0',
           textAlign: 'center'
         }}>
                       <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              💡 Tip: Select an image file to upload. The system will automatically save it and display it in the billing system.
            </p>
         </div>
      </div>
    </div>
  );
}
