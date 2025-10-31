import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AuthPage from "./pages/auth";
import ErrorPage from "./pages/error";
import MainPage from "./pages/main";
import ProgramPage from "./pages/program";
import HistoryPage from "./pages/history";
import DashboardPage from "./pages/dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route index path="/auth" element={<AuthPage />} />
      <Route path="/main" element={<MainPage />}>
        <Route index path="program" element={<ProgramPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default App;
