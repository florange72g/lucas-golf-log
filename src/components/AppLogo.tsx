import { Link } from 'react-router-dom';

export default function AppLogo() {
  return (
    <Link to="/" className="logo-wrapper" aria-label="Lucas Golf Log home">
      <img src="/golf-logo.png" alt="" className="app-logo" />
      <span className="logo-text">Lucas Golf Log</span>
    </Link>
  );
}
