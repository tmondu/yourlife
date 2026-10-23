import { Router, Response } from 'express';
import { db, schema } from '../db';
import { eq, and, desc, like } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/entries?month=2024-10
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { month } = req.query; // format: YYYY-MM

    let conditions = [eq(schema.entries.userId, userId)];
    if (month && typeof month === 'string') {
      conditions.push(like(schema.entries.date, `${month}%`));
    }

    const result = await db
      .select()
      .from(schema.entries)
      .where(and(...conditions))
      .orderBy(desc(schema.entries.date))
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
    const [entry] = await db
      .select()
      .from(schema.entries)
      .where(and(eq(schema.entries.id, parseInt(req.params['id'] as string)), eq(schema.entries.userId, req.userId!)))
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
