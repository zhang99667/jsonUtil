import request from './request';

export interface TrafficOverview {
    totalPv: number;
    totalUv: number;
    todayPv: number;
    todayUv: number;
    avgDailyPv: number;
    avgDailyUv: number;
    days: number;
}

export interface TrendItem {
    date: string;
    pv: number;
    uv: number;
}

export interface TopIpItem {
    ip: string;
    count: number;
    region: string;
}

export interface TopPathItem {
    path: string;
    count: number;
}

export interface HourlyItem {
    hour: number;
    count: number;
}

export interface GeoStatsItem {
    region: string;
    count: number;
    percentage: number;
}

export interface DeviceStatsItem {
    device: string | null;
    browser: string | null;
    count: number;
    percentage: number;
}

export interface RefererStatsItem {
    source: string;
    domain: string | null;
    count: number;
    percentage: number;
}

export interface SessionStatsItem {
    durationRange: string;
    count: number;
    percentage: number;
}

export interface ToolEventGroupItem {
    label: string;
    count: number;
    percentage: number;
}

export interface ToolEventStats {
    totalEvents: number;
    successEvents: number;
    failedEvents: number;
    failureRate: number;
    topEvents: ToolEventGroupItem[];
    statusDistribution: ToolEventGroupItem[];
    inputSizeDistribution: ToolEventGroupItem[];
    durationDistribution: ToolEventGroupItem[];
}

interface TrafficQueryParams {
    days: number;
    limit?: number;
}

const getTrafficData = async <T>(path: string, params: TrafficQueryParams): Promise<T> =>
    request.get<unknown, T>(path, { params });

export const getTrafficOverview = (days: number) =>
    getTrafficData<TrafficOverview>('/admin/traffic/overview', { days });

export const getTrafficTrend = (days: number) =>
    getTrafficData<TrendItem[]>('/admin/traffic/trend', { days });

export const getTopIps = (days: number, limit: number) =>
    getTrafficData<TopIpItem[]>('/admin/traffic/top-ips', { days, limit });

export const getTopPaths = (days: number, limit: number) =>
    getTrafficData<TopPathItem[]>('/admin/traffic/top-paths', { days, limit });

export const getHourlyStats = (days: number) =>
    getTrafficData<HourlyItem[]>('/admin/traffic/hourly', { days });

export const getGeoDistribution = (days: number, limit = 15) =>
    getTrafficData<GeoStatsItem[]>('/admin/traffic/geo-distribution', { days, limit });

export const getDeviceDistribution = (days: number, limit = 10) =>
    getTrafficData<DeviceStatsItem[]>('/admin/traffic/device-distribution', { days, limit });

export const getBrowserDistribution = (days: number, limit = 10) =>
    getTrafficData<DeviceStatsItem[]>('/admin/traffic/browser-distribution', { days, limit });

export const getRefererDistribution = (days: number, limit = 10) =>
    getTrafficData<RefererStatsItem[]>('/admin/traffic/referer-distribution', { days, limit });

export const getSessionDuration = (days: number) =>
    getTrafficData<SessionStatsItem[]>('/admin/traffic/session-duration', { days });

export const getToolEventStats = (days: number, limit = 10) =>
    getTrafficData<ToolEventStats>('/admin/traffic/tool-events', { days, limit });
