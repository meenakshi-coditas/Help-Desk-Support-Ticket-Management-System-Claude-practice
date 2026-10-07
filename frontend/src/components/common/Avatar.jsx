import { initials } from '../../utils/format';

export default function Avatar({ name, size = 32 }) {
  return <span className="avatar" style={{ width: size, height: size }} aria-hidden="true">{initials(name)}</span>;
}
