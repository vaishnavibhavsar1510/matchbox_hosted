import mongoose from 'mongoose';

export interface IEvent {
  title: string;
  date: Date;
  location: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  maxAttendees?: number;
  category?: string;
}

const eventSchema = new mongoose.Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    maxAttendees: {
      type: Number,
    },
    category: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema); 