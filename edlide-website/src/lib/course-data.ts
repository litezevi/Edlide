export interface Topic {
  id: string
  titleKey: string
  videoUrl: string
  duration: string
}

export interface Lesson {
  id: string
  titleKey: string
  descriptionKey: string
  topics: Topic[]
}

export interface Module {
  id: string
  titleKey: string
  descriptionKey: string
  icon: string
  lessons: Lesson[]
}

export const courses: Module[] = [
  {
    id: 'module-1',
    titleKey: 'module1Title',
    descriptionKey: 'module1Desc',
    icon: 'Globe',
    lessons: [
      {
        id: 'lesson-1-1',
        titleKey: 'lesson1_1Title',
        descriptionKey: 'lesson1_1Desc',
        topics: [
          { id: 'topic-1-1-1', titleKey: 'topic1_1_1', videoUrl: '', duration: '8:00' },
          { id: 'topic-1-1-2', titleKey: 'topic1_1_2', videoUrl: '', duration: '10:00' },
          { id: 'topic-1-1-3', titleKey: 'topic1_1_3', videoUrl: '', duration: '12:00' },
          { id: 'topic-1-1-4', titleKey: 'topic1_1_4', videoUrl: '', duration: '15:00' },
          { id: 'topic-1-1-5', titleKey: 'topic1_1_5', videoUrl: '', duration: '10:00' },
          { id: 'topic-1-1-6', titleKey: 'topic1_1_6', videoUrl: '', duration: '20:00' },
        ],
      },
      {
        id: 'lesson-1-2',
        titleKey: 'lesson1_2Title',
        descriptionKey: 'lesson1_2Desc',
        topics: [
          { id: 'topic-1-2-1', titleKey: 'topic1_2_1', videoUrl: '', duration: '6:00' },
          { id: 'topic-1-2-2', titleKey: 'topic1_2_2', videoUrl: '', duration: '12:00' },
          { id: 'topic-1-2-3', titleKey: 'topic1_2_3', videoUrl: '', duration: '8:00' },
          { id: 'topic-1-2-4', titleKey: 'topic1_2_4', videoUrl: '', duration: '15:00' },
          { id: 'topic-1-2-5', titleKey: 'topic1_2_5', videoUrl: '', duration: '10:00' },
          { id: 'topic-1-2-6', titleKey: 'topic1_2_6', videoUrl: '', duration: '10:00' },
        ],
      },
      {
        id: 'lesson-1-3',
        titleKey: 'lesson1_3Title',
        descriptionKey: 'lesson1_3Desc',
        topics: [
          { id: 'topic-1-3-1', titleKey: 'topic1_3_1', videoUrl: '', duration: '12:00' },
          { id: 'topic-1-3-2', titleKey: 'topic1_3_2', videoUrl: '', duration: '8:00' },
          { id: 'topic-1-3-3', titleKey: 'topic1_3_3', videoUrl: '', duration: '10:00' },
          { id: 'topic-1-3-4', titleKey: 'topic1_3_4', videoUrl: '', duration: '10:00' },
        ],
      },
      {
        id: 'lesson-1-4',
        titleKey: 'lesson1_4Title',
        descriptionKey: 'lesson1_4Desc',
        topics: [
          { id: 'topic-1-4-1', titleKey: 'topic1_4_1', videoUrl: '', duration: '15:00' },
          { id: 'topic-1-4-2', titleKey: 'topic1_4_2', videoUrl: '', duration: '12:00' },
          { id: 'topic-1-4-3', titleKey: 'topic1_4_3', videoUrl: '', duration: '8:00' },
        ],
      },
      {
        id: 'lesson-1-5',
        titleKey: 'lesson1_5Title',
        descriptionKey: 'lesson1_5Desc',
        topics: [
          { id: 'topic-1-5-1', titleKey: 'topic1_5_1', videoUrl: '', duration: '12:00' },
          { id: 'topic-1-5-2', titleKey: 'topic1_5_2', videoUrl: '', duration: '10:00' },
        ],
      },
    ],
  },
  {
    id: 'module-2',
    titleKey: 'module2Title',
    descriptionKey: 'module2Desc',
    icon: 'Smartphone',
    lessons: [
      {
        id: 'lesson-2-1',
        titleKey: 'lesson2_1Title',
        descriptionKey: 'lesson2_1Desc',
        topics: [
          { id: 'topic-2-1-1', titleKey: 'topic2_1_1', videoUrl: '', duration: '10:00' },
          { id: 'topic-2-1-2', titleKey: 'topic2_1_2', videoUrl: '', duration: '15:00' },
        ],
      },
      {
        id: 'lesson-2-2',
        titleKey: 'lesson2_2Title',
        descriptionKey: 'lesson2_2Desc',
        topics: [
          { id: 'topic-2-2-1', titleKey: 'topic2_2_1', videoUrl: '', duration: '15:00' },
          { id: 'topic-2-2-2', titleKey: 'topic2_2_2', videoUrl: '', duration: '10:00' },
        ],
      },
      {
        id: 'lesson-2-3',
        titleKey: 'lesson2_3Title',
        descriptionKey: 'lesson2_3Desc',
        topics: [
          { id: 'topic-2-3-1', titleKey: 'topic2_3_1', videoUrl: '', duration: '10:00' },
        ],
      },
      {
        id: 'lesson-2-4',
        titleKey: 'lesson2_4Title',
        descriptionKey: 'lesson2_4Desc',
        topics: [
          { id: 'topic-2-4-1', titleKey: 'topic2_4_1', videoUrl: '', duration: '12:00' },
        ],
      },
      {
        id: 'lesson-2-5',
        titleKey: 'lesson2_5Title',
        descriptionKey: 'lesson2_5Desc',
        topics: [
          { id: 'topic-2-5-1', titleKey: 'topic2_5_1', videoUrl: '', duration: '12:00' },
          { id: 'topic-2-5-2', titleKey: 'topic2_5_2', videoUrl: '', duration: '10:00' },
        ],
      },
    ],
  },
]

export function getModule(moduleId: string): Module | undefined {
  return courses.find((m) => m.id === moduleId)
}

export function getLesson(moduleId: string, lessonId: string): Lesson | undefined {
  const mod = getModule(moduleId)
  return mod?.lessons.find((l) => l.id === lessonId)
}

export function getTopic(moduleId: string, lessonId: string, topicId: string): Topic | undefined {
  const lesson = getLesson(moduleId, lessonId)
  return lesson?.topics.find((t) => t.id === topicId)
}

export function getTopicIndex(moduleId: string, lessonId: string, topicId: string): number {
  const lesson = getLesson(moduleId, lessonId)
  if (!lesson) return -1
  return lesson.topics.findIndex((t) => t.id === topicId)
}

export function getLessonIndex(moduleId: string, lessonId: string): number {
  const mod = getModule(moduleId)
  if (!mod) return -1
  return mod.lessons.findIndex((l) => l.id === lessonId)
}

export function getModuleTotalDuration(moduleData: Module): string {
  const totalMinutes = moduleData.lessons.reduce((acc, lesson) => {
    return acc + lesson.topics.reduce((tAcc, topic) => {
      const parts = topic.duration.split(':')
      return tAcc + parseInt(parts[0]) + parseInt(parts[1]) / 60
    }, 0)
  }, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function getLessonTotalDuration(lesson: Lesson): string {
  const totalMinutes = lesson.topics.reduce((acc, topic) => {
    const parts = topic.duration.split(':')
    return acc + parseInt(parts[0]) + parseInt(parts[1]) / 60
  }, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function getNextTopic(moduleId: string, lessonId: string, topicId: string): { moduleId: string; lessonId: string; topicId: string } | null {
  const lesson = getLesson(moduleId, lessonId)
  if (!lesson) return null
  const topicIdx = lesson.topics.findIndex((t) => t.id === topicId)
  if (topicIdx < lesson.topics.length - 1) {
    return { moduleId, lessonId, topicId: lesson.topics[topicIdx + 1].id }
  }
  const mod = getModule(moduleId)
  if (!mod) return null
  const lessonIdx = mod.lessons.findIndex((l) => l.id === lessonId)
  if (lessonIdx < mod.lessons.length - 1) {
    const nextLesson = mod.lessons[lessonIdx + 1]
    return { moduleId, lessonId: nextLesson.id, topicId: nextLesson.topics[0].id }
  }
  const moduleIdx = courses.findIndex((m) => m.id === moduleId)
  if (moduleIdx < courses.length - 1) {
    const nextMod = courses[moduleIdx + 1]
    const firstLesson = nextMod.lessons[0]
    return { moduleId: nextMod.id, lessonId: firstLesson.id, topicId: firstLesson.topics[0].id }
  }
  return null
}

export function getPrevTopic(moduleId: string, lessonId: string, topicId: string): { moduleId: string; lessonId: string; topicId: string } | null {
  const lesson = getLesson(moduleId, lessonId)
  if (!lesson) return null
  const topicIdx = lesson.topics.findIndex((t) => t.id === topicId)
  if (topicIdx > 0) {
    return { moduleId, lessonId, topicId: lesson.topics[topicIdx - 1].id }
  }
  const mod = getModule(moduleId)
  if (!mod) return null
  const lessonIdx = mod.lessons.findIndex((l) => l.id === lessonId)
  if (lessonIdx > 0) {
    const prevLesson = mod.lessons[lessonIdx - 1]
    return { moduleId, lessonId: prevLesson.id, topicId: prevLesson.topics[prevLesson.topics.length - 1].id }
  }
  const moduleIdx = courses.findIndex((m) => m.id === moduleId)
  if (moduleIdx > 0) {
    const prevMod = courses[moduleIdx - 1]
    const lastLesson = prevMod.lessons[prevMod.lessons.length - 1]
    return { moduleId: prevMod.id, lessonId: lastLesson.id, topicId: lastLesson.topics[lastLesson.topics.length - 1].id }
  }
  return null
}
