import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from './pages/home_page/homepage.jsx'
import Login from './pages/login_page/login.jsx'
import Notifications from './pages/notifications/notification.jsx'
import Catalog from './pages/catalog_page/catalog.jsx'
import BookCatalog from './pages/catalog_page/book.jsx'
import MovieCatalog from './pages/catalog_page/movie.jsx'
import DeviceCatalog from './pages/catalog_page/device.jsx'
import ItemDetails from './pages/catalog_page/item_details.jsx'
import AccountDashboard from './pages/account_dashboard/AccountDashboard.jsx';
import Register from './pages/register_page/register .jsx';
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
        <Route path="/item-details" element={<ItemDetails />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/account" element={<AccountDashboard />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/books" element={<BookCatalog />} />
        <Route path="/movies" element={<MovieCatalog />} />
        <Route path="/devices" element={<DeviceCatalog />} />
        {/* ADMIN */}
      </Routes>
    </BrowserRouter>
  )
}

export default App