import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { formatCountdown } from '../lib/stellar';

interface CountdownTimerProps {
  endTime: Date;
  onEnd?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function CountdownTimer({ endTime, onEnd, size = 'md' }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(formatCountdown(endTime.getTime()));
  // Store onEnd in a ref so the effect doesn't re-run when parent re-renders
  const onEndRef = useRef(onEnd);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  // Track whether onEnd has already been called — key by timestamp value, not object ref
  const firedForMs = useRef<number | null>(null);

  useEffect(() => {
    const endMs = endTime.getTime();

    const tick = () => {
      const c = formatCountdown(endMs);
      setCountdown(c);
      if (c.expired && onEndRef.current && firedForMs.current !== endMs) {
        firedForMs.current = endMs;
        onEndRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]); // Only endTime as dep — onEnd via ref

  if (countdown.expired) {
    return (
      <div className="flex items-center gap-1.5 text-slate-500">
        <Clock size={14} />
        <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>Auction ended</span>
      </div>
    );
  }

  const unitClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  const numClass = {
    sm: 'text-sm font-bold',
    md: 'text-xl font-bold',
    lg: 'text-3xl font-bold',
  }[size];

  const segments = [
    { val: countdown.days, label: 'D' },
    { val: countdown.hours, label: 'H' },
    { val: countdown.minutes, label: 'M' },
    { val: countdown.seconds, label: 'S' },
  ].filter(s => size === 'lg' || s.val > 0 || s.label === 'M' || s.label === 'S');

  const isUrgent = countdown.days === 0 && countdown.hours === 0 && countdown.minutes < 10;

  return (
    <div className="flex items-center gap-2">
      <Clock size={size === 'sm' ? 12 : 14} style={{ color: isUrgent ? '#fb7185' : '#a78bfa' }} />
      <div className="flex items-center gap-1">
        {segments.map(({ val, label }, i) => (
          <React.Fragment key={label}>
            {i > 0 && <span className={`${unitClass} text-slate-600`}>:</span>}
            <div className="flex items-end gap-0.5">
              <span
                className={numClass}
                style={{ color: isUrgent ? '#fb7185' : '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}
              >
                {String(val).padStart(2, '0')}
              </span>
              <span className={`${unitClass} text-slate-500`}>{label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
      {isUrgent && (
        <span className="badge badge-pending text-xs ml-1 animate-pulse-slow">Ending soon</span>
      )}
    </div>
  );
}
