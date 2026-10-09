const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('collegeEventToken');
}

function setToken(token) {
  localStorage.setItem('collegeEventToken', token);
}

function clearToken() {
  localStorage.removeItem('collegeEventToken');
}

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    return null;
  }
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : (data.message || 'Request failed.'));
  }

  return data;
}

function showAlert(message, type = 'success') {
  const container = document.getElementById('alertContainer');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = `alert alert-${type} alert-dismissible fade show`;
  wrapper.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
  container.innerHTML = '';
  container.appendChild(wrapper);
}

function renderNav(user) {
  const nav = document.querySelector('[data-role-nav]');
  if (!nav) return;

  const authLinks = document.getElementById('authLinks');
  const dashboardLink = document.getElementById('dashboardLink');
  const eventsLink = document.getElementById('eventsLink');
  const announcementsLink = document.getElementById('announcementsLink');

  if (user) {
    if (authLinks) {
      authLinks.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="/dashboard">Dashboard</a></li>
        <li class="nav-item"><a class="nav-link" href="/events">Events</a></li>
        <li class="nav-item"><a class="nav-link" href="/announcements">Announcements</a></li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">${user.name}</a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="/dashboard">My dashboard</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item text-danger" id="logoutBtn" type="button">Logout</button></li>
          </ul>
        </li>
      `;
    }

    if (dashboardLink) dashboardLink.href = '/dashboard';
    if (eventsLink) eventsLink.href = '/events';
    if (announcementsLink) announcementsLink.href = '/announcements';

    document.addEventListener('click', (event) => {
      if (event.target && event.target.id === 'logoutBtn') {
        handleLogout();
      }
    }, { once: true });
  } else {
    if (authLinks) {
      authLinks.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="/events">Events</a></li>
        <li class="nav-item"><a class="nav-link" href="/announcements">Announcements</a></li>
        <li class="nav-item"><a class="nav-link" href="/login">Login</a></li>
        <li class="nav-item"><a class="btn btn-light ms-2" href="/register">Register</a></li>
      `;
    }

    if (dashboardLink) dashboardLink.href = '/login';
    if (eventsLink) eventsLink.href = '/events';
    if (announcementsLink) announcementsLink.href = '/announcements';
  }
}

async function loadCurrentUser() {
  const token = getToken();
  if (!token) {
    renderNav(null);
    return null;
  }

  try {
    const response = await apiFetch('/auth/me');
    renderNav(response.user);
    return response.user;
  } catch (error) {
    clearToken();
    renderNav(null);
    return null;
  }
}

function handleLogout() {
  clearToken();
  window.location.href = '/login';
}

function routeIfLoggedOut() {
  if (window.location.pathname === '/dashboard' && !getToken()) {
    window.location.href = '/login';
  }
}

function renderEventStatus(status) {
  const formatted = status || 'Upcoming';
  return `<span class="badge status-${formatted.toLowerCase()}">${formatted}</span>`;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function setPageTitle(title) {
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.textContent = title;
}

async function initializeAuthForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const payload = Object.fromEntries(formData.entries());

      try {
        const response = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        setToken(response.token);
        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } catch (error) {
        showAlert(error.message, 'danger');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(registerForm);
      const payload = Object.fromEntries(formData.entries());

      try {
        const response = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        setToken(response.token);
        showAlert('Registration successful! Welcome aboard.', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } catch (error) {
        showAlert(error.message, 'danger');
      }
    });
  }
}

async function initializeHomePage() {
  const trending = document.getElementById('featuredEvents');
  if (!trending) return;

  try {
    const events = await apiFetch('/events');
    const items = events.slice(0, 3);
    trending.innerHTML = items.map((event) => `
      <div class="col-md-4">
        <div class="card event-card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="badge bg-light text-dark">${event.category}</span>
              ${renderEventStatus(event.status)}
            </div>
            <h5 class="card-title">${event.title}</h5>
            <p class="text-muted small">${formatDate(event.date)} • ${event.time}</p>
            <p class="card-text">${event.description.slice(0, 120)}${event.description.length > 120 ? '...' : ''}</p>
            <div class="d-flex justify-content-between text-muted small mb-3">
              <span><i class="bi bi-geo-alt"></i> ${event.venue}</span>
              <span><i class="bi bi-people"></i> ${event.seatsLeft} seats left</span>
            </div>
            <a href="/event-details?id=${event._id}" class="btn btn-primary w-100">View details</a>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    trending.innerHTML = `<div class="col-12"><div class="empty-state">Unable to load featured events right now.</div></div>`;
  }

  const announcementsContainer = document.getElementById('homeAnnouncements');
  if (announcementsContainer) {
    try {
      const announcements = await apiFetch('/announcements');
      announcementsContainer.innerHTML = announcements.slice(0, 3).map((item) => `
        <div class="list-group-item px-0">
          <div class="d-flex justify-content-between"><strong>${item.title}</strong><span class="badge priority-${item.priority.toLowerCase()}">${item.priority}</span></div>
          <p class="mb-1 text-muted">${item.message}</p>
          <small class="text-muted">${formatDate(item.createdAt)}</small>
        </div>
      `).join('');
    } catch (error) {
      announcementsContainer.innerHTML = `<div class="empty-state">No announcements available.</div>`;
    }
  }
}

async function initializeEventsPage() {
  const container = document.getElementById('eventList');
  if (!container) return;

  const search = document.getElementById('eventSearch');
  const categoryFilter = document.getElementById('eventCategory');
  const form = document.getElementById('eventFilters');

  const loadEvents = async () => {
    container.innerHTML = '<div class="loading">Loading events...</div>';
    try {
      const query = new URLSearchParams();
      if (search && search.value) query.append('search', search.value);
      if (categoryFilter && categoryFilter.value && categoryFilter.value !== 'All') query.append('category', categoryFilter.value);

      const events = await apiFetch(`/events?${query.toString()}`);
      if (!events.length) {
        container.innerHTML = '<div class="empty-state">No events match your search.</div>';
        return;
      }

      container.innerHTML = events.map((event) => `
        <div class="col-lg-6">
          <div class="card event-card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-light text-dark">${event.category}</span>
                ${renderEventStatus(event.status)}
              </div>
              <h4>${event.title}</h4>
              <p class="text-muted mb-2">${formatDate(event.date)} • ${event.time}</p>
              <p>${event.description.slice(0, 150)}${event.description.length > 150 ? '...' : ''}</p>
              <ul class="list-unstyled small text-muted mb-3">
                <li><strong>Venue:</strong> ${event.venue}</li>
                <li><strong>Seats left:</strong> ${event.seatsLeft}</li>
              </ul>
              <div class="d-flex gap-2">
                <a href="/event-details?id=${event._id}" class="btn btn-outline-primary">Details</a>
                <button class="btn btn-primary register-btn" data-event-id="${event._id}">Register</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.register-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          const eventId = button.dataset.eventId;
          try {
            if (!getToken()) {
              window.location.href = '/login';
              return;
            }
            await apiFetch('/events/register', {
              method: 'POST',
              body: JSON.stringify({ eventId })
            });
            showAlert('Registration successful!', 'success');
            loadEvents();
          } catch (error) {
            showAlert(error.message, 'danger');
          }
        });
      });
    } catch (error) {
      container.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
  };

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      loadEvents();
    });
  }

  if (search) search.addEventListener('input', loadEvents);
  if (categoryFilter) categoryFilter.addEventListener('change', loadEvents);

  loadEvents();
}

async function initializeEventDetailsPage() {
  const detailContainer = document.getElementById('eventDetails');
  if (!detailContainer) return;

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  if (!eventId) {
    detailContainer.innerHTML = '<div class="empty-state">No event selected.</div>';
    return;
  }

  try {
    const event = await apiFetch(`/events/${eventId}`);
    detailContainer.innerHTML = `
      <div class="card">
        <div class="card-body p-4 p-lg-5">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <span class="badge bg-light text-dark mb-2">${event.category}</span>
              <h2>${event.title}</h2>
            </div>
            ${renderEventStatus(event.status)}
          </div>
          <div class="row g-4">
            <div class="col-lg-8">
              <p>${event.description}</p>
            </div>
            <div class="col-lg-4">
              <div class="bg-light rounded p-3">
                <p><strong>Date:</strong> ${formatDate(event.date)}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
                <p><strong>Capacity:</strong> ${event.capacity}</p>
                <p><strong>Seats left:</strong> ${event.seatsLeft}</p>
              </div>
            </div>
          </div>
          <div class="mt-4 d-flex gap-2">
            <button id="registerEvent" class="btn btn-primary">Register for this event</button>
            <a href="/events" class="btn btn-outline-secondary">Back to events</a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('registerEvent').addEventListener('click', async () => {
      try {
        if (!getToken()) {
          window.location.href = '/login';
          return;
        }
        await apiFetch('/events/register', {
          method: 'POST',
          body: JSON.stringify({ eventId })
        });
        showAlert('You have registered successfully.', 'success');
      } catch (error) {
        showAlert(error.message, 'danger');
      }
    });
  } catch (error) {
    detailContainer.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

async function initializeAnnouncementsPage() {
  const container = document.getElementById('announcementList');
  if (!container) return;

  try {
    const announcements = await apiFetch('/announcements');
    if (!announcements.length) {
      container.innerHTML = '<div class="empty-state">No announcements available.</div>';
      return;
    }

    container.innerHTML = announcements.map((item) => `
      <div class="col-12">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between gap-3 flex-wrap mb-2">
              <h4>${item.title}</h4>
              <span class="badge priority-${item.priority.toLowerCase()}">${item.priority}</span>
            </div>
            <p>${item.message}</p>
            <small class="text-muted">Posted ${formatDate(item.createdAt)}</small>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

async function initializeDashboardPage() {
  routeIfLoggedOut();
  const user = await loadCurrentUser();
  if (!user) return;

  const stats = document.getElementById('dashboardStats');
  const eventList = document.getElementById('studentEventList');
  const announcementList = document.getElementById('recentAnnouncements');
  const adminPanel = document.getElementById('adminPanel');
  const participantTable = document.getElementById('participantTable');
  const createEventForm = document.getElementById('createEventForm');
  const createAnnouncementForm = document.getElementById('createAnnouncementForm');

  const renderDashboard = async () => {
    try {
      const dashboardData = await apiFetch('/dashboard');
      stats.innerHTML = `
        <div class="col-md-6 col-lg-3">
          <div class="card summary-card p-3 h-100">
            <p class="text-muted mb-1">Total Events</p>
            <h3>${dashboardData.totalEvents}</h3>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card summary-card p-3 h-100">
            <p class="text-muted mb-1">Upcoming Events</p>
            <h3>${dashboardData.upcomingEvents}</h3>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card summary-card p-3 h-100">
            <p class="text-muted mb-1">Total Registrations</p>
            <h3>${dashboardData.totalRegistrations}</h3>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card summary-card p-3 h-100">
            <p class="text-muted mb-1">Total Participants</p>
            <h3>${dashboardData.totalParticipants}</h3>
          </div>
        </div>
      `;

      if (announcementList) {
        announcementList.innerHTML = (dashboardData.recentAnnouncements || []).map((item) => `
          <li class="list-group-item d-flex justify-content-between align-items-start">
            <div>
              <strong>${item.title}</strong>
              <div class="text-muted small">${item.message}</div>
            </div>
            <span class="badge priority-${item.priority.toLowerCase()}">${item.priority}</span>
          </li>
        `).join('') || '<li class="list-group-item">No announcements yet.</li>';
      }
    } catch (error) {
      if (stats) stats.innerHTML = `<div class="col-12"><div class="empty-state">${error.message}</div></div>`;
    }

    if (user.role === 'student') {
      if (adminPanel) adminPanel.style.display = 'none';
      if (eventList) {
        try {
          const registrations = await apiFetch('/events/my-registrations');
          eventList.innerHTML = registrations.length
            ? registrations.map((item) => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>${item.eventId?.title || 'Event'}</strong>
                    <div class="text-muted small">${formatDate(item.eventId?.date)} • ${item.eventId?.venue || 'Venue'}</div>
                  </div>
                  <button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${item._id}">Cancel</button>
                </li>
              `).join('')
            : '<li class="list-group-item">You have not registered for any event yet.</li>';

          document.querySelectorAll('.cancel-btn').forEach((button) => {
            button.addEventListener('click', async () => {
              try {
                await apiFetch(`/events/cancel/${button.dataset.id}`, { method: 'PATCH' });
                showAlert('Registration cancelled successfully.', 'success');
                renderDashboard();
              } catch (error) {
                showAlert(error.message, 'danger');
              }
            });
          });
        } catch (error) {
          eventList.innerHTML = `<li class="list-group-item">${error.message}</li>`;
        }
      }
    }

    if (user.role === 'admin') {
      if (eventList) eventList.style.display = 'none';
      if (adminPanel) adminPanel.style.display = 'block';

      if (createEventForm) {
        createEventForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const payload = Object.fromEntries(new FormData(createEventForm).entries());
          try {
            await apiFetch('/events', {
              method: 'POST',
              body: JSON.stringify(payload)
            });
            showAlert('Event created successfully', 'success');
            createEventForm.reset();
            renderDashboard();
          } catch (error) {
            showAlert(error.message, 'danger');
          }
        });
      }

      if (createAnnouncementForm) {
        createAnnouncementForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const payload = Object.fromEntries(new FormData(createAnnouncementForm).entries());
          try {
            await apiFetch('/announcements', {
              method: 'POST',
              body: JSON.stringify(payload)
            });
            showAlert('Announcement published successfully', 'success');
            createAnnouncementForm.reset();
            renderDashboard();
          } catch (error) {
            showAlert(error.message, 'danger');
          }
        });
      }

      if (participantTable) {
        try {
          const participants = await apiFetch('/events/participants');
          participantTable.innerHTML = participants.length ? participants.map((participant) => `
            <tr>
              <td>${participant.name}</td>
              <td>${participant.email}</td>
              <td>${participant.eventName}</td>
              <td>${formatDate(participant.registrationDate)}</td>
            </tr>
          `).join('') : '<tr><td colspan="4" class="text-center">No participant registrations yet.</td></tr>';
        } catch (error) {
          participantTable.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`;
        }
      }
    }
  };

  await renderDashboard();
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentUser();
  initializeAuthForms();

  if (document.getElementById('featuredEvents') || document.getElementById('homeAnnouncements')) {
    initializeHomePage();
  }

  if (document.getElementById('eventList')) {
    initializeEventsPage();
  }

  if (document.getElementById('eventDetails')) {
    initializeEventDetailsPage();
  }

  if (document.getElementById('announcementList')) {
    initializeAnnouncementsPage();
  }

  if (document.getElementById('dashboardStats')) {
    initializeDashboardPage();
  }
});
