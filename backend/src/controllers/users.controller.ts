import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';

export async function setPushToken(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { pushToken } = req.body;

    if (!userId) {
      return res.status(401).json({ data: null, error: { message: 'Unauthorized' }, message: 'Unauthorized' });
    }

    if (pushToken !== null && pushToken !== undefined && typeof pushToken !== 'string') {
      return res.status(400).json({ data: null, error: { message: 'pushToken must be a string or null' }, message: 'pushToken must be a string or null' });
    }

    const normalized = typeof pushToken === 'string' ? pushToken.trim() : null;

    const user = await User.findByIdAndUpdate(userId, { pushToken: normalized || null }, { new: true });
    if (!user) {
      return res.status(404).json({ data: null, error: { message: 'User not found' }, message: 'User not found' });
    }

    return res.json({ data: { pushToken: user.pushToken }, error: null, message: null });
  } catch (error: any) {
    return res.status(400).json({ data: null, error: { message: error.message }, message: error.message });
  }
}
