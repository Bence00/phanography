import { useEffect } from 'react';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="glass-panel-elevated rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-scale-in"
        style={{
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--darkroom-border)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: 'linear-gradient(180deg, var(--darkroom-surface) 0%, transparent 100%)',
            borderBottom: '1px solid var(--darkroom-border)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--amber-500) 0%, var(--amber-600) 100%)',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
              }}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--darkroom-black)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--cream-100)' }}>
                Help & Shortcuts
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Everything you need to know
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-150"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--darkroom-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          className="px-6 py-5 overflow-y-auto space-y-6"
          style={{ maxHeight: 'calc(85vh - 140px)' }}
        >
          {/* Quick Start */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--amber-400)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium" style={{ color: 'var(--amber-300)' }}>
                Quick Start
              </h3>
            </div>
            <ol className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {[
                { title: 'Upload photos', desc: 'Drag & drop or click the Add Photos button' },
                { title: 'Photos auto-resize', desc: 'All photos import as 9×13cm classic prints' },
                { title: 'Arrange on canvas', desc: 'Drag to position, scroll to zoom' },
                { title: 'Right-click photos', desc: 'Change print size, mode, or orientation' },
                { title: 'Export', desc: 'Save your layout as a PNG image' },
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: 'var(--darkroom-surface)', color: 'var(--amber-400)', border: '1px solid var(--darkroom-border)' }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <span style={{ color: 'var(--cream-100)' }} className="font-medium">{step.title}</span>
                    <span className="mx-1.5" style={{ color: 'var(--darkroom-border-light)' }}>—</span>
                    <span>{step.desc}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Print Modes */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--amber-400)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium" style={{ color: 'var(--amber-300)' }}>
                Print Modes
              </h3>
            </div>
            <div className="grid gap-3">
              <div
                className="p-4 rounded-xl"
                style={{ background: 'var(--darkroom-surface)', border: '1px solid var(--darkroom-border)' }}
              >
                <h4 className="font-medium mb-1.5" style={{ color: 'var(--cream-100)' }}>Classic Mode</h4>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Fixed dimensions — photo is <span style={{ color: 'var(--amber-300)' }}>cropped</span> to exact print size (e.g., exactly 9×13cm).
                  Best for standard photo albums.
                </p>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ background: 'var(--darkroom-surface)', border: '1px solid var(--darkroom-border)' }}
              >
                <h4 className="font-medium mb-1.5" style={{ color: 'var(--cream-100)' }}>Original Aspect Mode</h4>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  One side is fixed, the other adjusts to preserve your photo's natural shape.
                  <span style={{ color: 'var(--amber-300)' }}> No cropping</span> — full photo is visible. Best for panoramas or square photos.
                </p>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--amber-400)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium" style={{ color: 'var(--amber-300)' }}>
                Keyboard Shortcuts
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'Home', action: 'Bring to front' },
                { key: 'End', action: 'Send to back' },
                { key: 'PgUp', action: 'Move up one layer' },
                { key: 'PgDn', action: 'Move down one layer' },
                { key: 'Delete', action: 'Delete selected photo' },
                { key: 'Esc', action: 'Deselect / Close menu' },
              ].map(({ key, action }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{ background: 'var(--darkroom-surface)' }}
                >
                  <kbd
                    className="px-2.5 py-1 rounded-md text-xs font-mono font-medium"
                    style={{ background: 'var(--darkroom-elevated)', color: 'var(--cream-100)', border: '1px solid var(--darkroom-border)' }}
                  >
                    {key}
                  </kbd>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{action}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Mouse Controls */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--amber-400)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium" style={{ color: 'var(--amber-300)' }}>
                Mouse Controls
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { action: 'Left Click', desc: 'Select / Drag photo' },
                { action: 'Right Click', desc: 'Open context menu' },
                { action: 'Mouse Wheel', desc: 'Zoom in/out (infinite zoom)' },
                { action: 'Drag Empty Space', desc: 'Pan the canvas' },
              ].map(({ action, desc }) => (
                <div
                  key={action}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{ background: 'var(--darkroom-surface)' }}
                >
                  <span className="font-medium min-w-[120px]" style={{ color: 'var(--cream-100)' }}>{action}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Print Sizes */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--amber-400)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium" style={{ color: 'var(--amber-300)' }}>
                Available Print Sizes
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { size: '9 × 13 cm', label: 'Classic small' },
                { size: '10 × 15 cm', label: 'Standard photo' },
                { size: '11 × 16 cm', label: 'Medium' },
                { size: '13 × 18 cm', label: 'Large' },
              ].map(({ size, label }) => (
                <div
                  key={size}
                  className="p-3 rounded-lg text-center"
                  style={{ background: 'var(--darkroom-surface)', border: '1px solid var(--darkroom-border)' }}
                >
                  <span className="font-mono font-medium" style={{ color: 'var(--cream-100)' }}>{size}</span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Tips */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--amber-400)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-medium" style={{ color: 'var(--amber-300)' }}>
                Pro Tips
              </h3>
            </div>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {[
                'Use the grid to align photos precisely',
                'Zoom in (mouse wheel) for detailed positioning',
                'Original mode is great for panoramas — try it!',
                'Photos are displayed at true-to-life sizes on the canvas',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: 'var(--amber-400)' }}>•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, var(--darkroom-surface) 100%)',
            borderTop: '1px solid var(--darkroom-border)'
          }}
        >
          <button
            onClick={onClose}
            className="w-full btn-primary py-3 text-base font-semibold"
          >
            Got it, let's create!
          </button>
        </div>
      </div>
    </div>
  );
}
