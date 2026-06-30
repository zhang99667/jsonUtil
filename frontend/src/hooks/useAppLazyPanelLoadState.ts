import { useEffect, useState } from 'react';
import {
  createAppLazyPanelLoadState,
  updateAppLazyPanelLoadState,
  type AppLazyPanelLoadState,
} from '../utils/appLazyPanelLoadState';

export const useAppLazyPanelLoadState = (openState: AppLazyPanelLoadState): AppLazyPanelLoadState => {
  const [loadedState, setLoadedState] = useState(createAppLazyPanelLoadState);

  useEffect(() => {
    setLoadedState(current => updateAppLazyPanelLoadState(current, openState));
  }, [
    openState.changelog,
    openState.jsonCompare,
    openState.jsonPath,
    openState.jsonSchema,
    openState.jsonTree,
    openState.scheme,
    openState.settings,
    openState.template,
    openState.transformReport,
  ]);

  return loadedState;
};
