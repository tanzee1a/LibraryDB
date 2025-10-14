import { Routes, Route} from 'react-router-dom'
import HomePage from './home_page/homepage.jsx'
import './App.css'
import AccountDashboard from './account_dashboard/AccountDashboard';

function App() {

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/account" element={<AccountDashboard />} />
    </Routes>
    
  )
}

export default App