import { statusTone } from '../../utils/format'

export default function Badge({ status, tone, children }) {
  const resolved = tone || statusTone(status)
  return <span className={`badge badge-${resolved}`}>{children ?? status}</span>
}
