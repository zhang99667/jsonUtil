import { TransformMode, type TransformContext } from '../types';
import {
  inverseWithContext,
  performInverseTransform,
} from './transformations';

export interface AppPreviewOutputSourceInput {
  previewText: string;
  mode: TransformMode;
  originalInput: string;
  context: TransformContext | null;
}

export const shouldValidatePreviewOutputBeforeSync = (mode: TransformMode): boolean => (
  mode === TransformMode.FORMAT ||
  mode === TransformMode.DEEP_FORMAT ||
  mode === TransformMode.MINIFY
);

export const resolveAppPreviewOutputSource = ({
  previewText,
  mode,
  originalInput,
  context,
}: AppPreviewOutputSourceInput): string => {
  if (mode === TransformMode.DEEP_FORMAT && context) {
    return inverseWithContext(previewText, context);
  }

  return performInverseTransform(previewText, mode, originalInput);
};
