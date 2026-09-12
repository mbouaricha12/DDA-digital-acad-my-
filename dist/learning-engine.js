/* DDA Learning Engine — reusable, curriculum-agnostic. Consumes {curriculum, state}; never hardcodes a module/lesson id. */
(function () {
  'use strict';

  const STATUS = Object.freeze({ LOCKED: 'locked', AVAILABLE: 'available', IN_PROGRESS: 'in_progress', COMPLETED: 'completed' });
  const MODULE_STATUS = Object.freeze({ COMING_SOON: 'coming_soon', LOCKED: 'locked', AVAILABLE: 'available', IN_PROGRESS: 'in_progress', COMPLETED: 'completed' });
  const STEP_STATUS = Object.freeze({ LOCKED: 'locked', PENDING: 'pending', COMPLETED: 'completed' });

  function getLessonProgress(state, lessonId) {
    return (state && state.lessons && state.lessons[lessonId]) || { lessonViewed: false, exerciseComplete: false, quizComplete: false };
  }

  function findLesson(curriculum, lessonId) {
    for (const module of curriculum.modules) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson) return { module, lesson };
    }
    return null;
  }

  function lessonStatus(lessonProgress) {
    if (lessonProgress.quizComplete) return STATUS.COMPLETED;
    if (lessonProgress.exerciseComplete || lessonProgress.lessonViewed) return STATUS.IN_PROGRESS;
    return STATUS.AVAILABLE;
  }

  // Locks a lesson behind the previous lesson of the same module, when there is one.
  function lessonStatusInModule(module, lessonId, state) {
    const index = module.lessons.findIndex(l => l.id === lessonId);
    if (index === -1) return null;
    const prevLesson = module.lessons[index - 1];
    if (prevLesson && lessonStatus(getLessonProgress(state, prevLesson.id)) !== STATUS.COMPLETED) return STATUS.LOCKED;
    return lessonStatus(getLessonProgress(state, module.lessons[index].id));
  }

  function exerciseStatus(lessonProgress) {
    return lessonProgress.exerciseComplete ? STEP_STATUS.COMPLETED : STEP_STATUS.PENDING;
  }

  function evaluationStatus(lessonProgress) {
    if (lessonProgress.quizComplete) return STEP_STATUS.COMPLETED;
    return lessonProgress.exerciseComplete ? STEP_STATUS.PENDING : STEP_STATUS.LOCKED;
  }

  function lessonNextStep(lessonProgress) {
    if (!lessonProgress.lessonViewed) return 'lesson';
    if (!lessonProgress.exerciseComplete) return 'exercise';
    if (!lessonProgress.quizComplete) return 'quiz';
    return 'review';
  }

  function lessonProgressPercent(lessonProgress) {
    if (lessonProgress.quizComplete) return 100;
    if (lessonProgress.exerciseComplete) return 55;
    if (lessonProgress.lessonViewed) return 25;
    return 18;
  }

  function lessonXp(lesson, lessonProgress) {
    if (!lesson || !lesson.xp) return 0;
    if (lessonProgress.quizComplete) return lesson.xp.quizComplete || 0;
    if (lessonProgress.exerciseComplete) return lesson.xp.exerciseComplete || 0;
    if (lessonProgress.lessonViewed) return lesson.xp.lessonViewed || 0;
    return 0;
  }

  function totalXp(curriculum, state) {
    return Object.keys((state && state.lessons) || {}).reduce((sum, lessonId) => {
      const found = findLesson(curriculum, lessonId);
      return found ? sum + lessonXp(found.lesson, state.lessons[lessonId]) : sum;
    }, 0);
  }

  // A module with no authored lessons is "coming_soon", never "locked" — it isn't gated, it isn't written yet.
  function moduleStatus(curriculum, moduleId, state) {
    const modules = curriculum.modules;
    const index = modules.findIndex(m => m.id === moduleId);
    if (index === -1) return null;
    const module = modules[index];
    if (!module.lessons || module.lessons.length === 0) return MODULE_STATUS.COMING_SOON;

    let prevAuthored = null;
    for (let i = index - 1; i >= 0; i--) {
      if (modules[i].lessons && modules[i].lessons.length > 0) { prevAuthored = modules[i]; break; }
    }
    if (prevAuthored && moduleStatus(curriculum, prevAuthored.id, state) !== MODULE_STATUS.COMPLETED) return MODULE_STATUS.LOCKED;

    const statuses = module.lessons.map(lesson => lessonStatus(getLessonProgress(state, lesson.id)));
    if (statuses.every(s => s === STATUS.COMPLETED)) return MODULE_STATUS.COMPLETED;
    if (statuses.some(s => s === STATUS.IN_PROGRESS || s === STATUS.COMPLETED)) return MODULE_STATUS.IN_PROGRESS;
    return MODULE_STATUS.AVAILABLE;
  }

  function moduleProgressPercent(curriculum, moduleId, state) {
    const module = curriculum.modules.find(m => m.id === moduleId);
    if (!module || !module.lessons.length) return 0;
    const sum = module.lessons.reduce((acc, lesson) => acc + lessonProgressPercent(getLessonProgress(state, lesson.id)), 0);
    return Math.round(sum / module.lessons.length);
  }

  function moduleSnapshot(curriculum, moduleId, state) {
    const module = curriculum.modules.find(m => m.id === moduleId);
    if (!module) return null;
    return {
      id: module.id,
      title: module.title,
      summary: module.summary || '',
      status: moduleStatus(curriculum, moduleId, state),
      progressPercent: moduleProgressPercent(curriculum, moduleId, state),
      lessons: module.lessons.map(lesson => ({ id: lesson.id, title: lesson.title, status: lessonStatusInModule(module, lesson.id, state) }))
    };
  }

  // Walks the curriculum in order and returns the first not-yet-completed lesson in an unlocked, authored module.
  function nextActionable(curriculum, state) {
    for (const module of curriculum.modules) {
      const status = moduleStatus(curriculum, module.id, state);
      if (status === MODULE_STATUS.COMING_SOON || status === MODULE_STATUS.LOCKED) continue;
      for (const lesson of module.lessons) {
        const lessonProgress = getLessonProgress(state, lesson.id);
        if (lessonStatus(lessonProgress) !== STATUS.COMPLETED) {
          return { module, lesson, moduleId: module.id, lessonId: lesson.id, step: lessonNextStep(lessonProgress) };
        }
      }
    }
    return null;
  }

  window.DDALearning = Object.freeze({
    STATUS,
    MODULE_STATUS,
    STEP_STATUS,
    getLessonProgress,
    findLesson,
    lessonStatus,
    lessonStatusInModule,
    exerciseStatus,
    evaluationStatus,
    lessonNextStep,
    lessonProgressPercent,
    lessonXp,
    totalXp,
    moduleStatus,
    moduleProgressPercent,
    moduleSnapshot,
    nextActionable
  });
})();
