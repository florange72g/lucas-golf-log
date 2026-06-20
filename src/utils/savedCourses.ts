import type { HoleEntry, Round, SavedCourse, SavedCourseHole } from '../types';
import { createEmptyHole, normalizeHole } from '../types';

const SAVED_COURSES_KEY = 'golf-log-saved-courses';

export function normalizeCourseKey(name: string): string {
  return name.trim().toLowerCase();
}

function normalizeSavedCourseHole(raw: Partial<SavedCourseHole>): SavedCourseHole {
  return {
    holeNumber: raw.holeNumber ?? 1,
    par: Math.min(5, Math.max(3, Math.round(raw.par ?? 4))),
    yardage: Math.min(700, Math.max(0, Math.round(raw.yardage ?? 0))),
  };
}

function normalizeSavedCourse(raw: Partial<SavedCourse>): SavedCourse {
  const now = new Date().toISOString();
  return {
    id: raw.id ?? crypto.randomUUID(),
    courseName: raw.courseName?.trim() ?? '',
    location: raw.location ?? '',
    totalHoles: raw.totalHoles ?? raw.holes?.length ?? 18,
    holes: (raw.holes ?? []).map(normalizeSavedCourseHole),
    courseHandicap: raw.courseHandicap ?? '',
    slopeRating: raw.slopeRating ?? '',
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

export function loadSavedCourses(): SavedCourse[] {
  try {
    const raw = localStorage.getItem(SAVED_COURSES_KEY);
    return raw
      ? (JSON.parse(raw) as Partial<SavedCourse>[])
          .map(normalizeSavedCourse)
          .filter((course) => course.courseName.trim() !== '')
      : [];
  } catch {
    return [];
  }
}

export function saveSavedCourses(courses: SavedCourse[]): void {
  localStorage.setItem(SAVED_COURSES_KEY, JSON.stringify(courses));
}

export function findSavedCourseByName(courses: SavedCourse[], name: string): SavedCourse | undefined {
  const key = normalizeCourseKey(name);
  return courses.find((course) => normalizeCourseKey(course.courseName) === key);
}

export function savedCourseFromRound(round: Round): SavedCourse | null {
  if (!round.courseName.trim()) return null;

  const now = new Date().toISOString();
  return normalizeSavedCourse({
    courseName: round.courseName.trim(),
    totalHoles: round.holes.length,
    holes: round.holes.map((hole) => ({
      holeNumber: hole.hole,
      par: typeof hole.par === 'number' ? hole.par : 4,
      yardage: hole.yards,
    })),
    courseHandicap: round.courseHandicap,
    slopeRating: round.slopeRating,
    location: round.location,
    createdAt: now,
    updatedAt: now,
  });
}

export function seedSavedCoursesFromRounds(rounds: Round[], courses: SavedCourse[]): SavedCourse[] {
  let next = [...courses];

  for (const round of rounds) {
    if (!round.courseName.trim()) continue;
    const key = normalizeCourseKey(round.courseName);
    if (next.some((course) => normalizeCourseKey(course.courseName) === key)) continue;

    const fromRound = savedCourseFromRound(round);
    if (fromRound) next.push(fromRound);
  }

  return next.sort((a, b) => a.courseName.localeCompare(b.courseName));
}

export function upsertSavedCourse(courses: SavedCourse[], round: Round): SavedCourse[] {
  const nextCourse = savedCourseFromRound(round);
  if (!nextCourse) return courses;

  const key = normalizeCourseKey(nextCourse.courseName);
  const existingIndex = courses.findIndex((course) => normalizeCourseKey(course.courseName) === key);

  if (existingIndex >= 0) {
    const existing = courses[existingIndex];
    const updated = normalizeSavedCourse({
      ...existing,
      courseName: nextCourse.courseName,
      totalHoles: nextCourse.totalHoles,
      holes: nextCourse.holes,
      courseHandicap: nextCourse.courseHandicap,
      slopeRating: nextCourse.slopeRating,
      location: nextCourse.location,
      updatedAt: new Date().toISOString(),
    });
    const next = [...courses];
    next[existingIndex] = updated;
    return next.sort((a, b) => a.courseName.localeCompare(b.courseName));
  }

  return [...courses, nextCourse].sort((a, b) => a.courseName.localeCompare(b.courseName));
}

function mergeHoleWithSavedLayout(hole: HoleEntry, saved?: SavedCourseHole): HoleEntry {
  if (!saved) return hole;

  const par = saved.par;
  return normalizeHole({
    ...hole,
    par,
    yards: saved.yardage,
    score: Math.min(10, Math.max(1, par)),
    ...(par === 3
      ? { fairway: 'N/A' as const }
      : hole.fairway === 'N/A'
        ? { fairway: '' as const }
        : {}),
  });
}

export function applySavedCourseToRound(round: Round, course: SavedCourse): Round {
  const savedByNumber = new Map(course.holes.map((hole) => [hole.holeNumber, hole]));

  const holes = round.holes.map((hole, index) => {
    const saved = savedByNumber.get(hole.hole) ?? course.holes[index];
    return mergeHoleWithSavedLayout(hole, saved);
  });

  while (holes.length < course.totalHoles) {
    const index = holes.length;
    const saved = course.holes[index];
    holes.push(
      mergeHoleWithSavedLayout(
        createEmptyHole(index),
        saved ?? { holeNumber: index + 1, par: 4, yardage: 0 },
      ),
    );
  }

  return {
    ...round,
    courseName: course.courseName,
    location: course.location,
    courseHandicap: course.courseHandicap,
    slopeRating: course.slopeRating,
    holes: holes.slice(0, course.totalHoles),
  };
}
