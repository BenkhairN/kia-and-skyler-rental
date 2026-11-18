# Kia & Skyler Rentals

Car rental website and admin dashboard for Kia & Skyler Rentals, serving Grand Bahama Island.
Built with React + Vite (JavaScript), React Router and Lucide icons. No backend required: data is
seeded from `src/data` and persisted in the browser's localStorage under `ksr:` keys.

## Getting started

```bash
npm install
npm run dev
```

- Website: http://localhost:5173
- Admin: http://localhost:5173/admin/login (default `admin` / `admin123`, change it in Settings)

## How the site is organized

Two halves share one codebase:

- **Public website** — what customers see. No login or accounts.
- **Admin dashboard** — password-protected, left sidebar layout, where the business is managed.

All data (vehicles, bookings, settings, uploaded photos) is stored in the browser's localStorage.
It works instantly with no server, but data only exists in the browser where it was entered —
another device has its own copy. A hosted database would be needed for cross-device sync.

## Public website (customers)

- **Home** — hero banner matching the business flyer: business name, "$70.00 a day" price card,
  tagline, phone, "Available 24 hours a day", "$100 refundable deposit", followed by the six
  selling points and featured vehicles. The hero photo is set in Admin > Settings > Home page photo.
- **Our Fleet** — vehicle cards with photo, daily price, seats, transmission and fuel. Search by
  model, year or color; filter by category; sort by price.
- **Car details** — photo gallery (cover + thumbnails), specs, features, reserve and call buttons.
- **Book** — the reservation form:
  - Availability calendar: days taken by pending/confirmed/active bookings are blocked in red;
    a range cannot span a booked day; "Next available from…" appears when the car is busy.
  - Click the gold pick-up or return date again to clear it, or use the "Clear dates" chip.
  - Live quote: days × daily rate + refundable deposit = total due at pick-up.
  - Customer details only (name, phone, email, pick-up location, notes) — no account needed.
  - Submitting creates a booking request and shows a reference number (e.g. `BK-1008`).
- **My Booking** — customers enter their reference + phone to see a live status timeline:
  Request received → Confirmed → Picked up → Returned, with dates, vehicle and total.
  The page follows status changes live, without a refresh (same browser only).
- **About / Contact** — business info, address, phone, email, hours.
- **Theme** — sun/moon button in the navbar; dark is the default, light mode uses an animated
  transition; the choice is saved.

## Admin dashboard

Login at `/admin/login`. Sidebar: Dashboard, Vehicles, Bookings (pending badge), Customers,
Settings, View website, theme button, sign-out.

- **Dashboard** — total bookings, pending requests, active rentals, monthly revenue chart,
  fleet status, recent bookings.
- **Vehicles** — add/edit/delete cars: name, year, category, color, plate, seats, transmission,
  fuel, daily rate, status (Available / Rented / Maintenance), features, description.
  The **Photos** section accepts up to 6 uploads (click or drag); the first photo is the cover
  shown across the site; the star makes another photo the cover; trash removes a photo.
  Photos are resized to ~1280px and stored in the browser, with a storage-limit warning.
- **Bookings** — searchable, filterable list (All / Pending / Confirmed / Active / Completed /
  Cancelled). View, create manually, delete, or change status in the table:
  - **Pending** — new request; counts in the sidebar badge; dates are held.
  - **Confirmed** — accepted; dates stay held.
  - **Active** — picked up; the car becomes "Rented" and counts as revenue.
  - **Completed** — returned and deposit refunded; car back to "Available", dates freed.
  - **Cancelled** — declined; dates freed, no revenue.
  - Overlapping-date bookings show a warning icon.
- **Customers** — auto-built from bookings: name, phone, booking count, total spent.
- **Settings** — business details (name, tagline, phones, email, address, hours), the home page
  photo, pricing rules (daily rate, deposit, minimum driver age), admin username/password,
  and a reset-demo-data button.

## Real-time behavior (same browser)

Every change syncs instantly between open tabs/windows in the same browser:

- A booking submitted in a public tab updates admin tables, dashboard counts and the sidebar
  badge, and shows a "New booking request" toast.
- A status change in admin updates an open "My Booking" page for the customer.
- Vehicle, photo and settings changes appear in other open tabs without refresh.
- Signing in or out applies to all tabs.

This works only within one browser — it uses the `storage` event, not a server.

## Structure

```
src/
  components/
    layout/   Navbar, Footer, PublicLayout, AdminLayout, Sidebar
    cars/     CarCard
    ui/       Modal, Badge, CarImage, StatCard, EmptyState, ConfirmDialog, Logo,
              FeatureIcon, AvailabilityCalendar, PhotoManager
  context/    DataContext (cars, bookings, settings), AuthContext (admin session),
              ThemeContext (dark/light), ToastContext
  data/       cars.js, bookings.js, site.js (sample data and business defaults)
  pages/
    public/   Home, Fleet, CarDetails, Booking, BookingStatus, About, Contact, NotFound
    admin/    Login, Dashboard, Cars, Bookings, Customers, Settings
  styles/     public.css, admin.css
  utils/      availability.js, format.js, image.js, storage.js
public/
  images/     optional photo files (see public/images/README.md)
```

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - production build to `dist/`
- `npm run preview` - preview the production build
- `npm run lint` - run oxlint
