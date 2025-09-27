import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import BudgetTracker from "./pages/BudgetTracker.jsx";
import HargaAlert from "./pages/HargaAlert.jsx";
import KedaiExpress from "./pages/KedaiExpress.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import OrdersDashboard from "./pages/OrdersDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ShopPublic from "./pages/ShopPublic.jsx";
import PromotionsHub from "./pages/PromotionsHub.jsx"; // 🆕

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/shop/:slug" element={<ShopPublic />} />
          <Route path="/promosi" element={<PromotionsHub />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/budget-tracker" element={<ProtectedRoute><BudgetTracker /></ProtectedRoute>} />
          <Route path="/harga-alert" element={<ProtectedRoute><HargaAlert /></ProtectedRoute>} />
          <Route path="/kedai-express" element={<ProtectedRoute><KedaiExpress /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersDashboard /></ProtectedRoute>} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
