import React, { useEffect, useState } from 'react';

interface StatisticsData {
    totalUsers: number;
    activeSubscriptions: number;
    totalRevenue: number;
}

interface StatisticsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ isOpen, onClose }) => {
    const [data, setData] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchStatistics();
        }
    }, [isOpen]);

    const fetchStatistics = async () => {
        setLoading(true);
        setError(null);
        try {
            // Check if we are in development environment (localhost)
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBase = isLocal ? 'http://localhost:8080' : ''; // Relative path for production if proxied, or absolute if CORS allowed

            const response = await fetch(`${apiBase}/api/stats`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.code === 200) {
                setData(result.data);
            } else {
                throw new Error(result.message || 'Failed to fetch statistics');
            }
        } catch (err: any) {
            setError(err.message || 'Error connecting to backend');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-editor-bg border border-editor-border rounded-xl shadow-2xl w-[500px] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-editor-border">
                    <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        后台统计
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {loading && (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm mb-4">
                            获取数据失败: {error}
                            <div className="mt-2 text-xs text-red-400 opacity-80">
                                请确保后端服务已启动 (localhost:8080)
                            </div>
                        </div>
                    )}

                    {!loading && data && (
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-editor-sidebar p-4 rounded-lg border border-editor-border">
                                <div className="text-sm text-gray-400 mb-1">总用户数</div>
                                <div className="text-2xl font-bold text-blue-400">{data.totalUsers.toLocaleString()}</div>
                            </div>
                            <div className="bg-editor-sidebar p-4 rounded-lg border border-editor-border">
                                <div className="text-sm text-gray-400 mb-1">活跃订阅</div>
                                <div className="text-2xl font-bold text-green-400">{data.activeSubscriptions.toLocaleString()}</div>
                            </div>
                            <div className="bg-editor-sidebar p-4 rounded-lg border border-editor-border">
                                <div className="text-sm text-gray-400 mb-1">总收入</div>
                                <div className="text-2xl font-bold text-amber-400">¥ {data.totalRevenue.toLocaleString()}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-editor-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-editor-sidebar hover:bg-editor-hover border border-editor-border rounded-lg text-sm text-gray-300 transition-colors"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};
