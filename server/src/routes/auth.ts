import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, pinCode } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
      return;
    }

    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email đã tồn tại' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.insert(schema.users).values({
      email,
      passwordHash,
      pinCode: pinCode || null,
    });

    const token = jwt.sign({ userId: (result as any).insertId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.status(201).json({ token, userId: (result as any).insertId });
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
    res.json({ token, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
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
