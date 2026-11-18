import { BadgeCheck, CarFront, Clock, ShieldCheck, Sparkles, UserRound } from 'lucide-react'

const map = { BadgeCheck, CarFront, Clock, ShieldCheck, Sparkles, UserRound }

export default function FeatureIcon({ name, size = 22 }) {
  const Icon = map[name] || Sparkles
  return <Icon size={size} />
}
