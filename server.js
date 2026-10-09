require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const seedDatabase = require('./seed');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'College Event Manager API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard', dashboardRoutes);

const viewsDir = path.join(__dirname, 'views');

app.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(viewsDir, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(viewsDir, 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(viewsDir, 'dashboard.html')));
app.get('/events', (req, res) => res.sendFile(path.join(viewsDir, 'events.html')));
app.get('/event-details', (req, res) => res.sendFile(path.join(viewsDir, 'event-details.html')));
app.get('/announcements', (req, res) => res.sendFile(path.join(viewsDir, 'announcements.html')));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

async function startServer() {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
