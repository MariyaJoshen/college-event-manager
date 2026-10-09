const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

const getEventStatus = (eventDate) => {
  const today = new Date();
  const target = new Date(eventDate);

  if (target < today) return 'Completed';
  if (target.toDateString() === today.toDateString()) return 'Ongoing';
  return 'Upcoming';
};

const getEvents = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    const events = await Event.find(filter).populate('createdBy', 'name email').sort({ date: 1 });

    const formatted = await Promise.all(events.map(async (event) => {
      const registrations = await Registration.countDocuments({ eventId: event._id, status: 'registered' });
      const seatsLeft = Math.max(event.capacity - registrations, 0);
      return {
        ...event.toObject(),
        status: getEventStatus(event.date),
        seatsLeft,
        registrations
      };
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch events.' });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const registrations = await Registration.find({ eventId: event._id, status: 'registered' }).populate('studentId', 'name email');
    const seatsLeft = Math.max(event.capacity - registrations.length, 0);

    res.json({
      ...event.toObject(),
      status: getEventStatus(event.date),
      seatsLeft,
      registrations,
      totalParticipants: registrations.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch event detail.' });
  }
};

const createEvent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create events.' });
    }

    const { title, description, date, time, venue, category, capacity } = req.body;

    if (!title || !description || !date || !time || !venue || !category || !capacity) {
      return res.status(400).json({ message: 'All event fields are required.' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      time,
      venue,
      category,
      capacity,
      createdBy: req.user._id
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to create event.' });
  }
};

const updateEvent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update events.' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      event[key] = updates[key];
    });

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to update event.' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete events.' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    await Registration.deleteMany({ eventId: event._id });
    await event.deleteOne();
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to delete event.' });
  }
};

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const existingRegistration = await Registration.findOne({ studentId: req.user._id, eventId });
    if (existingRegistration && existingRegistration.status === 'registered') {
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }

    const count = await Registration.countDocuments({ eventId, status: 'registered' });
    if (count >= event.capacity) {
      return res.status(400).json({ message: 'This event is already full.' });
    }

    const registration = await Registration.create({
      studentId: req.user._id,
      eventId,
      status: 'registered'
    });

    res.status(201).json({ message: 'Registration successful.', registration });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Registration failed.' });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ studentId: req.user._id, status: 'registered' })
      .populate('eventId')
      .sort({ registrationDate: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch your registrations.' });
  }
};

const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({ _id: req.params.id, studentId: req.user._id });
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    registration.status = 'cancelled';
    await registration.save();
    res.json({ message: 'Registration cancelled successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to cancel registration.' });
  }
};

const getParticipants = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view participant lists.' });
    }

    const { eventId, search } = req.query;
    const filter = { status: 'registered' };

    if (eventId) filter.eventId = eventId;

    const registrations = await Registration.find(filter)
      .populate('studentId', 'name email')
      .populate('eventId', 'title')
      .sort({ registrationDate: -1 });

    let filtered = registrations;
    if (search) {
      filtered = registrations.filter((item) => {
        const student = item.studentId || {};
        const event = item.eventId || {};
        return (
          student.name?.toLowerCase().includes(search.toLowerCase()) ||
          student.email?.toLowerCase().includes(search.toLowerCase()) ||
          event.title?.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    res.json(filtered.map((registration) => ({
      _id: registration._id,
      name: registration.studentId?.name,
      email: registration.studentId?.email,
      eventName: registration.eventId?.title,
      registrationDate: registration.registrationDate,
      status: registration.status
    })));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch participants.' });
  }
};

const exportParticipantsCSV = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can export participant data.' });
    }

    const { eventId } = req.query;
    const filter = { status: 'registered' };
    if (eventId) filter.eventId = eventId;

    const registrations = await Registration.find(filter)
      .populate('studentId', 'name email')
      .populate('eventId', 'title');

    const csvRows = [
      ['Name', 'Email', 'Event Name', 'Registration Date']
    ];

    registrations.forEach((registration) => {
      csvRows.push([
        registration.studentId?.name || '',
        registration.studentId?.email || '',
        registration.eventId?.title || '',
        new Date(registration.registrationDate).toISOString().split('T')[0]
      ]);
    });

    const csv = csvRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="participants.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to export participant data.' });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getParticipants,
  exportParticipantsCSV
};
