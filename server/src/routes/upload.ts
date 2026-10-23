import { Router, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { randomUUID } from 'crypto';

const router = Router();
router.use(authMiddleware);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// POST /api/upload/presigned-url
router.post('/presigned-url', async (req: AuthRequest, res: Response) => {
  try {
    const { fileType, fileName } = req.body;
    if (!fileType || !fileType.startsWith('image/')) {
      res.status(400).json({ error: 'Chỉ chấp nhận file ảnh' });
      return;
    }

    const ext = fileName?.split('.').pop() || 'jpg';
    const key = `users/${req.userId}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 phút
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

    res.json({ presignedUrl, publicUrl, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tạo presigned URL' });
  }
});

export default router;
