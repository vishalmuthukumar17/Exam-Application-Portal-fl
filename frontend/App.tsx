
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { User, UserRole, AuthState } from './types';
import { db } from './store';
import { normalizeDepartment } from './utils/department';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import UserManagement from './views/UserManagement';
import ExamManagement from './views/ExamManagement';
import ApplicationReview from './views/ApplicationReview';
import AvailableExams from './views/AvailableExams';
import MyApplications from './views/MyApplications';
import ChangePassword from './views/ChangePassword';
import SeatingArrangement from './views/SeatingArrangement';
import HallTickets from './views/HallTickets';
import AdminHallTickets from './views/AdminHallTickets';

// Context
interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode, roles?: UserRole[] }> = ({ children, roles }) => {
  const { auth } = useAuth();
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && auth.user && !roles.includes(auth.user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = sessionStorage.getItem('ep_session');
    if (!saved) return { user: null, isAuthenticated: false };

    const parsed = JSON.parse(saved);
    return parsed?.user
      ? { ...parsed, user: { ...parsed.user, department: normalizeDepartment(parsed.user.department) } }
      : { user: null, isAuthenticated: false };
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      if (!text) {
        console.error("Login failed: Empty response from server (is the backend running?)");
        alert("Could not reach the server. Make sure the backend is running on port 5000.");
        return false;
      }

      const data = JSON.parse(text);
      
      if (res.ok) {
        const mappedUser = {
          ...data.user,
          id: data.user.id || data.user._id,
          department: normalizeDepartment(data.user.department),
        };
        const newAuth = { user: mappedUser, isAuthenticated: true };
        setAuth(newAuth);
        sessionStorage.setItem('ep_session', JSON.stringify(newAuth));
        return true;
      } else {
        alert(data.message || "Invalid credentials");
        return false;
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Error connecting to server. Make sure the backend is running.");
      return false;
    }
  };

  const logout = () => {
    setAuth({ user: null, isAuthenticated: false });
    sessionStorage.removeItem('ep_session');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      <HashRouter>
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
          {auth.isAuthenticated && auth.user?.role !== UserRole.STUDENT && <Sidebar />}
          
          <div className="flex-1 flex flex-col min-w-0">
            {auth.isAuthenticated && (
              <Navbar />
            )}
            
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
              <Routes>
                <Route path="/login" element={!auth.isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="/profile/password" element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                } />

                {/* Staff & Admin Routes */}
                <Route path="/exams" element={
                  <ProtectedRoute roles={[UserRole.STAFF, UserRole.ADMIN]}>
                    <ExamManagement />
                  </ProtectedRoute>
                } />
                <Route path="/applications/review" element={
                  <ProtectedRoute roles={[UserRole.STAFF, UserRole.ADMIN]}>
                    <ApplicationReview />
                  </ProtectedRoute>
                } />

                {/* Admin Only */}
                <Route path="/users" element={
                  <ProtectedRoute roles={[UserRole.ADMIN]}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/seating-arrangement" element={
                  <ProtectedRoute roles={[UserRole.ADMIN]}>
                    <SeatingArrangement />
                  </ProtectedRoute>
                } />
                <Route path="/hall-ticket-dispatch" element={
                  <ProtectedRoute roles={[UserRole.ADMIN]}>
                    <AdminHallTickets />
                  </ProtectedRoute>
                } />

                {/* Student Routes */}
                <Route path="/exams/available" element={
                  <ProtectedRoute roles={[UserRole.STUDENT]}>
                    <AvailableExams />
                  </ProtectedRoute>
                } />
                <Route path="/applications/my" element={
                  <ProtectedRoute roles={[UserRole.STUDENT]}>
                    <MyApplications />
                  </ProtectedRoute>
                } />
                <Route path="/hall-tickets" element={
                  <ProtectedRoute roles={[UserRole.STUDENT]}>
                    <HallTickets />
                  </ProtectedRoute>
                } />

                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
        </div>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
