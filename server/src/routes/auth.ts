import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, pinCode, partnerId } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
      return;
    }

    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email đã tồn tại' });
      return;
    }

    const cleanPartnerId = partnerId && typeof partnerId === 'string' && partnerId.trim() ? partnerId.trim() : null;
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.insert(schema.users).values({
      email,
      passwordHash,
      pinCode: pinCode || null,
      partnerId: cleanPartnerId,
    });

    const newUserId = (result as any).insertId;
    const token = jwt.sign({ userId: newUserId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.status(201).json({
      token,
      userId: newUserId,
      user: { id: newUserId, email, partnerId: cleanPartnerId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.json({
      token,
      userId: user.id,
      user: { id: user.id, email: user.email, partnerId: user.partnerId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy người dùng' });
      return;
    }
    res.json({ id: user.id, email: user.email, partnerId: user.partnerId });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/auth/partner
router.put('/partner', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { partnerId } = req.body;
    const cleanPartnerId = partnerId && typeof partnerId === 'string' && partnerId.trim() ? partnerId.trim() : null;

    await db.update(schema.users)
      .set({ partnerId: cleanPartnerId })
      .where(eq(schema.users.id, req.userId!));

    res.json({ success: true, partnerId: cleanPartnerId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi cập nhật partnerId' });
  }
});

// POST /api/auth/verify-pin
router.post('/verify-pin', async (req: Request, res: Response) => {
  try {
    const { userId, pin } = req.body;
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user || user.pinCode !== pin) {
      res.status(401).json({ error: 'Mã PIN không đúng' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;
