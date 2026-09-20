'use client';

import { useEffect, useState } from 'react';

const emptyForm = {
  title: '',
  content: '',
  category: 'public_notice',
  priority: 'low',
};

export default function NoticeForm({ initialValues, onSubmit, submitLabel = 'Publish Notice' }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialValues) {
      setForm({
        title: initialValues.title || '',
        content: initialValues.content || '',
        category: initialValues.category || 'public_notice',
        priority: initialValues.priority || 'low',
      });
    }
  }, [initialValues]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.content.trim()) next.content = 'Content is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        priority: form.priority,
      });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-surface-raised p-6">
      {formError && <div className="rounded-lg bg-accent-light px-4 py-3 text-sm text-accent-dark">{formError}</div>}

      <div>
        <label className="block text-sm font-medium text-ink">Title</label>
        <input
          value={form.title}
          onChange={handleChange('title')}
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          placeholder="Notice title"
        />
        {errors.title && <p className="mt-1 text-xs text-accent-dark">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Content</label>
        <textarea
          rows={8}
          value={form.content}
          onChange={handleChange('content')}
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          placeholder="Full notice text..."
        />
        {errors.content && <p className="mt-1 text-xs text-accent-dark">{errors.content}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">Category</label>
          <select
            value={form.category}
            onChange={handleChange('category')}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="market_info">Market Info</option>
            <option value="consumer_awareness">Consumer Awareness</option>
            <option value="public_notice">Public Notice</option>
            <option value="regulations">Regulations</option>
            <option value="price_info">Price Info</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Priority</label>
          <div className="mt-2 flex gap-4">
            {['low', 'medium', 'high'].map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-sm text-ink capitalize">
                <input type="radio" name="priority" value={p} checked={form.priority === p} onChange={handleChange('priority')} />
                {p}
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
