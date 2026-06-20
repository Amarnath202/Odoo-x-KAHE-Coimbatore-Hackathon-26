import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ current, total, pageSize = 20, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, current - delta); i <= Math.min(totalPages, current + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-text-muted">
        Showing {Math.min((current - 1) * pageSize + 1, total)}–{Math.min(current * pageSize, total)} of {total}
      </p>
      <div className="pagination">
        <button
          className="page-btn"
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages[0] > 1 && (
          <>
            <button className="page-btn" onClick={() => onChange(1)}>1</button>
            {pages[0] > 2 && <span className="page-btn text-text-muted">…</span>}
          </>
        )}
        {pages.map(p => (
          <button
            key={p}
            className={`page-btn ${p === current ? 'active' : ''}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="page-btn text-text-muted">…</span>}
            <button className="page-btn" onClick={() => onChange(totalPages)}>{totalPages}</button>
          </>
        )}
        <button
          className="page-btn"
          disabled={current === totalPages}
          onClick={() => onChange(current + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
