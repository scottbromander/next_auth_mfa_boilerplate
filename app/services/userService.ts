export async function fetchUserData(token: string) {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Invalid token or user not found');
  const data = await res.json();
  return data.user;
}
