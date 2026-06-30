const normalizeOutput = (value) => String(value ?? '').trim();

const formatFailureDetail = (result) => {
  const stderr = normalizeOutput(result.stderr);
  const stdout = normalizeOutput(result.stdout);
  if (stderr) return stderr;
  if (stdout) return stdout;
  if (result.signal) return `被信号中断: ${result.signal}`;
  return `退出码 ${result.status ?? 'unknown'}`;
};

export const checkBashSyntax = (runner, label, args, options = {}) => {
  const result = runner('bash', args, options);

  if (result.error) {
    return `${label}: bash -n 执行失败: ${result.error.message}`;
  }
  if (result.status !== 0) {
    return `${label}: bash -n 失败: ${formatFailureDetail(result)}`;
  }
  return null;
};
