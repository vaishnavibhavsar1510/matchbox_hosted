const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const MONGODB_URI = 'mongodb://localhost:27017/matchbox';

// Sample user IDs (in a real app, these would be actual user IDs)
const sampleUsers = [
  { _id: new ObjectId(), name: 'John Doe', interests: ['Photography', 'Hiking', 'Coffee'] },
  { _id: new ObjectId(), name: 'Jane Smith', interests: ['Music', 'Art', 'Travel'] },
  { _id: new ObjectId(), name: 'Mike Johnson', interests: ['Sports', 'Cooking', 'Photography'] },
];

// Sample events data
const sampleEvents = [
  {
    title: 'Photography Workshop',
    date: new Date('2024-04-15T14:00:00'),
    location: 'City Art Gallery',
    description: 'Learn photography techniques from professional photographers',
    createdBy: sampleUsers[0]._id,
    category: 'Photography',
    maxAttendees: 20,
  },
  {
    title: 'Hiking Adventure',
    date: new Date('2024-04-20T09:00:00'),
    location: 'Mountain Trail Park',
    description: 'A group hiking experience for all skill levels',
    createdBy: sampleUsers[0]._id,
    category: 'Outdoor',
    maxAttendees: 15,
  },
  {
    title: 'Coffee Tasting Experience',
    date: new Date('2024-04-25T11:00:00'),
    location: 'The Coffee House',
    description: 'Taste and learn about different coffee varieties',
    createdBy: sampleUsers[1]._id,
    category: 'Food & Drink',
    maxAttendees: 12,
  },
  {
    title: 'Live Music Night',
    date: new Date('2024-04-28T19:00:00'),
    location: 'Jazz Club Downtown',
    description: 'Evening of live jazz and networking',
    createdBy: sampleUsers[1]._id,
    category: 'Music',
    maxAttendees: 30,
  },
  {
    title: 'Cooking Class',
    date: new Date('2024-05-02T18:00:00'),
    location: 'Culinary Institute',
    description: 'Learn to cook authentic Italian dishes',
    createdBy: sampleUsers[2]._id,
    category: 'Food & Drink',
    maxAttendees: 10,
  },
];

// Sample RSVPs
const sampleRSVPs = [
  {
    userId: sampleUsers[0]._id,
    eventId: null, // We'll set this after creating events
    status: 'going',
    notes: 'Looking forward to it!',
  },
  {
    userId: sampleUsers[1]._id,
    eventId: null,
    status: 'maybe',
    notes: 'Will try to make it',
  },
  {
    userId: sampleUsers[2]._id,
    eventId: null,
    status: 'going',
    notes: 'Can\'t wait!',
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
    console.log('Cleared existing data');

    // Create Event model
    const Event = mongoose.model('Event', new mongoose.Schema({
      title: String,
      date: Date,
      location: String,
      description: String,
      createdBy: mongoose.Schema.Types.ObjectId,
      category: String,
      maxAttendees: Number,
    }, { timestamps: true }));

    // Create RSVP model
    const RSVP = mongoose.model('RSVP', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      eventId: mongoose.Schema.Types.ObjectId,
      status: String,
      notes: String,
    }, { timestamps: true }));

    // Insert events
    const createdEvents = await Event.insertMany(sampleEvents);
    console.log('Added sample events');

    // Update RSVPs with event IDs and insert them
    sampleRSVPs[0].eventId = createdEvents[0]._id;
    sampleRSVPs[1].eventId = createdEvents[2]._id;
    sampleRSVPs[2].eventId = createdEvents[4]._id;

    await RSVP.insertMany(sampleRSVPs);
    console.log('Added sample RSVPs');

    console.log('Database seeded successfully!');
    console.log('\nSample user IDs (for testing):');
    sampleUsers.forEach(user => {
      console.log(`${user.name}: ${user._id}`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase(); 