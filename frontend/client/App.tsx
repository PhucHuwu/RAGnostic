import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Error401, Error403, Error500 } from "./pages/ErrorPages";
import AppProfiles from "./pages/AppProfiles";
import AppProfileNew from "./pages/AppProfileNew";
import AppProfileDetails from "./pages/AppProfileDetails";
import AppDocuments from "./pages/AppDocuments";
import AppChat from "./pages/AppChat";
import AdminUsers from "./pages/AdminUsers";
import AdminDocuments from "./pages/AdminDocuments";
import AdminModel from "./pages/AdminModel";
import AdminLogs from "./pages/AdminLogs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* User Routes */}
          <Route path="/app/profiles" element={<AppProfiles />} />
          <Route path="/app/profiles/new" element={<AppProfileNew />} />
          <Route path="/app/profiles/:profileId" element={<AppProfileDetails />} />
          <Route path="/app/profiles/:profileId/documents" element={<AppDocuments />} />
          <Route path="/app/profiles/:profileId/chat" element={<AppChat />} />

          {/* Admin Routes */}
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/documents" element={<AdminDocuments />} />
          <Route path="/admin/model" element={<AdminModel />} />
          <Route path="/admin/logs" element={<AdminLogs />} />

          {/* Error Routes */}
          <Route path="/401" element={<Error401 />} />
          <Route path="/403" element={<Error403 />} />
          <Route path="/500" element={<Error500 />} />

          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
