import { Navigate } from 'react-router-dom';
import { getRoundNavPath } from './BottomNav';
import { useGolf } from '../context/GolfContext';

export default function RoundRedirect() {
  const { activeRound } = useGolf();
  return <Navigate to={getRoundNavPath(activeRound)} replace />;
}
