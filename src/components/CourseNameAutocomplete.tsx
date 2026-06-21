import { useEffect, useMemo, useRef, useState } from 'react';
import type { SavedCourse } from '../types';
import { normalizeCourseKey } from '../utils/savedCourses';

interface CourseNameAutocompleteProps {
  value: string;
  courses: SavedCourse[];
  onChange: (value: string) => void;
  onSelectCourse: (course: SavedCourse) => void;
}

export default function CourseNameAutocomplete({
  value,
  courses,
  onChange,
  onSelectCourse,
}: CourseNameAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCourses = useMemo(() => {
    const query = value.trim().toLowerCase();
    const sorted = [...courses].sort((a, b) => a.courseName.localeCompare(b.courseName));
    if (!query) return sorted;
    return sorted.filter((course) => course.courseName.toLowerCase().includes(query));
  }, [courses, value]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [value, filteredCourses.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCourse = (course: SavedCourse) => {
    onSelectCourse(course);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }

    if (!open || filteredCourses.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % filteredCourses.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + filteredCourses.length) % filteredCourses.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectCourse(filteredCourses[highlightIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const exactMatch = courses.find((course) => normalizeCourseKey(course.courseName) === normalizeCourseKey(value));

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="e.g.Pinegrove Golf Club"
        className="input-field"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
      />

      {open && filteredCourses.length > 0 && (
        <ul
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto overscroll-contain rounded-xl border border-sand bg-white py-1 shadow-lg [-webkit-overflow-scrolling:touch]"
          role="listbox"
        >
          {filteredCourses.map((course, index) => (
            <li key={course.id} role="option" aria-selected={index === highlightIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCourse(course)}
                className={`flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-sm transition active:bg-fairway-100 ${
                  index === highlightIndex ? 'bg-fairway-50 text-fairway-800' : 'text-fairway-700'
                }`}
              >
                <span className="font-medium">{course.courseName}</span>
                <span className="text-xs text-fairway-400">
                  Par {course.holes.reduce((sum, hole) => sum + hole.par, 0)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {exactMatch && (
        <p className="mt-1.5 text-xs text-fairway-500">
          Saved course profile available — select from the list to load setup.
        </p>
      )}
    </div>
  );
}
