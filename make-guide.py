from fpdf import FPDF

NAVY = (13, 27, 62)
GOLD = (212, 168, 33)
GREY = (110, 118, 138)
LIGHT = (247, 248, 251)

pdf = FPDF(unit='mm', format='A4')
pdf.set_auto_page_break(True, margin=18)
pdf.set_margins(20, 18, 20)

def h1(t):
    pdf.set_font('helvetica', 'B', 17)
    pdf.set_text_color(*NAVY)
    pdf.ln(2)
    pdf.cell(0, 10, t)
    pdf.ln(12)
    pdf.set_draw_color(*GOLD)
    pdf.set_line_width(0.8)
    pdf.line(20, pdf.get_y(), 60, pdf.get_y())
    pdf.ln(5)

def h2(t):
    pdf.set_font('helvetica', 'B', 12.5)
    pdf.set_text_color(*NAVY)
    pdf.ln(2)
    pdf.cell(0, 7, t)
    pdf.ln(8)

def body(t):
    pdf.set_font('helvetica', '', 10.5)
    pdf.set_text_color(50, 56, 74)
    pdf.multi_cell(0, 5.5, t)
    pdf.ln(1)

def bullet(items):
    pdf.set_font('helvetica', '', 10.5)
    pdf.set_text_color(50, 56, 74)
    for i in items:
        pdf.set_x(25)
        pdf.multi_cell(0, 5.5, chr(149) + '  ' + i)
    pdf.ln(1)

def numbered(items):
    pdf.set_font('helvetica', '', 10.5)
    pdf.set_text_color(50, 56, 74)
    for n, i in enumerate(items, 1):
        pdf.set_x(25)
        pdf.multi_cell(0, 5.5, f'{n}.  {i}')
    pdf.ln(1)

def tip(t):
    pdf.set_fill_color(253, 246, 224)
    pdf.set_draw_color(*GOLD)
    y = pdf.get_y()
    pdf.set_font('helvetica', 'B', 10)
    pdf.multi_cell(0, 6, '  TIP: ' + t, border=0, fill=True)
    pdf.ln(2)

def table(rows, widths):
    for i, r in enumerate(rows):
        pdf.set_font('helvetica', 'B' if i == 0 else '', 10)
        if i == 0:
            pdf.set_fill_color(*NAVY)
            pdf.set_text_color(255, 255, 255)
        else:
            pdf.set_fill_color(*(LIGHT if i % 2 else (255, 255, 255)))
            pdf.set_text_color(50, 56, 74)
        for j, c in enumerate(r):
            pdf.cell(widths[j], 7, c, border=1, fill=True)
        pdf.ln()
    pdf.ln(3)

# ---- Cover ----
pdf.add_page()
pdf.ln(60)
pdf.set_font('helvetica', 'B', 32)
pdf.set_text_color(*NAVY)
pdf.cell(0, 14, 'Kia & Skyler Rentals', align='C')
pdf.ln(20)
pdf.set_font('helvetica', '', 16)
pdf.set_text_color(*GOLD)
pdf.cell(0, 10, 'Admin Website Guide', align='C')
pdf.ln(16)
pdf.set_font('helvetica', '', 11)
pdf.set_text_color(*GREY)
pdf.cell(0, 7, 'Managing vehicles, bookings, customers, feedback and settings', align='C')
pdf.ln(8)
pdf.cell(0, 7, 'Grand Bahama Island  -  November 2026', align='C')

# ---- 1. Getting started ----
pdf.add_page()
h1('1. Getting Started')
h2('Logging in')
numbered([
    'Go to your website, scroll to the bottom of any page and click Admin - or go directly to yourwebsite.com/admin.',
    'Enter your admin username and password.',
    'You will land on the Dashboard.',
])
pdf.set_font('helvetica', 'B', 10)
pdf.set_text_color(214, 69, 92)
pdf.multi_cell(0, 6, 'IMPORTANT: Keep your admin login private. Anyone with these credentials can see bookings, edit vehicles and change prices.')
pdf.ln(2)
h2('Finding your way around')
body('The left sidebar contains all admin sections:')
table([
    ['Section', 'What it does'],
    ['Dashboard', 'Overview of your fleet, bookings and revenue'],
    ['Vehicles', 'Add, edit and remove rental cars'],
    ['Bookings', 'All rental requests - confirm, edit, complete or cancel'],
    ['Calendar', 'Month view showing which vehicle is out on which days'],
    ['Customers', 'Everyone who has booked, with contact details'],
    ['Feedback', 'Messages and reviews sent from the website'],
    ['Settings', 'Business info, prices, bank details and website content'],
], [45, 125])

# ---- 2. Dashboard ----
h1('2. Dashboard')
body('The Dashboard gives you a quick snapshot of the business:')
bullet([
    'Total vehicles - how many cars are in your fleet and how many are available right now.',
    'Active & confirmed - confirmed bookings, plus pending requests waiting on you.',
    'Revenue - total from active and completed rentals.',
    'Pending requests - new booking requests waiting for confirmation.',
    'Revenue by month - bar chart of the last 6 months.',
    'Recent bookings - the 6 newest requests; click one to open it in Bookings.',
])

# ---- 3. Vehicles ----
h1('3. Vehicles')
h2('Adding a vehicle')
numbered([
    'Go to Vehicles then click Add vehicle.',
    'Fill in the details: name, year, color, category, seats, transmission, fuel type, daily rate and features.',
    'Upload photos - the first photo becomes the cover photo shown on the website.',
    'Click Save. The vehicle appears on the public site immediately.',
])
h2('Editing a vehicle')
body('Click the Edit button on the vehicle in the list, change any details and save. Changes go live instantly.')
h2('Photos')
bullet([
    'Upload multiple photos per vehicle - customers see them as a gallery on the car page.',
    'Hover a photo to set it as cover, reorder or delete it.',
    'Use clear, horizontal photos - around 1600 x 1000 pixels looks best.',
])
h2('Maintenance mode')
body('If a vehicle is being repaired or unavailable, flip its status toggle to Maintenance. The car stays listed but shows as unavailable so customers cannot book it.')
tip('Availability is automatic - the website checks booking dates, so a car with a confirmed booking for those dates cannot be double-booked. You do not need to mark cars as "rented" yourself.')

# ---- 4. Bookings ----
pdf.add_page()
h1('4. Bookings')
body('This is where you spend most of your time. The table shows every rental request:')
table([
    ['Column', 'What is in it'],
    ['Customer', 'Name, phone number and booking reference stacked together'],
    ['Vehicle', 'The requested car and its color'],
    ['Dates', 'Pick-up date, return date and when the booking was made'],
    ['Total', 'Amount due, and how they will pay: At pick-up (gold) or Paid online (green)'],
    ['Status', 'Dropdown to change the booking status'],
    ['Actions', 'Open details, edit or delete'],
], [40, 130])
h2('The booking workflow')
body('Pending  ->  Confirmed  ->  Completed')
numbered([
    'Customer submits a request - it arrives as Pending. You get a notification popup if you are logged in.',
    'Contact the customer - call or WhatsApp them to confirm dates, price and pick-up location.',
    'Change status to Confirmed - only after you have spoken with them. The customer can then see "Confirmed" on their booking status page.',
    '"Picked up" appears automatically during the rental period - no action needed from you.',
    'After return, set the status to Completed.',
    'Cancelled - if the customer cancels or the request does not work out. The car becomes bookable for those dates again.',
])
h2('Editing a booking')
body('Open a booking and click Edit to change the vehicle, dates, customer details, pick-up location, notes, status and payment info.')
h2('Payment method')
bullet([
    'After you confirm a booking, the customer chooses Pay online or I will pay at pick-up on their status page.',
    'The Total column shows their choice: At pick-up or Paid online.',
    'If someone chose pick-up but wants to pay online later, they can switch on their status page - you will see it update.',
])
h2('Search & sort')
bullet([
    'Use the search box to find a booking by name, phone, reference or vehicle.',
    'Click the column headers to sort by date, total, etc.',
])

# ---- 5-7 ----
pdf.add_page()
h1('5. Calendar')
bullet([
    'Each colored chip is a booking - the color shows its status (gold pending, blue confirmed, green picked up, grey completed).',
    'A chip spans every day from pick-up through the return date.',
    'Click a chip to jump to that booking in the Bookings list.',
    'Use the arrows to move between months; This month jumps back to today.',
])
tip('Check the calendar before confirming a booking - it is the fastest way to spot a vehicle that is already out.')

h1('6. Customers')
body('A card per customer showing name, contact details, how many bookings they have made and total spent. Useful for recognizing repeat customers.')

h1('7. Feedback')
body('Visitors can leave messages and star ratings through the floating feedback box on the website.')
bullet([
    'Unread messages are highlighted with a gold border and dot.',
    'Click a message to read the full text - opening it marks it as read.',
    'Each message shows the sender name, rating and any contact info they left.',
])

# ---- 8. Settings ----
pdf.add_page()
h1('8. Settings')
body('Settings controls everything shown on the public website:')
table([
    ['Setting', 'What it changes'],
    ['Business name / tagline', 'Site title and hero text'],
    ['Phone / secondary phone', 'Shown on Contact page, navbar and buttons'],
    ['Email / address / hours', 'Contact page and footer'],
    ['Daily rate', 'Default price shown on the homepage price tag'],
    ['Refundable deposit', 'Deposit shown to customers; used in payment totals'],
    ['Minimum age', 'Shown in FAQs and booking requirements'],
    ['Bank details', 'Bank name, account name, number and type - for transfer payments'],
    ['Hero / About images', 'Photos on the homepage and About page'],
], [55, 115])
body('Changes appear on the website immediately after you save.')

# ---- 9. Customer flow ----
h1('9. How a customer books')
numbered([
    'They browse Cars, open a vehicle and pick dates on the availability calendar.',
    'They click Book and enter their name, phone, email, pick-up location and dates.',
    'They receive a 10-character reference (like A4F9C2E1B7) - used to check their status.',
    'On Check booking they enter the reference plus their phone number.',
    'After you confirm, they choose Pay online or Pay at pick-up on that page.',
])

# ---- 10. Tips ----
h1('10. Quick tips')
bullet([
    'Always call or WhatsApp the customer before confirming - confirming tells them the booking is real.',
    'The booking reference plus phone number is how customers look up a booking - tell them to screenshot it.',
    'If a car is in the shop, use Maintenance - do not delete it.',
    'Deleting a booking removes it permanently. Prefer Cancelled for real bookings so you keep a record.',
    'Everything updates live - a customer viewing their status sees changes the moment you make them.',
])
pdf.ln(10)
pdf.set_font('helvetica', '', 9)
pdf.set_text_color(*GREY)
pdf.cell(0, 6, 'Kia & Skyler Rentals - Admin Guide', align='C')

pdf.output('Kia-Skyler-Admin-Guide.pdf')
print('done')
