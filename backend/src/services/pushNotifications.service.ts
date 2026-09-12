import Notification from '../models/Notification.model';
import Subscription from '../models/Subscription.model';
import User from '../models/User.model';

function parseTimeToHoursMinutes(time: string): { h: number; m: number } | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(time));
  if (!m) return null;
  return { h: Number(m[1]), m: Number(m[2]) };
}

function buildReminderDate(nextBillingDate: Date, daysBefore: number, time: string): Date | null {
  const t = parseTimeToHoursMinutes(time);
  if (!t) return null;

  const d = new Date(nextBillingDate);
  d.setDate(d.getDate() - daysBefore);
  d.setHours(t.h, t.m, 0, 0);
  return d;
}

async function sendExpoPush(pushToken: string, title: string, body: string, data: any) {
  const payload = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && 'errors' in json
        ? (json as any)?.errors?.[0]?.message
        : null;
    throw new Error(msg || `Expo push failed (${res.status})`);
  }

  return json;
}

export async function runPushNotificationsSweep(now: Date = new Date()) {
  const windowStart = new Date(now.getTime() - 5 * 60_000);
  const windowEnd = new Date(now.getTime() + 5 * 60_000);

  console.log(
    `[pushSweep] start now=${now.toISOString()} window=[${windowStart.toISOString()}..${windowEnd.toISOString()}]`
  );

  const subs = await Subscription.find({ status: 'ACTIVE' });

  console.log(`[pushSweep] activeSubs=${subs.length}`);

  for (const sub of subs) {
    const user = await User.findById(sub.userId);
    const pushToken = user?.pushToken;
    if (!pushToken) {
      console.log(`[pushSweep] skip sub=${String((sub as any)._id)} reason=noPushToken userId=${String(sub.userId)}`);
      continue;
    }

    const reminders = Array.isArray((sub as any).reminders) && (sub as any).reminders.length > 0
      ? (sub as any).reminders
      : [{ daysBefore: sub.reminderDays ?? 3, time: '09:00', enabled: true }];

    for (const r of reminders) {
      if (r?.enabled === false) continue;

      const daysBefore = Number(r?.daysBefore ?? 0);
      const time = String(r?.time ?? '09:00');
      const dueAt = buildReminderDate(sub.nextBillingDate, daysBefore, time);
      if (!dueAt) continue;

      if (dueAt.getTime() < windowStart.getTime() || dueAt.getTime() > windowEnd.getTime()) continue;

      const key = `renewal:${sub._id}:${sub.nextBillingDate.toISOString()}:${daysBefore}:${time}`;

      try {
        await Notification.create({
          userId: user._id,
          subscriptionId: sub._id,
          type: 'PUSH',
          status: 'PENDING',
          key,
          metadata: {
            nextBillingDate: sub.nextBillingDate,
            daysBefore,
            time,
          },
        });
      } catch (e: any) {
        if (/duplicate key/i.test(String(e?.message))) {
          continue;
        }
        continue;
      }

      try {
        const title = 'Nadchodząca płatność';
        const body = `${sub.name} odnawia się ${sub.nextBillingDate.toISOString().slice(0, 10)}`;

        const response = await sendExpoPush(pushToken, title, body, {
          subscriptionId: String(sub._id),
        });

        const responseMeta =
          response && typeof response === 'object'
            ? (response as Record<string, unknown>)
            : { response };

        await Notification.updateOne(
          { subscriptionId: sub._id, type: 'PUSH', key },
          { $set: { status: 'SENT', sentAt: new Date(), failureReason: undefined, metadata: { ...responseMeta, key } } }
        );
      } catch (err: any) {
        await Notification.updateOne(
          { subscriptionId: sub._id, type: 'PUSH', key },
          { $set: { status: 'FAILED', sentAt: new Date(), failureReason: err?.message || 'Failed' } }
        );
      }
    }

    const customNotifications = Array.isArray((sub as any).customNotifications)
      ? (sub as any).customNotifications
      : [];

    for (const cn of customNotifications) {
      if (cn?.enabled === false) continue;
      const notifyAt = cn?.notifyAt ? new Date(cn.notifyAt) : null;
      if (!notifyAt || Number.isNaN(notifyAt.getTime())) continue;

      if (notifyAt.getTime() < windowStart.getTime() || notifyAt.getTime() > windowEnd.getTime()) continue;

      const note = typeof cn?.note === 'string' ? cn.note.trim() : '';
      const key = `custom:${sub._id}:${notifyAt.toISOString()}`;

      console.log(
        `[pushSweep] custom due sub=${String((sub as any)._id)} userId=${String(sub.userId)} notifyAt=${notifyAt.toISOString()} key=${key}`
      );

      try {
        await Notification.create({
          userId: user._id,
          subscriptionId: sub._id,
          type: 'PUSH',
          status: 'PENDING',
          key,
          metadata: {
            notifyAt,
            note: note || undefined,
          },
        });
      } catch (e: any) {
        if (/duplicate key/i.test(String(e?.message))) {
          console.log(`[pushSweep] custom dedupe key=${key}`);
          continue;
        }
        console.log(`[pushSweep] custom notification create failed key=${key} err=${String(e?.message || e)}`);
        continue;
      }

      try {
        const title = sub.name;
        const body = note ? note : 'Masz zaplanowane powiadomienie';

        const response = await sendExpoPush(pushToken, title, body, {
          subscriptionId: String(sub._id),
          type: 'custom',
          notifyAt: notifyAt.toISOString(),
        });

        const responseMeta =
          response && typeof response === 'object'
            ? (response as Record<string, unknown>)
            : { response };

        await Notification.updateOne(
          { subscriptionId: sub._id, type: 'PUSH', key },
          { $set: { status: 'SENT', sentAt: new Date(), failureReason: undefined, metadata: { ...responseMeta, key } } }
        );

        console.log(`[pushSweep] custom sent key=${key}`);
      } catch (err: any) {
        await Notification.updateOne(
          { subscriptionId: sub._id, type: 'PUSH', key },
          { $set: { status: 'FAILED', sentAt: new Date(), failureReason: err?.message || 'Failed' } }
        );

        console.log(`[pushSweep] custom failed key=${key} err=${String(err?.message || err)}`);
      }
    }
  }

  console.log(`[pushSweep] end now=${now.toISOString()}`);
}
