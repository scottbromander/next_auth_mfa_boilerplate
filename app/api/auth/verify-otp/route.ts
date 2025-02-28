import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import valkey from '../../../../lib/valkey';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  try {
    const { sessionId, otp } = await req.json();

    if (!sessionId || !otp) {
      return NextResponse.json(
        { error: 'Session ID and OTP are required' },
        { status: 400 }
      );
    }

    console.log(`OTP: ${otp}`);
    const storedData = await valkey.get(`mfa:${sessionId}`);
    console.log('Stored data:', storedData);

    if (!storedData) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP session' },
        { status: 400 }
      );
    }

    const { email, otp: storedOtp } = JSON.parse(storedData);
    console.log(`OTP: ${otp}, STORED: ${storedOtp}`);

    if (storedOtp.toString() !== otp.toString()) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      {
        expiresIn: '1h',
      }
    );

    await valkey.del(`mfa:${sessionId}`);

    return NextResponse.json({ message: 'MFA successful', token });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  } catch (error) {
    console.error('❌ MFA verification error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
