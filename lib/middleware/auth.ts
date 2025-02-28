import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function requireRole(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles: string[]
) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };
    const userQuery = await pool.query('SELECT role FROM users WHERE id = $1', [
      decoded.userId,
    ]);

    if (userQuery.rowCount === 0) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const userRole = userQuery.rows[0].role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    return userRole;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
