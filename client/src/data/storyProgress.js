// Given a companion's chapter array (see data/story/*.js) and the current
// save, figures out which chapter is "active" right now for both the hub
// button (label/behavior) and the story screen (which route to render).
//
// storyChapter[characterId] is the index of the next NOT-YET-DONE chapter.
// - index 0: chapter 1 hasn't been completed yet ("Continue story").
// - index > 0 and the next chapter's affection threshold is met: a new
//   scripted chapter is ready ("💌 New moment").
// - otherwise: nothing new yet, so replay the most recently completed
//   chapter ("Replay story") rather than showing nothing.
export function activeChapterInfo(chapters, save, characterId) {
  const chapterIndex = save.storyChapter[characterId] || 0
  const affection = save.affection[characterId] || 0
  const allDone = chapterIndex >= chapters.length
  const nextChapter = !allDone ? chapters[chapterIndex] : null
  const newChapterReady = chapterIndex > 0 && !!nextChapter && affection >= nextChapter.unlockAffection

  if (chapterIndex === 0) {
    return { chapter: chapters[0], index: 0, mode: 'first' }
  }
  if (newChapterReady) {
    return { chapter: nextChapter, index: chapterIndex, mode: 'new' }
  }
  const replayIndex = Math.min(chapterIndex, chapters.length) - 1
  return { chapter: chapters[replayIndex], index: replayIndex, mode: 'replay' }
}
