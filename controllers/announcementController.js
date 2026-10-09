const Announcement = require('../models/Announcement');

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to fetch announcements.' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create announcements.' });
    }

    const { title, message, priority } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required.' });
    }

    const announcement = await Announcement.create({
      title,
      message,
      priority: priority || 'Medium',
      createdBy: req.user._id
    });

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to create announcement.' });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update announcements.' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    const { title, message, priority } = req.body;
    if (title) announcement.title = title;
    if (message) announcement.message = message;
    if (priority) announcement.priority = priority;

    await announcement.save();
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to update announcement.' });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete announcements.' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    await announcement.deleteOne();
    res.json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to delete announcement.' });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
