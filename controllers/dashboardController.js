const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Announcement = require('../models/Announcement');
const User = require('../models/User');

const getDashboardData = async (req, res) => {
  try {
    const [totalEvents, totalRegistrations, totalParticipants, recentAnnouncements, totalStudents, upcomingEvents] = await Promise.all([
      Event.countDocuments(),
      Registration.countDocuments({ status: 'registered' }),
      Registration.countDocuments({ status: 'registered' }),
      Announcement.find().populate('createdBy', 'name').sort({ createdAt: -1 }).limit(5),
      User.countDocuments({ role: 'student' }),
      Event.countDocuments({ date: { $gte: new Date() } })
    ]);

    const stats = {
      totalEvents,
      totalRegistrations,
      totalParticipants,
      upcomingEvents,
      totalStudents,
      recentAnnouncements
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch dashboard data.' });
  }
};

module.exports = { getDashboardData };
