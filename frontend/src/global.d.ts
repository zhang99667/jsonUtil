// 补齐浏览器尚未统一提供的文件系统访问类型。

interface FilePickerAcceptType {
    description?: string;
    accept: Record<string, string[]>;
}

interface FilePickerOptions {
    types?: FilePickerAcceptType[];
    excludeAcceptAllOption?: boolean;
    multiple?: boolean;
}

interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: FilePickerAcceptType[];
    excludeAcceptAllOption?: boolean;
}

interface Window {
    showOpenFilePicker?(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
    dataLayer: unknown[][];
    gtag: (...args: unknown[]) => void;
}

interface ImportMetaEnv {
    readonly DEV?: boolean;
    readonly PROD?: boolean;
    readonly VITE_APP_VERSION?: string;
    readonly VITE_APP_CHANGELOG?: string;
    readonly VITE_GA_MEASUREMENT_ID?: string;
    readonly VITE_TOOL_EVENT_TELEMETRY_ENABLED?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.css';
