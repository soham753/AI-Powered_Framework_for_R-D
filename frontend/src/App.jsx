import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login.jsx";
import RegisterPage from "./RegisterPage.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import ProjectDashboard from "./ProjectDashboard.jsx";
import Tools from "./Tools.jsx";
import Summarizer from "./Summarizer.jsx";
import Feedback from "./feedback.jsx";
import PriceComparison from "./PriceComparison.jsx";
import NotesAndProducts from "./Note.jsx";
import RDCostCalculator from "./RDCostCalculator.jsx";
function App() {
  let projectDashboardPath = `${localStorage.getItem(
    "userId"
  )}/ProjectDashboard`;
  let toolPath = `${localStorage.getItem("projectId")}/ToolDashboard`;
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/summarizer" element={<Summarizer />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/pricecomparison" element={<PriceComparison />} />
          <Route path="/rdCostCalculator" element={<RDCostCalculator />} />

          <Route
            path="/:userId/ProjectDashboard"
            element={<ProjectDashboard />}
          />
          <Route path="/notes" element={<NotesAndProducts />} />
          <Route path="/:projectId/ToolDashboard" element={<Tools />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
