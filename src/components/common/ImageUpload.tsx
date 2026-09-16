import React, { useCallback, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, Upload, User } from 'lucide-react';

export interface ImageUploadProps {
  value?: string | null;
  file?: File | null;
  onChange: (file: File | null) => void;
  onClearUrl?: () => void;
  label?: string;
  mode?: 'avatar' | 'image';
  maxSizeMB?: number;
  accept?: string;
  disabled?: boolean;
  error?: string;
  allowCamera?: boolean;
}

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  file,
  onChange,
  onClearUrl,
  label = 'تصویر',
  mode = 'avatar',
  maxSizeMB = 5,
  accept = DEFAULT_ACCEPT,
  disabled,
  error,
  allowCamera = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const previewSrc = preview || (file ? URL.createObjectURL(file) : value || null);

  const validate = (f: File): string | null => {
    if (!f.type.startsWith('image/')) return 'فقط فایل تصویری مجاز است.';
    if (f.size > maxSizeMB * 1024 * 1024) return `حداکثر حجم مجاز ${maxSizeMB} مگابایت است.`;
    return null;
  };

  const applyFile = useCallback(
    (f: File | null) => {
      setLocalError(null);
      if (!f) {
        setPreview(null);
        onChange(null);
        return;
      }
      const err = validate(f);
      if (err) {
        setLocalError(err);
        return;
      }
      setPreview(URL.createObjectURL(f));
      onChange(f);
    },
    [onChange, maxSizeMB],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  };

  const clear = () => {
    setPreview(null);
    setLocalError(null);
    onChange(null);
    onClearUrl?.();
    if (inputRef.current) inputRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  };

  const isAvatar = mode === 'avatar';
  const msg = error || localError;

  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-semibold text-secondary">{label}</p>}
      <div className={`flex gap-3 ${isAvatar ? 'items-center' : 'flex-col sm:flex-row'}`}>
        <div
          className={`relative overflow-hidden border border-border bg-surface-elevated flex items-center justify-center shrink-0 ${
            isAvatar ? 'w-20 h-20 rounded-2xl' : 'w-full h-40 rounded-xl'
          }`}
        >
          {previewSrc ? (
            <img src={previewSrc} alt="" className="w-full h-full object-cover" />
          ) : isAvatar ? (
            <User className="w-8 h-8 text-muted" />
          ) : (
            <ImagePlus className="w-10 h-10 text-muted" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`border border-dashed rounded-xl px-3 py-3 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary-soft' : 'border-border bg-input'
            } ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}`}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-ink font-medium">انتخاب یا رها کردن تصویر</p>
            <p className="text-[10px] text-muted mt-0.5">JPG، PNG، WEBP — تا {maxSizeMB}MB</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className="px-3 py-1.5 text-xs rounded-lg border border-border text-ink hover:bg-surface-hover">
              انتخاب فایل
            </button>
            {allowCamera && (
              <button type="button" disabled={disabled} onClick={() => cameraRef.current?.click()} className="px-3 py-1.5 text-xs rounded-lg border border-border text-ink hover:bg-surface-hover inline-flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" />
                عکس گرفتن
              </button>
            )}
            {(previewSrc || file) && (
              <button type="button" disabled={disabled} onClick={clear} className="px-3 py-1.5 text-xs rounded-lg border border-danger/30 text-danger-text hover:bg-danger-soft inline-flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" />
                حذف
              </button>
            )}
          </div>
        </div>
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" disabled={disabled} onChange={(e) => applyFile(e.target.files?.[0] || null)} />
      {allowCamera && (
        <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" disabled={disabled} onChange={(e) => applyFile(e.target.files?.[0] || null)} />
      )}
      {msg && <p className="text-[11px] text-danger-text">{msg}</p>}
    </div>
  );
};

export default ImageUpload;
