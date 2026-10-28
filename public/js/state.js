/**
 * AidPath Global Reactive State Store
 */

class AppState {
  constructor() {
    this.currentUser = null;
    this.personas = [];
    this.activeTab = 'landing';
    this.scholarships = [];
    this.applications = [];
    this.staleRecords = [];
    this.metrics = {
      student: null,
      operational: null,
    };
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  setCurrentUser(user) {
    this.currentUser = user;
    this.emit('user:changed', user);
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    this.emit('tab:changed', tab);
  }

  setScholarships(list) {
    this.scholarships = list;
    this.emit('scholarships:updated', list);
  }

  setApplications(apps) {
    this.applications = apps;
    this.emit('applications:updated', apps);
  }

  setStaleRecords(records) {
    this.staleRecords = records;
    this.emit('staleRecords:updated', records);
  }

  isStaffOrAdmin() {
    return this.currentUser && (this.currentUser.role === 'operator' || this.currentUser.role === 'admin');
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  isStudent() {
    return this.currentUser && this.currentUser.role === 'student';
  }
}

export const state = new AppState();
