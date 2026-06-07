import React, { useLayoutEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { SubscriptionCard } from './SubscriptionCard';
import { ExpenseChart } from './ExpenseChart';
import { calculateMonthlyExpenses } from '../utils/calculations';
import gsap from 'gsap';

export const Dashboard: React.FC = () => {
  const subscriptions = useLiveQuery(() => db.subscriptions.toArray());
  const paymentRecords = useLiveQuery(() => db.paymentRecords.toArray());
  const listRef = useRef<HTMLDivElement>(null);
  
  const monthlyData = (subscriptions && paymentRecords) 
    ? calculateMonthlyExpenses(subscriptions, paymentRecords)
    : [0,0,0,0,0,0];
  
  // The last element represents the current month
  const currentMonthlyTotal = monthlyData[5];

  useLayoutEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.sub-card-wrapper', 
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
        );
      }, listRef);
      return () => ctx.revert();
    }
  }, [subscriptions?.length]);

  if (!subscriptions || !paymentRecords) return null; // loading

  return (
    <div style={{ marginTop: '40px' }}>
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '40px' }}>
        <p style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '14px', letterSpacing: '1px', marginBottom: '8px' }}>
          This Month Expense
        </p>
        <h1 className="text-gradient" style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1 }}>
          ${currentMonthlyTotal.toFixed(2)}
        </h1>
        
        <ExpenseChart subscriptions={subscriptions} paymentRecords={paymentRecords} />
      </div>

      <div ref={listRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Active Subscriptions</h2>
          <span style={{ color: 'var(--text-secondary)', background: 'var(--card-bg)', padding: '4px 12px', borderRadius: '20px', fontSize: '14px' }}>
            {subscriptions.length}
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '16px' }}>No subscriptions yet.</p>
            <p style={{ fontSize: '14px' }}>Click the "+" button to add your first one.</p>
          </div>
        ) : (
          <div>
            {subscriptions.map(sub => (
              <div key={sub.id} className="sub-card-wrapper">
                <SubscriptionCard subscription={sub} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
