'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // If logged in, go to dashboard
      router.replace('/dashboard');
    } else {
      // Otherwise, go to login
      router.replace('/auth/login');
    }
  }, [router]);

  // We don't render anything because we're redirecting immediately
  return null;
}
