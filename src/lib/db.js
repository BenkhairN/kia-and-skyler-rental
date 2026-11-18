import { supabase } from './supabase'

const PHOTO_BUCKET = 'vehicle-photos'

export const carFromRow = (r) => ({
  id: r.id,
  name: r.name,
  year: r.year,
  category: r.category,
  color: r.color,
  plate: r.plate,
  seats: r.seats,
  transmission: r.transmission,
  fuel: r.fuel,
  dailyRate: Number(r.daily_rate),
  status: r.status,
  image: r.image,
  gallery: r.gallery || [],
  description: r.description,
  features: r.features || [],
})

export const carToRow = (c) => ({
  name: c.name,
  year: Number(c.year),
  category: c.category,
  color: c.color || '',
  plate: c.plate,
  seats: Number(c.seats),
  transmission: c.transmission,
  fuel: c.fuel,
  daily_rate: Number(c.dailyRate),
  status: c.status,
  image: c.image || '',
  gallery: c.gallery || [],
  description: c.description || '',
  features: c.features || [],
})

export const bookingFromRow = (r) => ({
  id: r.reference,
  dbId: r.id,
  carId: r.car_id,
  customerName: r.customer_name,
  customerPhone: r.customer_phone,
  customerEmail: r.customer_email,
  pickupLocation: r.pickup_location,
  pickupDate: r.pickup_date,
  returnDate: r.return_date,
  dailyRate: Number(r.daily_rate),
  deposit: Number(r.deposit),
  total: Number(r.total),
  status: r.status,
  paid: Boolean(r.paid),
  notes: r.notes,
  createdAt: r.created_at,
})

export const bookingToRow = (b) => ({
  car_id: b.carId,
  customer_name: b.customerName,
  customer_phone: b.customerPhone,
  customer_email: b.customerEmail || '',
  pickup_location: b.pickupLocation || '',
  pickup_date: b.pickupDate,
  return_date: b.returnDate,
  daily_rate: Number(b.dailyRate),
  deposit: Number(b.deposit ?? 0),
  total: Number(b.total),
  status: b.status || 'pending',
  notes: b.notes || '',
})

export const feedbackFromRow = (r) => ({
  id: r.id,
  kind: 'feedback',
  name: r.name,
  message: r.message,
  rating: r.rating,
  read: r.read,
  createdAt: r.created_at,
})

const dataUrlToBlob = (dataUrl) => {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/data:(.*?);/)?.[1] || 'image/jpeg'
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export const uploadPhoto = async (dataUrl, folder = 'cars') => {
  const blob = dataUrlToBlob(dataUrl)
  const ext = EXT[blob.type] || 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type })
  if (error) throw new Error(error.message)
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}

export const resolvePhotos = async (photos, folder) => {
  const out = []
  for (const src of photos) {
    out.push(src.startsWith('data:') ? await uploadPhoto(src, folder) : src)
  }
  return out
}
