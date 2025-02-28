import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
// import valkey from '../../../../lib/valkey';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // 2. Verify the JWT
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 3. Retrieve user session from Valkey (optional)
    // If you store JWT in Redis to see if it's still valid
    // const userSession = await valkey.get(`session:${decoded.userId}`);
    // if (!userSession) {
    //   return NextResponse.json({ error: "Session expired" }, { status: 401 });
    // }

    // 4. Fetch user from DB
    const result = await pool.query(
      'SELECT id, email, role, mfa_enabled FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const dbUser = result.rows[0];

    const userData = {
      email: dbUser.email,
      role: dbUser.role,
      mfaEnabled: dbUser.mfa_enabled,
    };

    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error) {
    console.error('❌ /api/auth/me error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
