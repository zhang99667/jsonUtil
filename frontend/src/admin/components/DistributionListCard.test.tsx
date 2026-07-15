import { Progress } from 'antd';
import { describe, expect, it } from 'vitest';
import { collectText, findByType } from '../../components/componentElementTestHelpers';
import { DistributionList, DistributionListCard } from './DistributionListCard';

describe('DistributionListCard 与 DistributionList', () => {
  it('统一渲染分布项数量、占比和进度条', () => {
    const tree = DistributionList({
      items: [{ key: 'desktop', label: '桌面端', count: 1234, percentage: 67.5 }],
      strokeColor: '#5B6EF5',
      emptyText: '暂无设备数据',
    });

    expect(collectText(tree)).toContain('桌面端');
    expect(collectText(tree)).toContain('1,234 (67.5%)');
    expect(findByType(tree, Progress)[0]?.props).toMatchObject({
      percent: 67.5,
      strokeColor: '#5B6EF5',
      showInfo: false,
    });
  });

  it('没有分布项时展示调用方提供的空态', () => {
    const tree = DistributionList({
      items: [],
      strokeColor: '#8B9CF7',
      emptyText: '来源数据暂不可用',
      emptyPadding: 24,
    });

    expect(collectText(tree)).toContain('来源数据暂不可用');
    expect(findByType(tree, Progress)).toHaveLength(0);
    expect(tree.props.style).toMatchObject({ padding: 24 });
  });

  it('卡片复用分布列表主体并保留内边距', () => {
    const tree = DistributionListCard({
      title: '设备类型分布',
      items: [{ key: 'desktop', label: '桌面端', count: 1234, percentage: 67.5 }],
      strokeColor: '#5B6EF5',
      emptyText: '暂无设备数据',
    });

    expect(findByType(tree, DistributionList)[0]?.props).toMatchObject({
      contentPadding: '8px 0',
      strokeColor: '#5B6EF5',
    });
  });
});
