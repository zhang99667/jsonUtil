import { loader } from '@monaco-editor/react';

const monacoVsPath = import.meta.env.DEV
  ? '/node_modules/monaco-editor/min/vs'
  : '/monaco/vs';

loader.config({
  paths: {
    vs: monacoVsPath,
  },
});
