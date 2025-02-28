import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import valkey from '../../../../lib/valkey'; // Import Valkey connection
import nodemailer from 'nodemailer';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

if (
  !process.env.JWT_SECRET ||
  !process.env.SMTP_HOST ||
  !process.env.SMTP_USER ||
  !process.env.SMTP_PASS
) {
  throw new Error(
    'Missing required environment variables for authentication and email.'
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587, // Default to 587 if not set
  secure: false, // Use STARTTLS if false; set to true for SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.mfa_enabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
      const sessionId = uuidv4(); // Temporary session ID

      // Store OTP in Valkey with 5-minute expiration
      await valkey.setex(
        `mfa:${sessionId}`,
        300,
        JSON.stringify({ email, otp })
      );

      try {
        await transporter.sendMail({
          from: `"Scott's Test App" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'MFA Code',
          text: `Your MFA code is: ${otp}. It will expire in 5 minutes.`,
        });

        console.log(`✅ OTP sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Error sending OTP email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send OTP email. Please try again.' },
          { status: 500 }
        );
      }

      // Return MFA info to the client
      return NextResponse.json({ mfaRequired: true, sessionId });
    }

    // If MFA is NOT enabled, log the user in immediately
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      {
        expiresIn: '1h',
      }
    );

    // Store session in Valkey (for tracking session state)
    await valkey.setex(`session:${user.id}`, 3600, token);

    console.log(`✅ User ${email} logged in successfully`);

    return NextResponse.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
