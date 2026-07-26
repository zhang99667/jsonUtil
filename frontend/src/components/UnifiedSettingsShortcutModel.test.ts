import { describe, expect, it } from 'vitest';
import type { ShortcutKey } from '../types';
import {
    DEFAULT_SHORTCUTS,
    areShortcutKeysEquivalent,
} from '../utils/shortcuts';
import {
    getShortcutDisplayLabels,
    resolveShortcutRecordingInput,
} from './UnifiedSettingsShortcutModel';

const EMPTY_SHORTCUT: ShortcutKey = {
    key: '',
    meta: false,
    ctrl: false,
    shift: false,
    alt: false,
};

const buildInput = (
    key: string,
    patch: Partial<{
        meta: boolean;
        ctrl: boolean;
        shift: boolean;
        alt: boolean;
        repeat: boolean;
    }> = {},
) => ({
    key,
    meta: false,
    ctrl: false,
    shift: false,
    alt: false,
    repeat: false,
    ...patch,
});

describe('UnifiedSettingsShortcutModel', () => {
    it('忽略重复按键和单独修饰键', () => {
        const repeatedResult = resolveShortcutRecordingInput(
            buildInput('s', { meta: true, repeat: true }),
            'SAVE',
            DEFAULT_SHORTCUTS,
        );
        expect(repeatedResult).toEqual({ type: 'ignored' });
        expect(repeatedResult).not.toHaveProperty('updates');

        for (const key of ['Meta', 'Control', 'Shift', 'Alt']) {
            expect(resolveShortcutRecordingInput(
                buildInput(key),
                'SAVE',
                DEFAULT_SHORTCUTS,
            )).toEqual({ type: 'ignored' });
        }
    });

    it('无修饰退格清除快捷键，带修饰退格正常绑定', () => {
        expect(resolveShortcutRecordingInput(
            buildInput('Backspace'),
            'SAVE',
            DEFAULT_SHORTCUTS,
        )).toEqual({
            type: 'clear',
            updates: [{
                action: 'SAVE',
                shortcut: EMPTY_SHORTCUT,
            }],
        });

        const modifiedBackspace: ShortcutKey = {
            key: 'Backspace',
            meta: false,
            ctrl: true,
            shift: false,
            alt: false,
        };
        expect(resolveShortcutRecordingInput(
            buildInput('Backspace', { ctrl: true }),
            'SAVE',
            DEFAULT_SHORTCUTS,
        )).toEqual({
            type: 'bind',
            conflictingActions: [],
            updates: [{
                action: 'SAVE',
                shortcut: modifiedBackspace,
            }],
        });
    });

    it('使用共享等价语义查找大小写冲突并排除当前动作', () => {
        const uppercaseSave: ShortcutKey = {
            ...DEFAULT_SHORTCUTS.SAVE,
            key: 'S',
        };
        expect(areShortcutKeysEquivalent(
            uppercaseSave,
            DEFAULT_SHORTCUTS.SAVE,
        )).toBe(true);

        const conflictResult = resolveShortcutRecordingInput(
            buildInput('S', { meta: true }),
            'FORMAT',
            DEFAULT_SHORTCUTS,
        );
        expect(conflictResult).toMatchObject({
            type: 'bind',
            conflictingActions: ['SAVE'],
        });
        expect(conflictResult.type === 'bind' ? conflictResult.updates : []).toEqual([
            {
                action: 'SAVE',
                shortcut: EMPTY_SHORTCUT,
            },
            {
                action: 'FORMAT',
                shortcut: {
                    key: 'S',
                    meta: true,
                    ctrl: false,
                    shift: false,
                    alt: false,
                },
            },
        ]);
        expect(resolveShortcutRecordingInput(
            buildInput('S', { meta: true }),
            'SAVE',
            DEFAULT_SHORTCUTS,
        )).toMatchObject({
            type: 'bind',
            conflictingActions: [],
        });
    });

    it('按动作顺序清除全部历史冲突后再绑定当前动作', () => {
        const sharedShortcut = {
            ...DEFAULT_SHORTCUTS.SAVE,
            key: 'S',
        };
        const result = resolveShortcutRecordingInput(
            buildInput('s', { meta: true }),
            'MINIFY',
            {
                ...DEFAULT_SHORTCUTS,
                SAVE: sharedShortcut,
                FORMAT: sharedShortcut,
            },
        );

        expect(result).toEqual({
            type: 'bind',
            conflictingActions: ['SAVE', 'FORMAT'],
            updates: [
                { action: 'SAVE', shortcut: EMPTY_SHORTCUT },
                { action: 'FORMAT', shortcut: EMPTY_SHORTCUT },
                { action: 'MINIFY', shortcut: DEFAULT_SHORTCUTS.SAVE },
            ],
        });
    });

    it('修饰键不同的同名按键不冲突', () => {
        expect(resolveShortcutRecordingInput(
            buildInput('s', { ctrl: true }),
            'FORMAT',
            DEFAULT_SHORTCUTS,
        )).toMatchObject({
            type: 'bind',
            conflictingActions: [],
        });
    });

    it('快捷键展示标签保留顺序并格式化特殊按键', () => {
        expect(getShortcutDisplayLabels({
            ...EMPTY_SHORTCUT,
        })).toEqual([]);
        expect(getShortcutDisplayLabels({
            key: ' ',
            meta: true,
            ctrl: true,
            shift: true,
            alt: true,
        })).toEqual(['Cmd', 'Ctrl', 'Alt', 'Shift', 'Space']);
        expect(getShortcutDisplayLabels({
            key: 'a',
            meta: false,
            ctrl: false,
            shift: false,
            alt: false,
        })).toEqual(['A']);
    });
});
