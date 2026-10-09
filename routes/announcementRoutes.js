const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/', authenticate, createAnnouncement);
router.put('/:id', authenticate, updateAnnouncement);
router.delete('/:id', authenticate, deleteAnnouncement);

module.exports = router;
