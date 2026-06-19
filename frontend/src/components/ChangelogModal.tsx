import React, { useEffect, useMemo, useRef } from 'react';
import { APP_VERSION_LABEL, normalizeAppVersion } from '../utils/appVersion';
import {
  APP_CHANGELOG_ENTRIES,
  parseChangelog,
  type ChangelogEntry,
} from '../utils/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceMarkdown?: string | null;
  highlightedVersion?: string | null;
}

const getEntryKey = (entry: ChangelogEntry): string => (
  `${entry.version}-${entry.date || 'no-date'}`
);

const getEntries = (sourceMarkdown?: string | null): ChangelogEntry[] => {
  if (!sourceMarkdown?.trim()) return APP_CHANGELOG_ENTRIES;
  return parseChangelog(sourceMarkdown, 12);
};

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  isOpen,
  onClose,
  sourceMarkdown,
  highlightedVersion,
}) => {
  const dialogPanelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const entries = useMemo(() => getEntries(sourceMarkdown), [sourceMarkdown]);
  const normalizedHighlightedVersion = highlightedVersion
    ? normalizeAppVersion(highlightedVersion)
    : entries[0]?.version || null;
  const isRemoteChangelog = Boolean(sourceMarkdown?.trim());

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements: HTMLElement[] = dialogPanelRef.current
        ? Array.from(dialogPanelRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter((element): element is HTMLElement => (
          element instanceof HTMLElement && element.offsetParent !== null
        ))
        : [];

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!firstElement || !lastElement) return;

      if (!dialogPanelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      previousActiveElementRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

      const focusTimer = window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);

      return () => window.clearTimeout(focusTimer);
    }

    if (!wasOpenRef.current) return;

    wasOpenRef.current = false;
    const previousActiveElement = previousActiveElementRef.current;
    previousActiveElementRef.current = null;
    if (!previousActiveElement?.isConnected) return;

    const restoreTimer = window.setTimeout(() => {
      previousActiveElement.focus();
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-tour="changelog-modal"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="changelog-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogPanelRef}
        className="flex max-h-[82vh] w-full max-w-[760px] flex-col overflow-hidden rounded-lg border border-editor-border bg-editor-sidebar shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-editor-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-brand-accent">
              {isRemoteChangelog ? '线上版本' : `当前版本 ${APP_VERSION_LABEL}`}
            </p>
            <h2 id="changelog-modal-title" className="mt-1 text-lg font-semibold text-white">
              版本更新
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              更新内容来自项目 CHANGELOG，按版本倒序展示。
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="关闭版本更新"
            onClick={onClose}
            className="rounded border border-editor-border p-1.5 text-gray-300 transition-colors hover:bg-editor-hover hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path d="M5 5l10 10M15 5L5 15" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {entries.length === 0 ? (
            <div className="rounded-md border border-editor-border bg-editor-bg px-4 py-5 text-sm text-gray-300">
              暂未读取到版本更新内容。
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map(entry => {
                const isHighlighted = normalizedHighlightedVersion === entry.version;

                return (
                  <section
                    key={getEntryKey(entry)}
                    className={`rounded-md border px-4 py-3 ${
                      isHighlighted
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-editor-border bg-editor-bg/70'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none text-brand-primary">
                        {entry.versionLabel}
                      </span>
                      {entry.date && (
                        <span className="font-mono text-[11px] text-gray-400">{entry.date}</span>
                      )}
                      {isHighlighted && (
                        <span className="rounded bg-brand-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                          重点
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-white">{entry.title}</h3>
                    <div className="mt-3 space-y-3">
                      {entry.sections.map(section => (
                        <div key={`${entry.version}-${section.title}`}>
                          <h4 className="text-xs font-semibold text-brand-accent">{section.title}</h4>
                          <ul className="mt-1.5 space-y-1.5 text-sm leading-6 text-gray-300">
                            {section.items.map((item, index) => (
                              <li key={`${entry.version}-${section.title}-${index}`} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-editor-border px-5 py-3 text-xs text-gray-400">
          <span>展示最近 12 个版本，完整记录仍以仓库 CHANGELOG 为准。</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
