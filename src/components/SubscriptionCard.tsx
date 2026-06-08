import React, { useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Subscription } from '../db/database';
import { ChevronDown, Calendar, CreditCard, Trash2, PlusCircle, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { db } from '../db/database';
import { AddSubscriptionModal } from './AddSubscriptionModal';

interface Props {
  subscription: Subscription;
}

export const SubscriptionCard: React.FC<Props> = ({ subscription }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [addingRecord, setAddingRecord] = useState(false);
  const [recordAmount, setRecordAmount] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const records = useLiveQuery(
    () => db.paymentRecords.where({ subscriptionId: subscription.id }).toArray(),
    [subscription.id]
  );

  const toggleOpen = () => setIsOpen(!isOpen);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!detailRef.current) return;
      if (isOpen) {
        gsap.to(detailRef.current, { height: 'auto', opacity: 1, duration: 0.4, ease: 'power3.out' });
        gsap.to('.chevron-icon', { rotate: 180, duration: 0.3 });
      } else {
        gsap.to(detailRef.current, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' });
        gsap.to('.chevron-icon', { rotate: 0, duration: 0.3 });
      }
    }, cardRef);
    return () => ctx.revert();
  }, [isOpen, addingRecord]); // 依赖 addingRecord 是为了高度可以自适应重新动画

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subscription.id && confirm(`Delete ${subscription.name} and all its records?`)) {
      await db.paymentRecords.where({ subscriptionId: subscription.id }).delete();
      await db.subscriptions.delete(subscription.id);
    }
  };

  const handleAddRecord = async () => {
    if (!recordAmount) return;
    await db.paymentRecords.add({
      subscriptionId: subscription.id!,
      amount: parseFloat(recordAmount),
      date: format(new Date(), 'yyyy-MM-dd'),
      note: 'Manual Record'
    });
    setAddingRecord(false);
    setRecordAmount('');
    // 强制更新详情高度
    gsap.set(detailRef.current, { height: 'auto' });
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
  const isVariable = subscription.billingCycle === 'usage-based' || subscription.billingCycle === 'one-time';

  return (
    <div ref={cardRef} className="glass-panel" style={{ marginBottom: '16px', overflow: 'hidden' }}>
      <div onClick={toggleOpen} style={{ display: 'flex', alignItems: 'center', padding: '20px', cursor: 'pointer', position: 'relative' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: subscription.color || 'var(--card-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', color: '#fff', boxShadow: `0 0 15px ${subscription.color}40`, marginRight: '16px' }}>
          {getInitials(subscription.name)}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>{subscription.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Next: {subscription.nextPaymentDate ? format(parseISO(subscription.nextPaymentDate), 'MMM dd, yyyy') : 'N/A'}
          </p>
        </div>

        <div style={{ textAlign: 'right', marginRight: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {subscription.currency === 'CNY' ? '¥' : '$'}{subscription.cost.toFixed(2)}
            {isVariable && <span style={{fontSize:'12px', color:'var(--text-muted)'}}> (Est.)</span>}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'capitalize' }}>
            {subscription.billingCycle.replace('-', ' ')}
          </div>
        </div>
        <ChevronDown className="chevron-icon" size={20} color="var(--text-secondary)" />
      </div>

      <div ref={detailRef} style={{ height: 0, opacity: 0, overflow: 'hidden', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
               <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Details</h4>
               <p style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, marginBottom: isVariable ? '16px' : '0' }}>
                 <CreditCard size={16} /> 
                 {subscription.billingCycle === 'monthly' ? 'Billed every month' : 
                  subscription.billingCycle === 'yearly' ? 'Billed once a year' : 'Variable billing amount'}
               </p>
               
               {isVariable && (
                 <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                   <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Recent Records</h5>
                   {records?.length === 0 ? <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>No payment records yet.</p> : 
                     records?.slice(-3).map(r => (
                       <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                         <span>{r.date}</span>
                         <span style={{ fontWeight: 'bold' }}>{subscription.currency === 'CNY' ? '¥' : '$'}{r.amount.toFixed(2)}</span>
                       </div>
                     ))
                   }
                   
                   {addingRecord ? (
                     <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                       <input type="number" step="0.01" value={recordAmount} onChange={e => setRecordAmount(e.target.value)} placeholder="0.00" style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.5)', color: 'white' }} />
                       <button onClick={handleAddRecord} style={{ background: 'var(--accent-success)', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Save</button>
                       <button onClick={() => setAddingRecord(false)} style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Cancel</button>
                     </div>
                   ) : (
                     <button onClick={(e) => { e.stopPropagation(); setAddingRecord(true); }} style={{ color: 'var(--accent-primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontWeight: 'bold' }}>
                       <PlusCircle size={14} /> Add Payment Record
                     </button>
                   )}
                 </div>
               )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}>
                <Edit2 size={16} /> Edit
              </button>
              <button onClick={handleDelete} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {isEditing && <AddSubscriptionModal editItem={subscription} onClose={() => setIsEditing(false)} />}
    </div>
  );
};
