const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
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
} = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.get('/participants', authenticate, getParticipants);
router.get('/export-csv', authenticate, exportParticipantsCSV);
router.get('/my-registrations', authenticate, getMyRegistrations);
router.get('/:id', getEventById);
router.post('/', authenticate, createEvent);
router.post('/register', authenticate, registerForEvent);
router.put('/:id', authenticate, updateEvent);
router.delete('/:id', authenticate, deleteEvent);
router.patch('/cancel/:id', authenticate, cancelRegistration);

module.exports = router;
