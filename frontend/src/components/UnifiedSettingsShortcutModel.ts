import type {
    ShortcutAction,
    ShortcutConfig,
    ShortcutKey,
} from '../types';
import {
    SHORTCUT_ACTIONS,
    areShortcutKeysEquivalent,
} from '../utils/shortcuts';

interface ShortcutRecordingInput {
    key: string;
    meta: boolean;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    repeat: boolean;
}

interface ShortcutRecordingUpdate {
    action: ShortcutAction;
    shortcut: ShortcutKey;
}

export type ShortcutRecordingResult =
    | { type: 'ignored' }
    | {
        type: 'clear';
        updates: ShortcutRecordingUpdate[];
    }
    | {
        type: 'bind';
        conflictingActions: ShortcutAction[];
        updates: ShortcutRecordingUpdate[];
    };

const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Shift', 'Alt']);

const createEmptyShortcut = (): ShortcutKey => ({
    key: '',
    meta: false,
    ctrl: false,
    shift: false,
    alt: false,
});

export const resolveShortcutRecordingInput = (
    input: ShortcutRecordingInput,
    recordingAction: ShortcutAction,
    shortcuts: ShortcutConfig,
): ShortcutRecordingResult => {
    if (input.repeat || MODIFIER_KEYS.has(input.key)) {
        return { type: 'ignored' };
    }

    if (
        input.key === 'Backspace'
        && !input.meta
        && !input.ctrl
        && !input.shift
        && !input.alt
    ) {
        const shortcut = createEmptyShortcut();
        return {
            type: 'clear',
            updates: [{ action: recordingAction, shortcut }],
        };
    }

    const shortcut: ShortcutKey = {
        key: input.key,
        meta: input.meta,
        ctrl: input.ctrl,
        shift: input.shift,
        alt: input.alt,
    };
    const conflictingActions = SHORTCUT_ACTIONS.filter(action => (
        action !== recordingAction
        && areShortcutKeysEquivalent(shortcuts[action], shortcut)
    ));

    const updates: ShortcutRecordingUpdate[] = conflictingActions.map(action => ({
        action,
        shortcut: createEmptyShortcut(),
    }));
    updates.push({ action: recordingAction, shortcut });

    return {
        type: 'bind',
        conflictingActions,
        updates,
    };
};

export const getShortcutDisplayLabels = (shortcut: ShortcutKey): string[] => {
    if (!shortcut.key) return [];

    const labels: string[] = [];
    if (shortcut.meta) labels.push('Cmd');
    if (shortcut.ctrl) labels.push('Ctrl');
    if (shortcut.alt) labels.push('Alt');
    if (shortcut.shift) labels.push('Shift');

    let keyLabel = shortcut.key;
    if (keyLabel === ' ') keyLabel = 'Space';
    if (keyLabel.length === 1) keyLabel = keyLabel.toUpperCase();
    labels.push(keyLabel);
    return labels;
};
