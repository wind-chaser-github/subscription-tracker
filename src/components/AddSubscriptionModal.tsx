import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../db/database';
import type { BillingCycle } from '../db/database';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import type { Subscription } from '../db/database';

interface Props {
  onClose: () => void;
  editItem?: Subscription;
}

const PRESET_COLORS = [
  '#E50914', '#1DB954', '#0061FF', '#FF4F00', '#7C3AED', '#10B981', '#F59E0B'
];

export const AddSubscriptionModal: React.FC<Props> = ({ onClose, editItem }) => {
  const [name, setName] = useState(editItem?.name || '');
  const [cost, setCost] = useState(editItem ? String(editItem.cost) : '');
  const [currency, setCurrency] = useState<'USD'|'CNY'>(editItem?.currency || 'USD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(editItem?.billingCycle || 'monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState(editItem?.nextPaymentDate || format(new Date(), 'yyyy-MM-dd'));
  const [color, setColor] = useState(editItem?.color || PRESET_COLORS[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cost) return;

    if (editItem?.id) {
      await db.subscriptions.update(editItem.id, {
        name,
        cost: parseFloat(cost),
        currency,
        billingCycle,
        nextPaymentDate,
        color
      });
    } else {
      await db.subscriptions.add({
        name,
        cost: parseFloat(cost),
        currency,
        billingCycle,
        nextPaymentDate,
        color,
        icon: 'box',
        createdAt: new Date().toISOString()
      });
    }

    onClose();
  };

  const isVariable = billingCycle === 'usage-based' || billingCycle === 'one-time';

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }} onClick={e => e.stopPropagation()}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '30px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-secondary)' }}>
          <X size={24} />
        </button>
        
        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px' }}>{editItem ? 'Edit Subscription' : 'Add Subscription'}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Netflix or AWS" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '16px' }} required />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                {isVariable ? 'Cost (Estimated)' : 'Cost'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={currency} onChange={e => setCurrency(e.target.value as 'USD'|'CNY')} style={{ padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '16px', width: '80px' }}>
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                </select>
                <input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '16px' }} required />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Cycle</label>
              <select value={billingCycle} onChange={e => setBillingCycle(e.target.value as BillingCycle)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '16px' }}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="usage-based">Usage-based</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Next/Expected Payment Date</label>
            <input type="date" value={nextPaymentDate} onChange={e => setNextPaymentDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '16px' }} required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Brand Color</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} style={{ width: '30px', height: '30px', borderRadius: '15px', background: c, border: color === c ? '2px solid white' : '2px solid transparent', transition: 'all 0.2s' }} />
              ))}
            </div>
          </div>

          <button type="submit" style={{ padding: '14px', borderRadius: '8px', background: 'var(--text-primary)', color: 'var(--bg-dark)', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', transition: 'opacity 0.2s' }} onMouseOver={e => (e.currentTarget.style.opacity = '0.9')} onMouseOut={e => (e.currentTarget.style.opacity = '1')}>
            Save Subscription
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
