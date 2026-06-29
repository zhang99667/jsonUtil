export {
  classifyTransformWarning,
  type TransformWarningClassification,
} from './transformWarningClassification';

export interface TransformUnresolvedCandidateClassification {
  reasonLabel: string;
  reasonLevel: 'info' | 'warning';
  nextAction: string;
}

export const classifyTransformUnresolvedCandidate = (
  candidate: { detectedType?: string; message: string }
): TransformUnresolvedCandidateClassification => {
  if (candidate.detectedType === 'url-encoded') {
    if (candidate.message.includes('解码失败')) {
      return {
        reasonLabel: 'URL 编码解码失败',
        reasonLevel: 'warning',
        nextAction: '检查该字段是否包含半截 UTF-8、孤立百分号或被日志截断的编码片段；可复制原始值单独确认来源。',
      };
    }

    return {
      reasonLabel: '已解码但未结构化',
      reasonLevel: 'info',
      nextAction: '定位该字段确认是否只是普通埋点参数；如果它应继续拆成对象，可把原始值加入 CMD 解析样本。',
    };
  }

  if (candidate.detectedType === 'query-string') {
    return {
      reasonLabel: '疑似 CMD 规则缺口',
      reasonLevel: 'warning',
      nextAction: '检查分隔符、嵌套编码或参数名形态，必要时补充单字段 CMD 解析规则。',
    };
  }

  if (candidate.detectedType === 'url') {
    return {
      reasonLabel: '疑似 URL/Scheme 规则缺口',
      reasonLevel: 'warning',
      nextAction: '定位源字段确认协议、hash route 或内层 query 形态，必要时补充 Scheme 解析样本。',
    };
  }

  if (candidate.detectedType === 'base64') {
    return {
      reasonLabel: '疑似 Base64 非 JSON',
      reasonLevel: 'info',
      nextAction: '确认该值是否为二进制或拼接载荷；如果业务上应是 JSON，可保留样本补充 Base64 规则。',
    };
  }

  return {
    reasonLabel: '待补充解析规则',
    reasonLevel: candidate.message.includes('不是有效 JSON') ? 'warning' : 'info',
    nextAction: '定位该字段并保留原始值，用作后续解析规则或样本回归补充。',
  };
};
