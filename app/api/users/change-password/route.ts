import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { comparePassword, hashPassword, verifyToken } from 'lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'New passwords do not match' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ message: 'Password must be at least 4 characters' }, { status: 400 });
    }

    // Get current user's password
    const users = await query('SELECT password FROM users WHERE id = ?', [decoded.userId]) as any[];
    if (users.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const currentHashedPassword = users[0].password;

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, currentHashedPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const newHashedPassword = await hashPassword(newPassword);

    // Update password
    await query('UPDATE users SET password = ? WHERE id = ?', [newHashedPassword, decoded.userId]);

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to change password' }, { status: 500 });
  }
} 