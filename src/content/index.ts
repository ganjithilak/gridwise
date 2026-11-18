import type { Course, Lesson, Unit } from '@/lessons/types';

import { excelCourse } from './excel/course';

/** Every course in the app. A second course (documents, slides) is added here. */
export const courses: readonly Course[] = [excelCourse];

export const defaultCourse = excelCourse;

export function findLesson(lessonId: string): { course: Course; unit: Unit; lesson: Lesson } | null {
  for (const course of courses) {
    for (const unit of course.units) {
      const lesson = unit.lessons.find((l) => l.id === lessonId);
      if (lesson) return { course, unit, lesson };
    }
  }
  return null;
}

export function skillName(skillId: string): string {
  for (const course of courses) {
    const skill = course.skills.find((s) => s.id === skillId);
    if (skill) return skill.name;
  }
  return skillId;
}
