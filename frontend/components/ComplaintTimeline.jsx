import { Check, Circle } from 'lucide-react';

const STEPS = [
  { status: 'submitted', label: 'Submitted' },
  { status: 'under_review', label: 'Under Review' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'resolved', label: 'Resolved' },
];

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

export default function ComplaintTimeline({ timeline, currentStatus }) {
  const eventByStatus = Object.fromEntries((timeline || []).map((event) => [event.status, event]));

  return (
    <ol>
      {STEPS.map((step, i) => {
        const event = eventByStatus[step.status];
        const isCurrent = step.status === currentStatus;
        const isCompleted = Boolean(event) && !isCurrent;
        const state = isCurrent ? 'current' : isCompleted ? 'completed' : 'pending';
        const isLast = i === STEPS.length - 1;

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
              {event?.timestamp && (
                <p className="mt-0.5 text-xs text-ink-muted">
                  {new Date(event.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              )}
              {event?.message && <p className="mt-1 text-sm text-ink-muted">{event.message}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
