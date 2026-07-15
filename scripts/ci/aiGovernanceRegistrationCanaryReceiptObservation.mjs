import { parseRegistrationCanaryDsseEnvelope } from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';

const RECEIPT_OBSERVATION_CONTRACTS = Object.freeze({
  anchor: Object.freeze({
    label: 'anchor receipt',
    conflict: '检测到同一 checkpoint 的本地可观察 anchor 分叉或非幂等重签',
  }),
  authorization: Object.freeze({
    label: 'authorization receipt',
    conflict: '检测到 authorization receipt 的本地可观察分叉、双授权或双消费',
  }),
  consumption: Object.freeze({
    label: 'consumption receipt',
    conflict: '检测到 consumption receipt 的本地可观察分叉、双授权或双消费',
  }),
});

export const selectRegistrationCanaryObservedReceiptJson = ({
  receiptJsons,
  receiptKind,
  preferredSignerKeyId,
}) => {
  const contract = Object.hasOwn(RECEIPT_OBSERVATION_CONTRACTS, receiptKind)
    ? RECEIPT_OBSERVATION_CONTRACTS[receiptKind] : undefined;
  if (!contract) throw new TypeError('registration canary receipt observation kind 非法');
  if (!Array.isArray(receiptJsons) || receiptJsons.length < 1 || receiptJsons.length > 16) {
    throw new TypeError(`${contract.label} observation set 必须包含 1 到 16 条记录`);
  }
  const observed = Array.from(receiptJsons, receiptJson => ({
    receiptJson,
    ...parseRegistrationCanaryDsseEnvelope(receiptJson, contract.label),
  }));
  if (new Set(observed.map(item => item.proofSha256)).size !== 1) {
    throw new TypeError(contract.conflict);
  }
  const preferred = preferredSignerKeyId === undefined
    ? observed : observed.filter(item => item.signerKeyId === preferredSignerKeyId);
  return [...(preferred.length > 0 ? preferred : observed)].sort((left, right) => (
    left.receiptJson < right.receiptJson ? -1 : left.receiptJson > right.receiptJson ? 1 : 0
  ))[0].receiptJson;
};
