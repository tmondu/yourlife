import React, { useState, useEffect } from 'react';
import { Bell, Lock, LogOut, ChevronRight, Users, Heart, Check, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { getVapidPublicKey, subscribePush, updatePartner, getMe } from '../../lib/api';

export const SettingsView: React.FC = () => {
  const { token, user, updateUser, logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [partnerInput, setPartnerInput] = useState(user?.partnerId || '');
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerSuccess, setPartnerSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      getMe(token)
        .then((data) => {
          if (data.partnerId !== user?.partnerId) {
            updateUser({ partnerId: data.partnerId });
            setPartnerInput(data.partnerId || '');
          }
        })
        .catch(() => {});
    }
  }, [token]);

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

  const handleSavePartnerId = async (newPartnerId: string | null) => {
    if (!token) return;
    setPartnerLoading(true);
    try {
      const res = await updatePartner(token, newPartnerId);
      updateUser({ partnerId: res.partnerId });
      setPartnerInput(res.partnerId || '');
      setPartnerSuccess(true);
      setTimeout(() => setPartnerSuccess(false), 3000);
    } catch (err) {
      alert('Không thể lưu Partner ID: ' + (err as Error).message);
    } finally {
      setPartnerLoading(false);
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
            {user?.email?.[0]?.toUpperCase() || 'Y'}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">{user?.email || 'Người dùng'}</p>
            <p className="text-xs text-zinc-500">
              {user?.partnerId ? (
                <span className="text-pink-400 font-medium flex items-center gap-1 mt-0.5">
                  <Heart size={12} fill="currentColor" /> Không gian: {user.partnerId}
                </span>
              ) : (
                'Tài khoản cá nhân'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Partner ID / Shared Space */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2.5 text-zinc-100">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0 text-pink-400">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Không gian chia sẻ (Partner ID)</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cùng nhập chung 1 mã để 2 hoặc nhiều người cùng xem nhật ký của nhau
            </p>
          </div>
        </div>

        <div className="pt-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={partnerInput}
              onChange={(e) => setPartnerInput(e.target.value)}
              placeholder="Ví dụ: love2026, team-chung..."
              className="flex-1 bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
            <button
              onClick={() => handleSavePartnerId(partnerInput)}
              disabled={partnerLoading || partnerInput.trim() === (user?.partnerId || '')}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 disabled:opacity-40 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              {partnerLoading ? 'Đang lưu...' : 'Lưu mã'}
            </button>
          </div>

          {user?.partnerId && (
            <div className="mt-2.5 flex items-center justify-between text-xs bg-pink-500/10 border border-pink-500/20 rounded-xl px-3 py-2 text-pink-300">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-pink-400" />
                Đang kết nối không gian: <strong>{user.partnerId}</strong>
              </span>
              <button
                onClick={() => handleSavePartnerId(null)}
                className="text-zinc-400 hover:text-red-400 transition-colors underline"
              >
                Rời không gian
              </button>
            </div>
          )}

          {partnerSuccess && (
            <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
              <Check size={14} /> Đã cập nhật không gian chia sẻ thành công!
            </p>
          )}
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
