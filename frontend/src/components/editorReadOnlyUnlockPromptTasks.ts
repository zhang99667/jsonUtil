const READ_ONLY_UNLOCK_PROMPT_HIDE_DELAY_MS = 5_000;

export interface ReadOnlyUnlockPromptTasks {
  generation: number;
  positionTimer: ReturnType<typeof setTimeout> | null;
  positionFrame: number | null;
  hideTimer: ReturnType<typeof setTimeout> | null;
}

export const createReadOnlyUnlockPromptTasks = (): ReadOnlyUnlockPromptTasks => ({
  generation: 0,
  positionTimer: null,
  positionFrame: null,
  hideTimer: null,
});

export const clearReadOnlyUnlockPromptTasks = (tasks: ReadOnlyUnlockPromptTasks) => {
  tasks.generation++;
  if (tasks.positionTimer !== null) clearTimeout(tasks.positionTimer);
  if (tasks.positionFrame !== null) cancelAnimationFrame(tasks.positionFrame);
  if (tasks.hideTimer !== null) clearTimeout(tasks.hideTimer);
  tasks.positionTimer = null;
  tasks.positionFrame = null;
  tasks.hideTimer = null;
};

export const scheduleReadOnlyUnlockPrompt = (
  tasks: ReadOnlyUnlockPromptTasks,
  isEligible: () => boolean,
  onShow: () => void,
  onHide: () => void,
) => {
  clearReadOnlyUnlockPromptTasks(tasks);
  const generation = tasks.generation;

  tasks.positionTimer = setTimeout(() => {
    tasks.positionTimer = null;
    tasks.positionFrame = requestAnimationFrame(() => {
      tasks.positionFrame = null;
      if (tasks.generation !== generation || !isEligible()) return;

      onShow();
      tasks.hideTimer = setTimeout(() => {
        tasks.hideTimer = null;
        if (tasks.generation === generation) onHide();
      }, READ_ONLY_UNLOCK_PROMPT_HIDE_DELAY_MS);
    });
  });
};
