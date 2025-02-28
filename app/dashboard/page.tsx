'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/hooks/useUser';

type ProtectedItem = {
  id: number;
  name: string;
  details?: string;
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [items, setItems] = useState<ProtectedItem[]>([]);
  const [fetchingItems, setFetchingItems] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetch('/api/protected', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Forbidden');
        }
        return res.json();
      })
      .then((data) => {
        setItems(data.items);
      })
      .catch((err) => {
        console.error('Failed to fetch protected items:', err);
        router.push('/auth/login');
      })
      .finally(() => setFetchingItems(false));
  }, [loading, user, router]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem('token');
      router.push('/auth/login');
    } catch (error) {
      console.error('Failed to log out:', error);
      router.push('/auth/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading user...</p>
      </div>
    );
  }

  if (!user) return null;

  if (fetchingItems) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading protected items...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-xl font-bold text-center">User Dashboard</h1>

        {/* Basic user info */}
        <p className="text-center text-gray-600 mt-2">
          Welcome, <span className="font-semibold">{user.email}</span>
        </p>
        <div className="mt-4 p-4 border rounded-lg">
          <p className="font-semibold">Your Role:</p>
          <span
            className={`px-2 py-1 rounded-lg text-sm ${
              user.role === 'advanced'
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {user.role === 'advanced' ? 'Advanced User' : 'Basic User'}
          </span>
        </div>

        {/* Protected Items */}
        <div className="mt-6 p-4 border rounded-lg">
          <p className="font-semibold">Your Protected Data:</p>
          {items.map((item) => (
            <p key={item.id} className="text-gray-600 mt-2">
              {item.name}
              {item.details && ` - ${item.details}`}
            </p>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
