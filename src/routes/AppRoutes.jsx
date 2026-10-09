import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock Pages (to be replaced with actual feature components)
const LoginPage = () => <div className="p-4">Login Page (WIP)</div>;
const StudentDashboard = () => <div className="p-4">Student Dashboard (WIP)</div>;
const EducatorDashboard = () => <div className="p-4">Educator Dashboard (WIP)</div>;
const MainLayout = ({ children }) => <div className="app-layout">{children}</div>;

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Educator Routes */}
      <Route element={<ProtectedRoute allowedRoles={['educator']} />}>
        <Route path="/educator/*" element={
          <MainLayout>
            <EducatorDashboard />
          </MainLayout>
        } />
      </Route>

      {/* Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student/*" element={
          <MainLayout>
            <StudentDashboard />
          </MainLayout>
        } />
      </Route>

      {/* Default Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
