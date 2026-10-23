const BASE_URL = '/api';

const getHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// Auth
export const register = async (email: string, password: string, pinCode?: string) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password, pinCode }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
};

export const login = async (email: string, password: string) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
};

// Entries
export const fetchEntries = async (token: string, month?: string) => {
  const url = month ? `${BASE_URL}/entries?month=${month}` : `${BASE_URL}/entries`;
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) throw new Error('Không thể tải nhật ký');
  return res.json();
};

export const createEntry = async (token: string, data: any) => {
  const res = await fetch(`${BASE_URL}/entries`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
};

export const updateEntry = async (token: string, id: number, data: any) => {
  const res = await fetch(`${BASE_URL}/entries/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
};

export const deleteEntry = async (token: string, id: number) => {
  const res = await fetch(`${BASE_URL}/entries/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Không thể xóa');
  return res.json();
};

// Upload
export const getPresignedUrl = async (token: string, fileType: string, fileName: string) => {
  const res = await fetch(`${BASE_URL}/upload/presigned-url`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ fileType, fileName }),
  });
  if (!res.ok) throw new Error('Không thể tạo upload URL');
  return res.json() as Promise<{ presignedUrl: string; publicUrl: string; key: string }>;
};

export const uploadToR2 = async (presignedUrl: string, file: File) => {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Upload thất bại');
};

// Push notifications
export const getVapidPublicKey = async (token: string) => {
  const res = await fetch(`${BASE_URL}/push/vapid-public-key`, { headers: getHeaders(token) });
  return res.json() as Promise<{ publicKey: string }>;
};

export const subscribePush = async (token: string, subscription: PushSubscriptionJSON) => {
  const res = await fetch(`${BASE_URL}/push/subscribe`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(subscription),
  });
  if (!res.ok) throw new Error('Không thể đăng ký thông báo');
  return res.json();
};
