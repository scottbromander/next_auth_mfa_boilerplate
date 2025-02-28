import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../../lib/requireRole';

export async function GET(req: NextRequest) {
  const userRole = await requireRole(req, ['basic', 'advanced']);
  if (typeof userRole !== 'string') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const generalData = [
    { id: 1, name: 'Public Item 1' },
    { id: 2, name: 'Public Item 2' },
  ];

  const advancedData = [
    { id: 3, name: 'Secret Item A', details: 'Hidden details A' },
    { id: 4, name: 'Secret Item B', details: 'Hidden details B' },
  ];

  if (userRole === 'basic') {
    return NextResponse.json({ items: generalData }, { status: 200 });
  }

  if (userRole === 'advanced') {
    return NextResponse.json(
      { items: [...generalData, ...advancedData] },
      { status: 200 }
    );
  }

  return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
}
