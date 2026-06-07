import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Subscription, PaymentRecord } from '../db/database';
import { calculateMonthlyExpenses } from '../utils/calculations';

interface ExpenseChartProps {
  subscriptions: Subscription[] | undefined;
  paymentRecords: PaymentRecord[] | undefined;
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ subscriptions, paymentRecords }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const data = (subscriptions && paymentRecords) 
    ? calculateMonthlyExpenses(subscriptions, paymentRecords) 
    : [];

  const max = Math.max(...data, 1);
  
  const width = 300;
  const height = 80;
  const generatePath = () => {
    if (data.length === 0) return '';
    const stepX = width / (data.length - 1);
    
    const points = data.map((val, index) => {
      const x = index * stepX;
      const y = height - (val / max) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (pathRef.current) {
        const length = pathRef.current.getTotalLength();
        gsap.set(pathRef.current, {
          strokeDasharray: length,
          strokeDashoffset: length
        });
        
        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          duration: 1.5,
          ease: 'power3.out',
          delay: 0.5
        });
      }
    }, chartRef);
    
    return () => ctx.revert();
  }, [data.join(',')]); // 依赖具体数值的变化来重绘

  return (
    <div ref={chartRef} style={{ width: '100%', height: '120px', position: 'relative', marginTop: '20px' }}>
      <svg width="100%" height="100%" viewBox={`0 -10 ${width} ${height + 20}`} preserveAspectRatio="none">
        <line x1="0" y1={height} x2={width} y2={height} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
        
        <path
          ref={pathRef}
          d={generatePath()}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.4))' }}
        />
      </svg>
    </div>
  );
};
