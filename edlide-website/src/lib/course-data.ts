export interface Topic {
  id: string
  titleKey: string
  videoUrl: string
  duration?: string
  isHidden?: boolean
}

export interface Lesson {
  id: string
  titleKey: string
  descriptionKey: string
  topics: Topic[]
  isHidden?: boolean
}

export interface Module {
  id: string
  titleKey: string
  descriptionKey: string
  icon: string
  lessons: Lesson[]
  isHidden?: boolean
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
          { id: 'topic-1-1-1', titleKey: 'topic1_1_1', videoUrl: '', duration: '' },
          { id: 'topic-1-1-2', titleKey: 'topic1_1_2', videoUrl: '', duration: '' },
          { id: 'topic-1-1-3', titleKey: 'topic1_1_3', videoUrl: '', duration: '' },
          { id: 'topic-1-1-4', titleKey: 'topic1_1_4', videoUrl: '', duration: '' },
          { id: 'topic-1-1-5', titleKey: 'topic1_1_5', videoUrl: '', duration: '' },
        ],
      },
      {
        id: 'lesson-1-2',
        titleKey: 'lesson1_2Title',
        descriptionKey: 'lesson1_2Desc',
        isHidden: true,
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
        isHidden: true,
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
        isHidden: true,
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
        isHidden: true,
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
    isHidden: true,
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

export function getVisibleModules(): Module[] {
  return courses.filter((moduleData) => !moduleData.isHidden)
}

export function getVisibleLessons(moduleData: Module): Lesson[] {
  return moduleData.lessons.filter((lesson) => !lesson.isHidden)
}

export function getVisibleTopics(lesson: Lesson): Topic[] {
  return lesson.topics.filter((topic) => !topic.isHidden)
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
  const totalMinutes = getVisibleLessons(moduleData).reduce((acc, lesson) => {
    return acc + getVisibleTopics(lesson).reduce((tAcc, topic) => tAcc + getTopicDurationMinutes(topic.duration), 0)
  }, 0)

  if (totalMinutes <= 0) return ''

  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function getLessonTotalDuration(lesson: Lesson): string {
  const totalMinutes = getVisibleTopics(lesson).reduce((acc, topic) => acc + getTopicDurationMinutes(topic.duration), 0)

  if (totalMinutes <= 0) return ''

  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function getTopicDurationMinutes(duration?: string): number {
  if (!duration) return 0
  const [minutesPart, secondsPart] = duration.split(':')
  const minutes = Number.parseInt(minutesPart, 10)
  const seconds = Number.parseInt(secondsPart ?? '0', 10)

  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return 0
  return minutes + seconds / 60
}

export function getNextTopic(moduleId: string, lessonId: string, topicId: string): { moduleId: string; lessonId: string; topicId: string } | null {
  const lesson = getLesson(moduleId, lessonId)
  if (!lesson) return null
  if (lesson.isHidden) return null

  const visibleTopics = getVisibleTopics(lesson)
  const topicIdx = visibleTopics.findIndex((t) => t.id === topicId)
  if (topicIdx < visibleTopics.length - 1) {
    return { moduleId, lessonId, topicId: visibleTopics[topicIdx + 1].id }
  }

  const mod = getModule(moduleId)
  if (!mod) return null
  if (mod.isHidden) return null

  const visibleLessons = getVisibleLessons(mod)
  const lessonIdx = visibleLessons.findIndex((l) => l.id === lessonId)
  if (lessonIdx < visibleLessons.length - 1) {
    const nextLesson = visibleLessons[lessonIdx + 1]
    const nextLessonTopics = getVisibleTopics(nextLesson)
    if (!nextLessonTopics.length) return null
    return { moduleId, lessonId: nextLesson.id, topicId: nextLessonTopics[0].id }
  }

  const visibleModules = getVisibleModules()
  const moduleIdx = visibleModules.findIndex((m) => m.id === moduleId)
  if (moduleIdx < visibleModules.length - 1) {
    const nextMod = visibleModules[moduleIdx + 1]
    const nextModLessons = getVisibleLessons(nextMod)
    if (!nextModLessons.length) return null
    const firstLesson = nextModLessons[0]
    const firstLessonTopics = getVisibleTopics(firstLesson)
    if (!firstLessonTopics.length) return null
    return { moduleId: nextMod.id, lessonId: firstLesson.id, topicId: firstLessonTopics[0].id }
  }
  return null
}

export function getPrevTopic(moduleId: string, lessonId: string, topicId: string): { moduleId: string; lessonId: string; topicId: string } | null {
  const lesson = getLesson(moduleId, lessonId)
  if (!lesson) return null
  if (lesson.isHidden) return null

  const visibleTopics = getVisibleTopics(lesson)
  const topicIdx = visibleTopics.findIndex((t) => t.id === topicId)
  if (topicIdx > 0) {
    return { moduleId, lessonId, topicId: visibleTopics[topicIdx - 1].id }
  }

  const mod = getModule(moduleId)
  if (!mod) return null
  if (mod.isHidden) return null

  const visibleLessons = getVisibleLessons(mod)
  const lessonIdx = visibleLessons.findIndex((l) => l.id === lessonId)
  if (lessonIdx > 0) {
    const prevLesson = visibleLessons[lessonIdx - 1]
    const prevLessonTopics = getVisibleTopics(prevLesson)
    if (!prevLessonTopics.length) return null
    return { moduleId, lessonId: prevLesson.id, topicId: prevLessonTopics[prevLessonTopics.length - 1].id }
  }

  const visibleModules = getVisibleModules()
  const moduleIdx = visibleModules.findIndex((m) => m.id === moduleId)
  if (moduleIdx > 0) {
    const prevMod = visibleModules[moduleIdx - 1]
    const prevModLessons = getVisibleLessons(prevMod)
    if (!prevModLessons.length) return null
    const lastLesson = prevModLessons[prevModLessons.length - 1]
    const lastLessonTopics = getVisibleTopics(lastLesson)
    if (!lastLessonTopics.length) return null
    return { moduleId: prevMod.id, lessonId: lastLesson.id, topicId: lastLessonTopics[lastLessonTopics.length - 1].id }
  }
  return null
}
