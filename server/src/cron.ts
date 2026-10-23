import cron from 'node-cron';
import webpush from 'web-push';
import { db, schema } from './db';
import { eq } from 'drizzle-orm';

export function setupCronJobs() {
  // Chạy lúc 20:30 mỗi tối (giờ Việt Nam = UTC+7, tức 13:30 UTC)
  cron.schedule('30 13 * * *', async () => {
    console.log('[Cron] Kiểm tra nhắc nhở viết nhật ký...');
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Lấy tất cả users có push subscription
      const subscriptions = await db.select().from(schema.pushSubscriptions);

      for (const sub of subscriptions) {
        // Kiểm tra xem user đã viết nhật ký hôm nay chưa
        const [todayEntry] = await db
          .select({ id: schema.entries.id })
          .from(schema.entries)
          .where(eq(schema.entries.userId, sub.userId) && eq(schema.entries.date, today))
          .limit(1);

        if (!todayEntry) {
          // Chưa viết -> gửi thông báo nhắc nhở
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: '📖 YourLife nhắc bạn',
                body: 'Hôm nay bạn chưa ghi nhật ký! Hãy lưu lại khoảnh khắc của ngày hôm nay nhé 💫',
                icon: '/icons/icon-192.png',
                badge: '/icons/badge-72.png',
                url: '/',
              })
            );
            console.log(`[Cron] Đã gửi nhắc nhở cho user ${sub.userId}`);
          } catch (pushErr: any) {
            if (pushErr.statusCode === 410) {
              // Subscription đã hết hạn, xóa đi
              await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, sub.id));
            }
          }
        }
      }
    } catch (err) {
      console.error('[Cron] Lỗi:', err);
    }
  });

  console.log('[Cron] Đã khởi động cron job nhắc nhở lúc 20:30');
}
