import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST: Upload image file
export async function POST(req: NextRequest) {
  try {
    console.log('Upload API called');
    
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    console.log('File received:', file ? {
      name: file.name,
      type: file.type,
      size: file.size
    } : 'No file');
    
    if (!file) {
      return NextResponse.json({ message: 'No image file provided' }, { status: 400 });
    }

    // Validate file type - be more flexible with MIME types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      console.log('File type validation failed:', { type: file.type, extension: fileExtension });
      return NextResponse.json({ 
        message: `Invalid file type: ${file.type}. Please upload JPG, PNG, GIF, WebP, or BMP images only.` 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        message: 'File too large. Please upload images smaller than 5MB.' 
      }, { status: 400 });
    }

    // Create images/products directory if it doesn't exist
    const imagesDir = join(process.cwd(), 'public', 'images', 'products');
    console.log('Images directory:', imagesDir);
    
    if (!existsSync(imagesDir)) {
      console.log('Creating images/products directory...');
      await mkdir(imagesDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `product_${timestamp}_${randomString}.${fileExtension}`;
    const filePath = join(imagesDir, fileName);
    
    console.log('Saving file to:', filePath);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    console.log('File saved successfully');

    // Return the filename (not the full path)
    console.log('Filename for database:', fileName);

    return NextResponse.json({ 
      message: 'Image uploaded successfully',
      filename: fileName
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      message: error.message || 'Failed to upload image' 
    }, { status: 500 });
  }
}
