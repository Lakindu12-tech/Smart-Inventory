import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { comparePassword, generateToken } from 'lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }
    // Find user by email or username (only active users)
    const users: any = await query(
      'SELECT * FROM users WHERE (email = ? OR name = ?) AND is_active = TRUE LIMIT 1',
      [email, email]
    );
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'User not found or account deactivated.' }, { status: 401 });
    }
    const user = users[0];
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ message: 'Invalid password.' }, { status: 401 });
    }
    const token = generateToken(user.id, user.role, user.name);
    return NextResponse.json({ token, role: user.role, name: user.name });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Login failed.' }, { status: 500 });
  }
} 