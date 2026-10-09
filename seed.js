const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
const Announcement = require('./models/Announcement');
const Registration = require('./models/Registration');
const connectDB = require('./config/db');

async function seedDatabase() {
  try {
    await connectDB();

    const adminExists = await User.findOne({ email: 'admin@college.edu' });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@college.edu',
        password: adminPassword,
        role: 'admin'
      });

      const studentPassword = await bcrypt.hash('student123', 10);
      const student = await User.create({
        name: 'Student User',
        email: 'student@college.edu',
        password: studentPassword,
        role: 'student'
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const workshopDate = new Date();
      workshopDate.setDate(workshopDate.getDate() + 4);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 6);

      const eventOne = await Event.create({
        title: 'National Hackathon 2026',
        description: 'A competitive coding event for students to build real-world solutions.',
        date: futureDate,
        time: '09:00 AM',
        venue: 'Innovation Lab',
        category: 'Technology',
        capacity: 80,
        createdBy: admin._id
      });

      const eventTwo = await Event.create({
        title: 'Campus Cultural Fest',
        description: 'An evening of music, dance, art, and performances by student clubs.',
        date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        time: '05:30 PM',
        venue: 'Main Auditorium',
        category: 'Cultural',
        capacity: 120,
        createdBy: admin._id
      });

      const eventThree = await Event.create({
        title: 'Robotics Workshop',
        description: 'Hands-on robotics session with demonstrations and project building.',
        date: workshopDate,
        time: '11:00 AM',
        venue: 'STEM Block',
        category: 'Workshop',
        capacity: 40,
        createdBy: admin._id
      });

      const eventFour = await Event.create({
        title: 'Career Readiness Seminar',
        description: 'A career guidance and placement preparation session for all departments.',
        date: pastDate,
        time: '02:00 PM',
        venue: 'Seminar Hall',
        category: 'Career',
        capacity: 60,
        createdBy: admin._id
      });

      await Registration.create({
        studentId: student._id,
        eventId: eventOne._id,
        status: 'registered',
        registrationDate: new Date()
      });

      await Registration.create({
        studentId: student._id,
        eventId: eventThree._id,
        status: 'registered',
        registrationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });

      await Announcement.create({
        title: 'Registration Open',
        message: 'Student registrations for the National Hackathon are now open until Friday.',
        priority: 'High',
        createdBy: admin._id
      });

      await Announcement.create({
        title: 'Campus Fest Volunteers Needed',
        message: 'We are looking for volunteers for setup, hospitality, and stage management.',
        priority: 'Medium',
        createdBy: admin._id
      });

      await Announcement.create({
        title: 'Workshop Reminder',
        message: 'Please bring your college ID and laptop to the Robotics Workshop.',
        priority: 'Low',
        createdBy: admin._id
      });
    }

    const eventsCount = await Event.countDocuments();
    const announcementsCount = await Announcement.countDocuments();

    if (eventsCount > 0 && announcementsCount > 0) {
      console.log('Sample data ready.');
    }

    return true;
  } catch (error) {
    console.error('Seed failed:', error.message);
    return false;
  }
}

module.exports = seedDatabase;

if (require.main === module) {
  seedDatabase();
}
