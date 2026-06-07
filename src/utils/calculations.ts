import { isValid, parseISO } from 'date-fns';
import type { Subscription, PaymentRecord } from '../db/database';

export const calculateMonthlyExpenses = (
  subscriptions: Subscription[],
  paymentRecords: PaymentRecord[],
  monthsBack = 6
): number[] => {
  const data = new Array(monthsBack).fill(0);
  const now = new Date();
  
  // 生成过去6个月的标尺（以年-月为 key）
  const targetMonths = data.map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      index: i
    };
  });

  subscriptions.forEach(sub => {
    // 找出属于当前 sub 的记录
    const subRecords = paymentRecords.filter(r => r.subscriptionId === sub.id);

    targetMonths.forEach(tm => {
      // 找出当前月的所有真实缴费
      const recordsInMonth = subRecords.filter(r => {
        if (!isValid(parseISO(r.date))) return false;
        const rd = parseISO(r.date);
        return rd.getFullYear() === tm.year && rd.getMonth() === tm.month;
      });

      if (recordsInMonth.length > 0) {
        // 如果这个月有记录，累加记录金额
        const sum = recordsInMonth.reduce((acc, curr) => acc + curr.amount, 0);
        data[tm.index] += sum;
      } else {
        // 如果没有记录，退回到默认扣费逻辑 (只对固定类型)
        if (sub.billingCycle === 'monthly') {
          data[tm.index] += sub.cost;
        } else if (sub.billingCycle === 'yearly') {
          if (isValid(parseISO(sub.nextPaymentDate))) {
            const paymentDate = parseISO(sub.nextPaymentDate);
            if (paymentDate.getMonth() === tm.month) {
               data[tm.index] += sub.cost;
            }
          }
        }
        // usage-based 和 one-time 如果没记录，就是 0
      }
    });
  });

  return data;
};
