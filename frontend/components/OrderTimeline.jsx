import { Check, Circle } from 'lucide-react';

const stateStyles = {
  completed: 'bg-local text-white',
  current: 'bg-primary text-white',
  pending: 'border border-border bg-surface-alt text-ink-muted',
};

const textStyles = {
  completed: 'text-ink',
  current: 'text-primary',
  pending: 'text-ink-muted',
};

export default function OrderTimeline({ timeline, currentStatus }) {
  return (
    <ol>
      {timeline.map((step, i) => {
        const isCurrent = step.status === currentStatus;
        const isCompleted = Boolean(step.timestamp) && !isCurrent;
        const state = isCurrent ? 'current' : isCompleted ? 'completed' : 'pending';
        const isLast = i === timeline.length - 1;

        return (
          <li key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={`absolute left-3.5 top-8 h-[calc(100%-2rem)] w-0.5 ${
                  state === 'pending' ? 'bg-border' : 'bg-local'
                }`}
              />
            )}
            <span className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${stateStyles[state]}`}>
              {state === 'completed' ? <Check size={14} /> : <Circle size={8} className="fill-current" />}
            </span>
            <div>
              <p className={`text-sm font-semibold ${textStyles[state]}`}>{step.label}</p>
              {step.timestamp && (
                <p className="mt-0.5 text-xs text-ink-muted">
                  {new Date(step.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
