export const REGISTRY_HEADER_CELLS = ['资产', '状态', '责任人', '复核节奏', '最近复核', '类型', '维护契约', '治理证据'];

export const isRegistryHeaderRow = cells => REGISTRY_HEADER_CELLS
  .every((headerCell, index) => cells[index] === headerCell);

export const extractAssetPath = cells => cells[0].match(/^`([^`]+)`$/)?.[1];

export const buildAssetRegistryRow = cells => ({
  status: cells[1],
  owner: cells[2],
  reviewCadence: cells[3],
  reviewDate: cells[4],
  type: cells[5],
  contract: cells[6],
  evidence: cells.slice(7).join(' | ').trim(),
});
