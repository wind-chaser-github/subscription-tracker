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
    : { USD: [0,0,0,0,0,0], CNY: [0,0,0,0,0,0] };

  // 合并折线图的走势，粗略将 CNY 按 1/7 转换为 USD 单位，仅仅为了表现波动趋势
  const combinedData = data.USD.map((val, i) => val + (data.CNY[i] / 7));
  
  const maxExpense = Math.max(...combinedData, 10); // avoid division by 0
  const width = 300;
  const height = 80;
  const generatePath = () => {
    if (combinedData.length === 0) return '';
    const stepX = width / (combinedData.length - 1);
    
    const points = combinedData.map((amount, i) => {
      const x = i * stepX;
      const y = height - (amount / maxExpense) * height;
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
  }, [combinedData.join(',')]); // 依赖具体数值的变化来重绘

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
