// app/hooks/useUser.ts
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserData } from '../services/userService';

export function useUser() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchUserData(token)
      .then((userData) => setUser(userData))
      .catch(() => router.push('/auth/login'))
      .finally(() => setLoading(false));
  }, [router]);

  return { user, loading };
}
