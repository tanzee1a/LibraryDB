import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from './pages/home_page/homepage.jsx'
import Login from './pages/login_page/login.jsx'
import Notifications from './pages/notifications/notification.jsx'
import BookDetails from './pages/catalog_page/book_details.jsx'
import MediaDetails from './pages/catalog_page/media_details.jsx'
import DeviceDetails from './pages/catalog_page/device_details.jsx'
import AccountDashboard from './pages/account_dashboard/AccountDashboard.jsx';
import Register from './pages/register_page/register.jsx';
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* USERS */}
        {/* Homepage may need a different navbar view later*/}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/book-details" element={<BookDetails />} />
        <Route path="/media-details" element={<MediaDetails />} />
        <Route path="/device-details" element={<DeviceDetails />} />
        <Route path="/account" element={<AccountDashboard />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/notifications" element={<Notifications />} />
        {/* ADMIN */}
      </Routes>
    </BrowserRouter>
  )
}

export default App