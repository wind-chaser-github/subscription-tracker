import Dexie, { type EntityTable } from 'dexie';

export type BillingCycle = 'monthly' | 'yearly' | 'one-time' | 'usage-based';

export interface Subscription {
  id?: number;
  name: string;
  cost: number; // 基准/预估费用
  currency?: 'USD' | 'CNY'; // 支持美元和人民币
  billingCycle: BillingCycle;
  nextPaymentDate: string; // ISO date string YYYY-MM-DD
  color: string;
  icon: string;
  createdAt: string;
}

export interface PaymentRecord {
  id?: number;
  subscriptionId: number;
  amount: number;
  date: string; // ISO date string YYYY-MM-DD
  note: string;
}

export const db = new Dexie('SubscriptionTrackerDB') as Dexie & {
  subscriptions: EntityTable<Subscription, 'id'>;
  paymentRecords: EntityTable<PaymentRecord, 'id'>;
};

// Schema declaration
db.version(1).stores({
  subscriptions: '++id, name, nextPaymentDate, billingCycle'
});

db.version(2).stores({
  subscriptions: '++id, name, nextPaymentDate, billingCycle',
  paymentRecords: '++id, subscriptionId, date'
});
