import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Image, X, Check, ChevronLeft } from 'lucide-react';
import { MOODS, Mood } from '../../lib/types';
import { compressAndUpload } from '../../lib/utils';
import { saveDraft, deleteDraft, getDraft } from '../../lib/db';
import { createEntry, updateEntry } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { Entry } from '../../lib/types';
import { getTodayDate, formatDateVi } from '../../lib/utils';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface EditorProps {
  entry?: Entry;
  date?: string;
  onSave: (entry: Entry) => void;
  onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ entry, date, onSave, onBack }) => {
  const { token } = useAuthStore();
  const currentDate = date || entry?.date || getTodayDate();

  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState<Mood>(entry?.mood || 'neutral');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [images, setImages] = useState<string[]>(entry?.images || []);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft
  useEffect(() => {
    if (!entry) {
      getDraft(currentDate).then((draft) => {
        if (draft) {
          setContent(draft.content || '');
          setTitle(draft.title || '');
          setMood((draft.mood as Mood) || 'neutral');
          setTags(draft.tags || []);
          setImages(draft.images || []);
        }
      });
    }
  }, [currentDate, entry]);

  // Auto-save draft
  const scheduleSave = useCallback(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      saveDraft({ date: currentDate, title, content, mood, tags, images });
    }, 1000);
  }, [currentDate, title, content, mood, tags, images]);

  useEffect(() => { scheduleSave(); }, [title, content, mood, tags, images, scheduleSave]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const url = await compressAndUpload(file, token, setUploadProgress);
      setImages((prev) => [...prev, url]);
    } catch (err) {
      alert('Lỗi upload ảnh');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags((prev) => [...new Set([...prev, tagInput.trim()])]);
      setTagInput('');
    }
  };

  const handleSave = async () => {
    if (!content.trim() || !token) return;
    setSaving(true);
    try {
      let saved: Entry;
      const payload = { date: currentDate, title: title || undefined, content, mood, tags, images };
      if (entry) {
        saved = await updateEntry(token, entry.id, payload);
      } else {
        saved = await createEntry(token, payload);
      }
      await deleteDraft(currentDate);
      onSave(saved);
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu nhật ký');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          background: 'rgba(15,15,17,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #27272a',
        }}
      >
        <button onClick={onBack} className="text-zinc-400 hover:text-zinc-100 p-1">
          <ChevronLeft size={22} />
        </button>
        <div className="text-center">
          <p className="text-xs text-zinc-500">{formatDateVi(currentDate)}</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving} disabled={!content.trim()}>
          <Check size={16} /> Lưu
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto content-area px-4 py-4 space-y-4 pb-safe">
        {/* Mood Selector */}
        <div>
          <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Cảm xúc hôm nay</p>
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all flex-1',
                  mood === m.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-zinc-800 bg-zinc-900/50'
                )}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-[10px] text-zinc-400">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề (không bắt buộc)"
          className="bg-transparent border-none text-lg font-semibold text-zinc-100 placeholder:text-zinc-600 px-0"
          style={{ borderRadius: 0, padding: '0' }}
        />

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Hôm nay bạn cảm thấy thế nào? Hãy ghi lại những khoảnh khắc đáng nhớ... ✍️"
          className="min-h-48 text-zinc-200 leading-relaxed"
          autoFocus
        />

        {/* Images */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="space-y-1">
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">Đang upload ảnh... {uploadProgress}%</p>
          </div>
        )}

        {/* Tags */}
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/15 text-purple-300 rounded-full text-xs"
              >
                #{tag}
                <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Thêm tag (Enter để thêm)"
            className="text-sm"
            style={{ padding: '8px 12px' }}
          />
        </div>

        {/* Image upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-purple-400 transition-colors py-2"
        >
          <Image size={18} />
          <span>Thêm ảnh</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
};
