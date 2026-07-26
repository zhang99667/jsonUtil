import { setLegacyJsonPathValue } from './appLegacyJsonPath';
import { parseJsonValue } from './jsonValueGuards';
import { setJsonPointerValue } from './jsonPointer';

interface ApplySchemeEditToPreviewTextInput {
  previewText: string;
  jsonPath: string;
  newValue: string;
  pointer?: string;
}

export const applySchemeEditToPreviewText = ({
  previewText,
  jsonPath,
  newValue,
  pointer,
}: ApplySchemeEditToPreviewTextInput): string => {
  const parsed = parseJsonValue(previewText);
  const updatedRoot = pointer !== undefined
    ? setJsonPointerValue(parsed, pointer, newValue)
    : setLegacyJsonPathValue(parsed, jsonPath, newValue);

  return JSON.stringify(updatedRoot, null, 2);
};
