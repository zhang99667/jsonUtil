import type {
  TransformReportFooterAction,
  TransformReportFooterActionInput,
} from './transformReportFooterActionTypes';

export const createFooterAction = (
  input: TransformReportFooterActionInput
): TransformReportFooterAction => {
  const { ariaLabel, ariaPrefix, ...action } = input;

  return {
    ...action,
    ariaLabel: ariaLabel ?? `${ariaPrefix ?? action.label}，${action.title}`,
  };
};
