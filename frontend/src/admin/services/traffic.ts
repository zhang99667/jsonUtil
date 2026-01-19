import request from './request';

// 概览数据接口
export interface TrafficOverview {
    totalPv: number;
    totalUv: number;
    todayPv: number;
    todayUv: number;
    avgDailyPv: number;
    avgDailyUv: number;
    days: number;
}

// 趋势数据接口
export interface TrendItem {
    date: string;
    pv: number;
    uv: number;
}

// IP排行接口
export interface TopIpItem {
    ip: string;
    count: number;
}

// 路径排行接口
export interface TopPathItem {
    path: string;
    count: number;
}

// 小时分布接口
export interface HourlyItem {
    hour: number;
    count: number;
}

// 地区分布接口
export interface GeoStatsItem {
    region: string;
    count: number;
    percentage: number;
}

// 设备/浏览器统计接口
export interface DeviceStatsItem {
    device: string | null;
    browser: string | null;
    count: number;
    percentage: number;
}

// 获取流量概览
export const getTrafficOverview = async (days: number): Promise<TrafficOverview> => {
    return request.get('/admin/traffic/overview', { params: { days } });
};

// 获取流量趋势
export const getTrafficTrend = async (days: number): Promise<TrendItem[]> => {
    return request.get('/admin/traffic/trend', { params: { days } });
};

// 获取IP访问排行
export const getTopIps = async (days: number, limit: number): Promise<TopIpItem[]> => {
    return request.get('/admin/traffic/top-ips', { params: { days, limit } });
};

// 获取路径访问排行
export const getTopPaths = async (days: number, limit: number): Promise<TopPathItem[]> => {
    return request.get('/admin/traffic/top-paths', { params: { days, limit } });
};

// 获取24小时分布
export const getHourlyStats = async (days: number): Promise<HourlyItem[]> => {
    return request.get('/admin/traffic/hourly', { params: { days } });
};

// 获取地区分布
export const getGeoDistribution = async (days: number, limit: number = 15): Promise<GeoStatsItem[]> => {
    return request.get('/admin/traffic/geo-distribution', { params: { days, limit } });
};

// 获取设备分布
export const getDeviceDistribution = async (days: number, limit: number = 10): Promise<DeviceStatsItem[]> => {
    return request.get('/admin/traffic/device-distribution', { params: { days, limit } });
};

// 获取浏览器分布
export const getBrowserDistribution = async (days: number, limit: number = 10): Promise<DeviceStatsItem[]> => {
    return request.get('/admin/traffic/browser-distribution', { params: { days, limit } });
};