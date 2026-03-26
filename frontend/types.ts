
export enum UserRole {
  STUDENT = 'student',
  STAFF = 'staff',
  ADMIN = 'admin'
}

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  rollNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Exam {
  id: string;
  examCode: string;
  examName: string;
  examDate: string;
  deadline: string;
  department: string;
  description: string;
  createdBy: string; // staffId
  createdAt: string;
}

export interface Application {
  id: string;
  studentId: string;
  examId: string;
  appliedDate: string;
  status: ApplicationStatus;
  remarks: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface SeatingAssignment {
  applicationId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  examId?: string;
  examCode?: string;
  examName?: string;
  seatNumber: string;
  rowNumber: number;
  columnNumber: number;
}

export interface SeatingHall {
  hallName: string;
  rows: number;
  columns: number;
  capacity: number;
  assignments: SeatingAssignment[];
}

export interface SeatingArrangement {
  id: string;
  scopeKey?: string;
  title?: string;
  arrangementDate?: string;
  examIds?: string[];
  examId: string | Exam | null;
  generatedBy: string | User;
  totalStudents: number;
  totalAssigned: number;
  unassignedCount: number;
  halls: SeatingHall[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string | User;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  meta?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
