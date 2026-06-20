import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RoundRedirect from './components/RoundRedirect';
import Dashboard from './pages/Dashboard';
import NewRound from './pages/NewRound';
import HoleEntry from './pages/HoleEntry';
import RoundSummary from './pages/RoundSummary';
import MentalPerformance from './pages/MentalPerformance';
import CoachReflection from './pages/CoachReflection';
import Statistics from './pages/Statistics';
import RecruitingReport from './pages/RecruitingReport';
import RoundsHistory from './pages/RoundsHistory';
import EditRound from './pages/EditRound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="round" element={<RoundRedirect />} />
        <Route path="new-round" element={<NewRound />} />
        <Route path="hole-entry" element={<HoleEntry />} />
        <Route path="round-summary/:id" element={<RoundSummary />} />
        <Route path="mental" element={<MentalPerformance />} />
        <Route path="coach" element={<CoachReflection />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="recruiting" element={<RecruitingReport />} />
        <Route path="rounds" element={<RoundsHistory />} />
        <Route path="edit-round/:id" element={<EditRound />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
