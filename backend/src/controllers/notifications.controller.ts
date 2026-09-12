import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';

async function sendExpoPush(pushToken: string, title: string, body: string, data: any) {
  const payload = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && 'errors' in json
        ? (json as any)?.errors?.[0]?.message
        : null;
    throw new Error(msg || `Expo push failed (${res.status})`);
  }

  return json;
}

export async function sendTestPush(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ data: null, error: { message: 'User not found' }, message: 'User not found' });
    }

    if (!user.pushToken) {
      return res.status(400).json({
        data: null,
        error: { message: 'No pushToken saved for this user. Register token in Settings → Powiadomienia.' },
        message: 'No pushToken saved for this user. Register token in Settings → Powiadomienia.',
      });
    }

    const response = await sendExpoPush(
      user.pushToken,
      'SubsGuard – test',
      `Test push: ${new Date().toLocaleString()}`,
      { type: 'test' }
    );

    return res.json({ data: { ok: true, response }, error: null, message: null });
  } catch (error: any) {
    return res.status(400).json({ data: null, error: { message: error.message }, message: error.message });
  }
}
