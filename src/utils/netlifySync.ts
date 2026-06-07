import { db } from '../db/database';

export const pushToNetlify = async () => {
  const subs = await db.subscriptions.toArray();
  const records = await db.paymentRecords.toArray();
  
  const data = { subscriptions: subs, paymentRecords: records };

  const res = await fetch(`/.netlify/functions/sync`, {
    method: 'POST',
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to push data: ${err}`);
  }
};

export const pullFromNetlify = async () => {
  const res = await fetch(`/.netlify/functions/sync`);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to pull data: ${err}`);
  }
  
  const parsed = await res.json();
  if (!parsed || Object.keys(parsed).length === 0) {
    throw new Error('No data found in Netlify Blobs');
  }
  
  // 覆盖本地数据
  await db.transaction('rw', db.subscriptions, db.paymentRecords, async () => {
    await db.subscriptions.clear();
    await db.paymentRecords.clear();
    if (parsed.subscriptions?.length > 0) {
      await db.subscriptions.bulkAdd(parsed.subscriptions);
    }
    if (parsed.paymentRecords?.length > 0) {
      await db.paymentRecords.bulkAdd(parsed.paymentRecords);
    }
  });
};
