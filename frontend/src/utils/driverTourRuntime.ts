import type { Driver } from 'driver.js';

interface DriverTourErrorHandlers {
  onDestroyError?: (error: unknown) => void;
  onDriveError?: (error: unknown) => void;
  onRefreshError?: (error: unknown) => void;
}

export interface DriverTourRun {
  isCurrent: () => boolean;
  adopt: (driver: Driver) => boolean;
  drive: () => boolean;
  driveAfter: (delayMs: number) => void;
  complete: (onComplete: () => void) => boolean;
  cancel: () => void;
}

export interface DriverTourRuntime {
  begin: (handlers?: DriverTourErrorHandlers) => DriverTourRun;
  refresh: () => void;
  dispose: () => void;
}

interface DriverTourRunState {
  driver: Driver | null;
  handlers: DriverTourErrorHandlers;
  timer: ReturnType<typeof setTimeout> | null;
}

const notifyError = (
  handler: ((error: unknown) => void) | undefined,
  error: unknown,
) => {
  try {
    handler?.(error);
  } catch {
    // 错误处理器不得覆盖驱动器的原始异常。
  }
};

export const createDriverTourRuntime = (): DriverTourRuntime => {
  let currentState: DriverTourRunState | null = null;

  const clearRunTimer = (state: DriverTourRunState) => {
    if (state.timer === null) return;
    clearTimeout(state.timer);
    state.timer = null;
  };

  const destroyDriver = (state: DriverTourRunState, driver: Driver | null) => {
    if (!driver) return;
    try {
      driver.destroy();
    } catch (error) {
      notifyError(state.handlers.onDestroyError, error);
    }
  };

  const releaseDriver = (state: DriverTourRunState) => {
    const driver = state.driver;
    state.driver = null;
    destroyDriver(state, driver);
  };

  const cancelState = (state: DriverTourRunState) => {
    if (currentState !== state) return;
    currentState = null;
    clearRunTimer(state);
    releaseDriver(state);
  };

  const begin = (handlers: DriverTourErrorHandlers = {}): DriverTourRun => {
    if (currentState) cancelState(currentState);
    const state: DriverTourRunState = {
      driver: null,
      handlers,
      timer: null,
    };
    currentState = state;

    const isCurrent = () => currentState === state;

    const run: DriverTourRun = {
      isCurrent,
      adopt: driver => {
        if (!isCurrent()) {
          destroyDriver(state, driver);
          return false;
        }
        const previousDriver = state.driver;
        state.driver = driver;
        if (previousDriver !== driver) destroyDriver(state, previousDriver);
        return true;
      },
      drive: () => {
        clearRunTimer(state);
        if (!isCurrent() || !state.driver) return false;
        const driver = state.driver;
        try {
          driver.drive();
          return true;
        } catch (error) {
          cancelState(state);
          notifyError(state.handlers.onDriveError, error);
          return false;
        }
      },
      driveAfter: delayMs => {
        clearRunTimer(state);
        if (!isCurrent()) return;
        state.timer = setTimeout(() => {
          state.timer = null;
          run.drive();
        }, delayMs);
      },
      complete: onComplete => {
        if (!isCurrent()) return false;
        currentState = null;
        clearRunTimer(state);
        const driver = state.driver;
        state.driver = null;
        try {
          onComplete();
        } finally {
          destroyDriver(state, driver);
        }
        return true;
      },
      cancel: () => cancelState(state),
    };
    return run;
  };

  return {
    begin,
    refresh: () => {
      const state = currentState;
      const driver = state?.driver;
      if (!state || !driver) return;
      try {
        driver.refresh();
      } catch (error) {
        notifyError(state.handlers.onRefreshError, error);
      }
    },
    dispose: () => {
      if (currentState) cancelState(currentState);
    },
  };
};

export const driverTourRuntime = createDriverTourRuntime();
