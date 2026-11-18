import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/layout/AdminLayout'
import Home from './pages/public/Home'
import Fleet from './pages/public/Fleet'
import CarDetails from './pages/public/CarDetails'
import Booking from './pages/public/Booking'
import BookingStatus from './pages/public/BookingStatus'
import Faq from './pages/public/Faq'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import NotFound from './pages/public/NotFound'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Cars from './pages/admin/Cars'
import Bookings from './pages/admin/Bookings'
import Customers from './pages/admin/Customers'
import AdminFeedback from './pages/admin/Messages'
import Settings from './pages/admin/Settings'
import AdminCalendar from './pages/admin/Calendar'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <DataProvider>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/fleet" element={<Fleet />} />
                  <Route path="/fleet/:id" element={<CarDetails />} />
                  <Route path="/book" element={<Booking />} />
                  <Route path="/booking-status" element={<BookingStatus />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="cars" element={<Cars />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="calendar" element={<AdminCalendar />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                  <Route path="testimonials" element={<Navigate to="/admin/feedback" replace />} />
                  <Route path="messages" element={<Navigate to="/admin/feedback" replace />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </DataProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
