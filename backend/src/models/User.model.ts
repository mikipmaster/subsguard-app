import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  tier: 'FREE' | 'PREMIUM' | 'BUSINESS';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  pushToken?: string;
  settings: {
    baseCurrency: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    reminderDays: number;
    darkMode: boolean;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/ 
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  tier: { 
    type: String, 
    enum: ['FREE', 'PREMIUM', 'BUSINESS'], 
    default: 'FREE' 
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  pushToken: String,
  settings: {
    baseCurrency: { type: String, default: 'USD' },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    reminderDays: { type: Number, default: 3, min: 1, max: 14 },
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: 'en' }
  },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLoginAt: Date
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      // Użyj Omit zamiast delete - TypeScript friendly
      const { password, __v, emailVerificationToken, passwordResetToken, ...rest } = ret;
      return rest;
    }
  }
});



export default mongoose.model<IUser>('User', UserSchema);
