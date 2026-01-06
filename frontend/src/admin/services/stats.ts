import request from './request';

export interface Statistics {
    totalUsers: number;
    activeSubscriptions: number;
    totalRevenue: number;
    todayPv: number;
    todayUv: number;
}

export const getStatistics = async (): Promise<Statistics> => {
    return request.get('/stats');
};
