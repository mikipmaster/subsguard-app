import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  type: 'EMAIL' | 'PUSH';
  status: 'SENT' | 'FAILED' | 'PENDING';
  sentAt?: Date;
  failureReason?: string;
  metadata?: any;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
  type: { type: String, enum: ['EMAIL', 'PUSH'], required: true },
  status: { type: String, enum: ['SENT', 'FAILED', 'PENDING'], default: 'PENDING' },
  sentAt: Date,
  failureReason: String,
  metadata: Schema.Types.Mixed
}, { timestamps: true });

NotificationSchema.index({ userId: 1, sentAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
