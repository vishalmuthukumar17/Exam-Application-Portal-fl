import { User, Exam, Application, UserRole, ApplicationStatus, SeatingArrangement, Notification } from './types';
import { normalizeDepartment } from './utils/department';

const mapId = (item: any) => ({ ...item, id: item._id });
const normalizeUser = (user: any) => ({
  ...user,
  id: user?.id || user?._id,
  department: normalizeDepartment(user?.department),
});

const normalizeExam = (exam: any) => ({
  ...exam,
  department: normalizeDepartment(exam?.department),
  createdBy: exam?.createdBy ? {
    ...exam.createdBy,
    department: normalizeDepartment(exam.createdBy.department),
  } : exam?.createdBy,
});

const normalizeApplication = (app: any) => ({
  ...app,
  studentId: app?.studentId && typeof app.studentId === 'object'
    ? normalizeUser(app.studentId)
    : app?.studentId,
  examId: app?.examId && typeof app.examId === 'object'
    ? normalizeExam(app.examId)
    : app?.examId,
});

const normalizeSeatingArrangement = (arrangement: any) => ({
  ...arrangement,
  id: arrangement?.id || arrangement?._id,
  examId: arrangement?.examId && typeof arrangement.examId === 'object'
    ? normalizeExam(arrangement.examId)
    : arrangement?.examId,
  examIds: Array.isArray(arrangement?.examIds)
    ? arrangement.examIds.map((exam: any) => typeof exam === 'object' ? normalizeExam(exam) : exam)
    : arrangement?.examIds,
  generatedBy: arrangement?.generatedBy && typeof arrangement.generatedBy === 'object'
    ? normalizeUser(arrangement.generatedBy)
    : arrangement?.generatedBy,
  halls: Array.isArray(arrangement?.halls)
    ? arrangement.halls.map((hall: any) => ({
        ...hall,
        assignments: Array.isArray(hall?.assignments)
          ? hall.assignments.map((assignment: any) => ({
              ...assignment,
              applicationId: assignment?.applicationId?.toString?.() || assignment?.applicationId,
              studentId: assignment?.studentId?.toString?.() || assignment?.studentId,
              examId: assignment?.examId?.toString?.() || assignment?.examId,
            }))
          : [],
      }))
    : [],
});

const normalizeNotification = (notification: any) => ({
  ...notification,
  userId: notification?.userId && typeof notification.userId === 'object'
    ? normalizeUser(notification.userId)
    : notification?.userId,
});

class ApiStore {
  // Users
  async getUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapId).map(normalizeUser) : [];
  }

  async addUser(user: Omit<User, 'id'>) {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, department: normalizeDepartment(user.department) })
    });
    const data = await res.json();
    return normalizeUser(mapId(data));
  }

  async updateUser(id: string, updates: Partial<User>) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        department: updates.department ? normalizeDepartment(updates.department) : updates.department
      })
    });
    const data = await res.json();
    return normalizeUser(mapId(data));
  }
  
  async deleteUser(id: string) {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    return res.json();
  }

  // Exams
  async getExams() {
    const res = await fetch('/api/exams');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapId).map(normalizeExam) : [];
  }
  
  async addExam(exam: Omit<Exam, 'id'>) {
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...exam, department: normalizeDepartment(exam.department) })
    });
    const data = await res.json();
    return normalizeExam(mapId(data));
  }
  
  async updateExam(id: string, updates: Partial<Exam>) {
    const res = await fetch(`/api/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        department: updates.department ? normalizeDepartment(updates.department) : updates.department
      })
    });
    const data = await res.json();
    return normalizeExam(mapId(data));
  }
  
  async deleteExam(id: string) {
    const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
    return res.json();
  }

  // Applications
  async getApplications() {
    const res = await fetch('/api/applications');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapId).map(normalizeApplication) : [];
  }
  
  async addApplication(app: Omit<Application, 'id'>) {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app)
    });
    const data = await res.json();
    return normalizeApplication(mapId(data));
  }
  
  async updateApplication(id: string, updates: Partial<Application>) {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    return normalizeApplication(mapId(data));
  }
  
  async deleteApplication(id: string) {
    const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    return res.json();
  }

  // Seating Arrangements
  async getSeatingArrangements() {
    const res = await fetch('/api/seating-arrangements');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapId).map(normalizeSeatingArrangement) : [];
  }

  async saveSeatingArrangement(arrangement: Omit<SeatingArrangement, 'id' | 'createdAt' | 'updatedAt'>) {
    const res = await fetch('/api/seating-arrangements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arrangement)
    });
    const data = await res.json();
    return normalizeSeatingArrangement(mapId(data));
  }

  async sendHallTickets(arrangementId: string) {
    const res = await fetch(`/api/seating-arrangements/${arrangementId}/send-hall-tickets`, {
      method: 'POST',
    });
    return res.json();
  }

  async getNotifications() {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapId).map(normalizeNotification) : [];
  }

  async markNotificationRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    const data = await res.json();
    return normalizeNotification(mapId(data));
  }
  
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean, message: string }> {
      try {
          const res = await fetch(`/api/users/${userId}/password`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ oldPassword, newPassword })
          });
          const data = await res.json();
          if (res.ok) {
              return { success: true, message: 'Password changed successfully' };
          }
          return { success: false, message: data.message || 'Error changing password' };
      } catch (err) {
          return { success: false, message: 'Server error' };
      }
  }
}

export const db = new ApiStore();
