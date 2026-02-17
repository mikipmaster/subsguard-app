// backend/src/models/RefreshToken.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdByIp: string;
  revokedAt?: Date;
  revokedByIp?: string;
  replacedByToken?: string;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  token: { 
    type: String, 
    required: true,
    unique: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  createdByIp: String,
  revokedAt: Date,
  revokedByIp: String,
  replacedByToken: String
}, { 
  timestamps: true 
});

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
