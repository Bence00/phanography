import { memo, useRef, useCallback } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';

export const UploadButton = memo(function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isUploading, handleFileInput } = useImageUpload();

  const onClick = useCallback(() => inputRef.current?.click(), []);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
      <button onClick={onClick} disabled={isUploading} className="btn btn-primary">
        {isUploading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            <span className="hidden sm:inline">Adding...</span>
          </>
        ) : (
          <>
            <span>+</span>
            <span className="hidden sm:inline">Add Photos</span>
          </>
        )}
      </button>
    </>
  );
});
