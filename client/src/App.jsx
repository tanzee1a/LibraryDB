import { Routes, Route} from 'react-router-dom'
import HomePage from './pages/home_page/homepage.jsx'
import Login from './pages/login_page/login.jsx'
import Notifications from './pages/notifications/notification.jsx'
import Profile from './pages/profile_page/profile.jsx'
import Catalog from './pages/catalog_page/catalog.jsx'
import Navbar from './navbar_component/navbar.jsx'
import './App.css'
import AccountDashboard from './pages/account_dashboard/AccountDashboard.jsx';

function App() {

  return (
    <>
      <Routes>
        {/* USERS */}
        {/* Homepage may need a different navbar view later*/}
        <Route path="/" element={
          <>
            <Navbar />
            <div className="main-content">
              <HomePage />
            </div>
          </>
        } />
        <Route path="/login" element={
          <>
            <Navbar />
            <div className="main-content">
              <Login />
            </div>
          </>
        } />
        <Route path="/notifications" element={
          <>
            <Navbar />
            <div className="main-content">
              <Notifications />
            </div>
          </>
        } />
        <Route path="/profile" element={
          <>
            <Navbar />
            <div className="main-content">
              <Profile />
            </div>
          </>
        } />
        <Route path="/catalog" element={
          <>
            <Navbar />
            <div className="main-content">
              <Catalog />
            </div>
          </>
        } />

        {/* ADMIN */}
      </Routes>
    </>
  )
}

export default App