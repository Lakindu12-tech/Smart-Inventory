import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { hashPassword, verifyToken } from 'lib/auth';

// GET - Get all users (Owner only)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'owner') {
      return NextResponse.json({ message: 'Access denied. Owner only.' }, { status: 403 });
    }

    const users = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE role != "owner" AND is_active = TRUE ORDER BY created_at DESC'
    );

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - Add new user (Owner only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'owner') {
      return NextResponse.json({ message: 'Access denied. Owner only.' }, { status: 403 });
    }

    const { name, email, role } = await req.json();

    if (!name || !email || !role) {
      return NextResponse.json({ message: 'Name, email, and role are required' }, { status: 400 });
    }

    if (role === 'owner') {
      return NextResponse.json({ message: 'Cannot create owner accounts' }, { status: 400 });
    }

    // Check if email already exists (including inactive users)
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (existingUser.length > 0) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }

    // Hash default password "1234"
    const hashedPassword = await hashPassword('1234');

    // Insert new user
    const result = await query(
      'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, TRUE)',
      [name, email, hashedPassword, role]
    ) as any;

    return NextResponse.json({ 
      message: 'User created successfully',
      userId: result.insertId,
      defaultPassword: '1234'
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create user' }, { status: 500 });
  }
}

// DELETE - Soft delete user (Owner only)
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'owner') {
      return NextResponse.json({ message: 'Access denied. Owner only.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists and is not an owner
    const existingUser = await query('SELECT id, role FROM users WHERE id = ? AND is_active = TRUE', [userId]) as any[];
    if (existingUser.length === 0) {
      return NextResponse.json({ message: 'User not found or already deleted' }, { status: 404 });
    }

    if (existingUser[0].role === 'owner') {
      return NextResponse.json({ message: 'Cannot delete owner accounts' }, { status: 400 });
    }

    // Soft delete the user by setting is_active to FALSE
    await query('UPDATE users SET is_active = FALSE WHERE id = ?', [userId]);

    return NextResponse.json({ message: 'User deactivated successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to deactivate user' }, { status: 500 });
  }
} 