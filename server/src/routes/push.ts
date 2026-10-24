import { Router, Response } from 'express';
import webpush from 'web-push';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

try {
  if (process.env.VAPID_EMAIL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
} catch (err) {
  console.warn('[WebPush] Cảnh báo: VAPID keys chưa hợp lệ hoặc thiếu:', (err as Error).message);
}

// POST /api/push/subscribe
router.post('/subscribe', async (req: AuthRequest, res: Response) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: 'Thiếu thông tin subscription' });
      return;
    }

    // Xóa subscription cũ nếu có
    await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, req.userId!));

    // Lưu subscription mới
    await db.insert(schema.pushSubscriptions).values({
      userId: req.userId!,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi lưu subscription' });
  }
});

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', (req: AuthRequest, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

export default router;
