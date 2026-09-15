import type { ChronicleEvent } from '../constants';

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ?? '';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
const sessionKey = 'dog-chronicle-session';

type Session = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string };
};

export type Submission = {
  eventDate: string;
  title: string;
  description: string;
  category: ChronicleEvent['category'];
  dogNames: string[];
  image?: File;
  video?: File;
  audio?: File;
};

export type ParentProfile = { nickname: string; is_admin: boolean };
export type PendingEntry = {
  id: number;
  event_date: string;
  title: string;
  description: string;
  category: ChronicleEvent['category'];
  dog_names: string[];
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  created_at: string;
};

export const chronicleApiEnabled = Boolean(url && publishableKey);

const headers = (token?: string) => ({
  apikey: publishableKey,
  Authorization: `Bearer ${token || publishableKey}`,
  'Content-Type': 'application/json',
});

const readSession = (): Session | null => {
  try {
    return JSON.parse(localStorage.getItem(sessionKey) ?? 'null');
  } catch {
    return null;
  }
};

const request = async <T>(path: string, init: RequestInit = {}, token?: string): Promise<T> => {
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { ...headers(token), ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || payload.error_description || '请求失败，请稍后再试');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
};

const getOrCreateSession = async () => {
  const existing = readSession();
  if (existing && (!existing.expires_at || existing.expires_at > Date.now() / 1000 + 60)) return existing;
  if (existing?.refresh_token) {
    try {
      const refreshed = await request<Session>('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: existing.refresh_token }),
      });
      localStorage.setItem(sessionKey, JSON.stringify(refreshed));
      return refreshed;
    } catch {
      localStorage.removeItem(sessionKey);
      localStorage.removeItem('dog-chronicle-parent');
    }
  }
  const session = await request<Session>('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  localStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
};

export const getRememberedParent = () => localStorage.getItem('dog-chronicle-parent');

export const verifyInvite = async (inviteCode: string, nickname: string) => {
  if (!chronicleApiEnabled) throw new Error('投稿功能尚未完成后台配置');
  const session = await getOrCreateSession();
  const result = await request<{ ok: boolean; nickname?: string }>('/rest/v1/rpc/claim_invite', {
    method: 'POST',
    body: JSON.stringify({ invite_code: inviteCode, parent_nickname: nickname }),
  }, session.access_token);
  if (!result.ok) throw new Error('邀请码不正确');
  localStorage.setItem('dog-chronicle-parent', result.nickname || nickname);
  return result.nickname || nickname;
};

export const getCurrentParentProfile = async (): Promise<ParentProfile | null> => {
  if (!chronicleApiEnabled || !readSession()) return null;
  const session = await getOrCreateSession();
  const rows = await request<ParentProfile[]>(
    '/rest/v1/parent_profiles?select=nickname,is_admin&limit=1',
    {},
    session.access_token,
  );
  return rows[0] ?? null;
};

export const loadPendingEntries = async (): Promise<PendingEntry[]> => {
  const session = await getOrCreateSession();
  return request<PendingEntry[]>(
    '/rest/v1/chronicle_entries?status=eq.pending&select=*&order=created_at.desc',
    {},
    session.access_token,
  );
};

export const reviewEntry = async (id: number, status: 'published' | 'rejected') => {
  const session = await getOrCreateSession();
  await request(`/rest/v1/chronicle_entries?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ status, reviewed_at: new Date().toISOString() }),
  }, session.access_token);
};

const upload = async (file: File, kind: 'image' | 'video' | 'audio', session: Session) => {
  if (file.size > 25 * 1024 * 1024) throw new Error(`${kind} 文件不能超过 25 MB`);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const objectPath = `${session.user.id}/${crypto.randomUUID()}-${kind}-${safeName}`;
  const response = await fetch(`${url}/storage/v1/object/chronicle-media/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: file,
  });
  if (!response.ok) throw new Error(`${kind} 上传失败`);
  return `${url}/storage/v1/object/public/chronicle-media/${objectPath}`;
};

export const submitChronicleEntry = async (submission: Submission) => {
  const session = await getOrCreateSession();
  const [imageUrl, videoUrl, audioUrl] = await Promise.all([
    submission.image ? upload(submission.image, 'image', session) : null,
    submission.video ? upload(submission.video, 'video', session) : null,
    submission.audio ? upload(submission.audio, 'audio', session) : null,
  ]);
  await request('/rest/v1/chronicle_entries', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      event_date: submission.eventDate,
      title: submission.title,
      description: submission.description,
      category: submission.category,
      dog_names: submission.dogNames,
      image_url: imageUrl,
      video_url: videoUrl,
      audio_url: audioUrl,
    }),
  }, session.access_token);
};

export const loadPublishedEntries = async (): Promise<ChronicleEvent[]> => {
  if (!chronicleApiEnabled) return [];
  const rows = await request<Array<Record<string, unknown>>>(
    '/rest/v1/chronicle_entries?status=eq.published&select=*&order=event_date.asc',
  );
  return rows.map((row) => {
    const date = new Date(`${row.event_date}T12:00:00`);
    return {
      id: `db-${row.id}`,
      year: String(date.getFullYear()),
      date: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).replace(',', '.'),
      title: String(row.title),
      description: String(row.description),
      category: row.category as ChronicleEvent['category'],
      dogNames: row.dog_names as string[],
      image: row.image_url ? String(row.image_url) : undefined,
      video: row.video_url ? String(row.video_url) : undefined,
      audio: row.audio_url ? String(row.audio_url) : undefined,
    };
  });
};
