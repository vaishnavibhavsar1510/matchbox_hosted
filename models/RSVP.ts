import mongoose from 'mongoose';

export interface IRSVP {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  status: 'going' | 'maybe' | 'not-going';
  notes?: string;
}

const rsvpSchema = new mongoose.Schema<IRSVP>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not-going'],
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for userId and eventId to ensure uniqueness
rsvpSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const RSVP = mongoose.models.RSVP || mongoose.model<IRSVP>('RSVP', rsvpSchema); 