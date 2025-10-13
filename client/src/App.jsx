import { Routes, Route} from 'react-router-dom'
import HomePage from './pages/home_page/homepage.jsx'
import Login from './pages/login_page/login.jsx'
import Notifications from './pages/notifications/notification.jsx'
import './App.css'

function App() {

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/notifications" element={<Notifications />} />
    </Routes>
  )
}

export default App