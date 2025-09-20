import { Route, Routes } from "react-router-dom";
import "./App.css";
import AuthPage from "./pages/auth";
import ErrorPage from "./pages/error";
import MainPage from "./pages/main";
import ProgramPage from "./pages/program";
import HistoryPage from "./pages/history";

function App() {
  return (
    <Routes>
      <Route index path="/auth" element={<AuthPage />} />
      <Route path="/main" element={<MainPage />}>
        <Route index path="program" element={<ProgramPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default App;
