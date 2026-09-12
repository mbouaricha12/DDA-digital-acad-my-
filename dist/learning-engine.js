/* DDA Learning Engine foundation — local alpha, reusable and provider-agnostic. */
(function(){
  'use strict';
  const STATUS = Object.freeze({ LOCKED:'locked', AVAILABLE:'available', IN_PROGRESS:'in_progress', COMPLETED:'completed' });
  function lessonState(progress){
    if (progress?.quizComplete) return STATUS.COMPLETED;
    if (progress?.exerciseComplete || progress?.lessonViewed) return STATUS.IN_PROGRESS;
    return STATUS.AVAILABLE;
  }
  function nextAction(progress){
    if (!progress?.lessonViewed) return 'lesson';
    if (!progress?.exerciseComplete) return 'exercise';
    if (!progress?.quizComplete) return 'quiz';
    return 'review';
  }
  function moduleSnapshot(module, progress){
    return { id:module.id, title:module.title, status:module.status || 'future', lessonStatus:lessonState(progress), nextAction:nextAction(progress), lessonCount:module.lessons?.length || 0 };
  }
  window.DDALearning = Object.freeze({ STATUS, lessonState, nextAction, moduleSnapshot });
})();
