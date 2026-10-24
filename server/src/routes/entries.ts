import { Router, Response } from 'express';
import { db, schema } from '../db';
import { eq, and, desc, like, inArray } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/entries?month=2024-10
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { month } = req.query; // format: YYYY-MM

    // Lấy thông tin user hiện tại để kiểm tra partnerId
    const [currentUser] = await db
      .select({ partnerId: schema.users.partnerId })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    let allowedUserIds = [userId];
    if (currentUser?.partnerId) {
      const partnerUsers = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.partnerId, currentUser.partnerId));
      if (partnerUsers.length > 0) {
        allowedUserIds = partnerUsers.map((u) => u.id);
      }
    }

    const userCondition = allowedUserIds.length === 1
      ? eq(schema.entries.userId, allowedUserIds[0])
      : inArray(schema.entries.userId, allowedUserIds);

    let conditions = [userCondition];
    if (month && typeof month === 'string') {
      conditions.push(like(schema.entries.date, `${month}%`));
    }

    const result = await db
      .select({
        id: schema.entries.id,
        userId: schema.entries.userId,
        date: schema.entries.date,
        title: schema.entries.title,
        content: schema.entries.content,
        mood: schema.entries.mood,
        weather: schema.entries.weather,
        tags: schema.entries.tags,
        images: schema.entries.images,
        createdAt: schema.entries.createdAt,
        updatedAt: schema.entries.updatedAt,
        authorEmail: schema.users.email,
      })
      .from(schema.entries)
      .leftJoin(schema.users, eq(schema.entries.userId, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.entries.date), desc(schema.entries.createdAt))
      .limit(100);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/entries/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const userId = req.userId!;

    const [currentUser] = await db
      .select({ partnerId: schema.users.partnerId })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    let allowedUserIds = [userId];
    if (currentUser?.partnerId) {
      const partnerUsers = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.partnerId, currentUser.partnerId));
      if (partnerUsers.length > 0) {
        allowedUserIds = partnerUsers.map((u) => u.id);
      }
    }

    const userCondition = allowedUserIds.length === 1
      ? eq(schema.entries.userId, allowedUserIds[0])
      : inArray(schema.entries.userId, allowedUserIds);

    const [entry] = await db
      .select({
        id: schema.entries.id,
        userId: schema.entries.userId,
        date: schema.entries.date,
        title: schema.entries.title,
        content: schema.entries.content,
        mood: schema.entries.mood,
        weather: schema.entries.weather,
        tags: schema.entries.tags,
        images: schema.entries.images,
        createdAt: schema.entries.createdAt,
        updatedAt: schema.entries.updatedAt,
        authorEmail: schema.users.email,
      })
      .from(schema.entries)
      .leftJoin(schema.users, eq(schema.entries.userId, schema.users.id))
      .where(and(eq(schema.entries.id, id), userCondition))
      .limit(1);

    if (!entry) { res.status(404).json({ error: 'Không tìm thấy' }); return; }
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/entries
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { date, title, content, mood, weather, tags, images } = req.body;
    if (!content || !date) {
      res.status(400).json({ error: 'Nội dung và ngày là bắt buộc' });
      return;
    }

    const [result] = await db.insert(schema.entries).values({
      userId: req.userId!,
      date,
      title: title || null,
      content,
      mood: mood || 'neutral',
      weather: weather || null,
      tags: tags || [],
      images: images || [],
    });

    const [newEntry] = await db.select().from(schema.entries).where(eq(schema.entries.id, (result as any).insertId)).limit(1);
    res.status(201).json(newEntry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/entries/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const [existing] = await db
      .select()
      .from(schema.entries)
      .where(and(eq(schema.entries.id, id), eq(schema.entries.userId, req.userId!)))
      .limit(1);
    if (!existing) { res.status(404).json({ error: 'Không tìm thấy' }); return; }

    const { title, content, mood, weather, tags, images } = req.body;
    await db.update(schema.entries).set({
      title: title !== undefined ? title : existing.title,
      content: content || existing.content,
      mood: mood || existing.mood,
      weather: weather !== undefined ? weather : existing.weather,
      tags: tags !== undefined ? tags : existing.tags,
      images: images !== undefined ? images : existing.images,
    }).where(eq(schema.entries.id, id));

    const [updated] = await db.select().from(schema.entries).where(eq(schema.entries.id, id)).limit(1);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/entries/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const [existing] = await db
      .select()
      .from(schema.entries)
      .where(and(eq(schema.entries.id, id), eq(schema.entries.userId, req.userId!)))
      .limit(1);
    if (!existing) { res.status(404).json({ error: 'Không tìm thấy' }); return; }

    await db.delete(schema.entries).where(eq(schema.entries.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;
