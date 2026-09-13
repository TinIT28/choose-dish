import './app.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../routes/LoginPage';
import { RegisterPage } from '../routes/RegisterPage';
import { DishesPage } from '../routes/DishesPage';
import { AdminPage } from '../routes/AdminPage';
import { DashboardPage } from '../routes/DashboardPage';
import { SettingsPage } from '../routes/SettingsPage';
import { HistoryPage } from '../routes/HistoryPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dishes" element={<DishesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
