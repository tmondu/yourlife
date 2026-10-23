import React, { useState } from 'react';
import { Bell, Lock, LogOut, ChevronRight, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { getVapidPublicKey, subscribePush } from '../../lib/api';

export const SettingsView: React.FC = () => {
  const { token, user, logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEnablePush = async () => {
    if (!token || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ thông báo đẩy');
      return;
    }
    setLoading(true);
    try {
      const { publicKey } = await getVapidPublicKey(token);
      const sw = await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });
      await subscribePush(token, sub.toJSON() as PushSubscriptionJSON);
      setPushEnabled(true);
      alert('✅ Đã bật thông báo nhắc viết nhật ký lúc 20:30 mỗi tối!');
    } catch (err) {
      alert('Không thể bật thông báo. Vui lòng cấp quyền trong cài đặt trình duyệt.');
    } finally {
      setLoading(false);
    }
  };

  const settings = [
    {
      icon: Bell,
      label: 'Thông báo nhắc nhở',
      description: 'Nhắc viết nhật ký lúc 20:30 mỗi tối',
      action: handleEnablePush,
      badge: pushEnabled ? '✅ Đã bật' : 'Chưa bật',
      loading,
    },
    {
      icon: Lock,
      label: 'Mã PIN bảo vệ',
      description: 'Thêm lớp bảo mật khi mở app',
      action: () => alert('Tính năng sắp ra mắt!'),
    },
  ];

  return (
    <div className="content-area px-4 py-4 pb-safe space-y-4">
      {/* User info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
          {user?.email?.[0]?.toUpperCase() || 'Y'}
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">{user?.email || 'Người dùng'}</p>
          <p className="text-xs text-zinc-500">Tài khoản cá nhân</p>
        </div>
      </div>

      {/* Settings list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
        {settings.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={item.action}
              disabled={item.loading}
              className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-zinc-800/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
              </div>
              {item.badge ? (
                <span className="text-xs text-zinc-400">{item.badge}</span>
              ) : (
                <ChevronRight size={16} className="text-zinc-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Install banner */}
      <div className="bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/20 rounded-2xl p-4">
        <p className="text-sm font-semibold text-purple-300 mb-1">📱 Cài app ra màn hình chính</p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Trên iPhone: Bấm biểu tượng <strong>Chia sẻ ⎋</strong> → chọn <strong>Thêm vào Màn hình Chính (+)</strong>
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed mt-1">
          Trên Android: Bấm menu <strong>⋮</strong> → chọn <strong>Thêm vào màn hình chính</strong>
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
      >
        <LogOut size={16} />
        Đăng xuất
      </button>

      <p className="text-center text-xs text-zinc-700 pb-2">YourLife v1.0.0 • Dữ liệu được mã hóa & bảo mật</p>
    </div>
  );
};
