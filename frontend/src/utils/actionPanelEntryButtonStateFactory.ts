import type {
  ActionPanelEntryButtonBadge,
  ActionPanelEntryButtonState,
  ActionPanelEntryIconState,
} from './actionPanelEntryButtonTypes';

interface ActionPanelEntryButtonStateFactoryInput {
  isActive: boolean;
  ariaLabel?: string;
  title?: string;
  badge?: ActionPanelEntryButtonBadge;
  iconState: ActionPanelEntryIconState;
}

export const createActionPanelEntryButtonState = ({
  isActive,
  ariaLabel,
  title,
  badge,
  iconState,
}: ActionPanelEntryButtonStateFactoryInput): ActionPanelEntryButtonState => ({
  entryProps: {
    isActive,
    ariaLabel,
    title,
    badge,
  },
  iconState,
});
