import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Navigation } from "./components/Navigation";
import { MyTasksPage } from "./pages/MyTasksPage";
import { SprintPlanningPage } from "./pages/SprintPlanningPage";
import { TeamStandupPage } from "./pages/TeamStandupPage";
import { SlackExportPage } from "./pages/SlackExportPage";
import { AdminPage } from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Navigation />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Routes>
                <Route path="/" element={<TeamStandupPage />} />
                <Route path="/my-tasks" element={<MyTasksPage />} />
                <Route path="/sprint-planning" element={<SprintPlanningPage />} />
                <Route path="/slack-export" element={<SlackExportPage />} />
                <Route path="/admin" element={<AdminPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
export default AppRouter;