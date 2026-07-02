// File System Access API 类型声明
// https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API

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

interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | BufferSource | Blob): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
}

interface FileSystemFileHandle {
    readonly kind: 'file';
    readonly name: string;
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
}

interface Window {
    showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
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
