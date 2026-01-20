// 测试 scheme 识别问题

const testUrl = "baiduboxapp://vendor/ad/nadcore/webpanel?url=https%3A%2F%2Fpages-fast.m.taobao.com%2Fwow%2Fz%2Fapp%2Fug%2Fcrowd%2Fnewuser-foreign%3Fauthor_id%3D6700943272%26bc_fl_src%3Dgrowth_dhh_2200803434111_809387997887-59009861-302271253-%257B%257BIDEA_ID%257D%257D-null-null-%257B%257BUNIT_ID%257D%257D-%257B%257BUSER_ID%257D%257D%26bd_vid%3Dn1TvnWc4P1mkrjRLn1Rdg1czn19xnNts%26clickId%3D%257B%257BCLICK_ID%257D%257D%26disableNav%3DYES%26dpa_source_code%3D12890%26ext_log%3D%257B%2522bd_vid%2522%253A%2522%2522%252C%2522room_id%2522%253A%252210590865885%2522%257D%26feed_type%3Dnatural%26forceThemis%3Dtrue%26itemIds%3D809387997887%26nid%3D%26room_id%3D10590865885%26rtaId%3D__SID__%26slk_actid%3D100000000207%26unionSite%3D__MEDIA_ID__%26x-preload%3Dtrue%26x-ssr%3Dtrue&height_ratio=0.7&lp_org_type=ad&ad_invoke_flag=1&enable_outer_back=1";

console.log("测试 URL:", testUrl);
console.log("\n预期结果:");
console.log("- 识别为 baiduboxapp:// scheme");
console.log("- 参数中包含嵌套的 https:// URL");

// 测试正则
const urlRegex = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.+/;
console.log("\n正则测试:", urlRegex.test(testUrl));

// 提取 scheme
const schemeMatch = testUrl.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
if (schemeMatch) {
  console.log("识别的 scheme:", schemeMatch[1]);
}

// 解析 URL
try {
  const url = new URL(testUrl);
  console.log("\nURL 解析结果:");
  console.log("- protocol:", url.protocol);
  console.log("- host:", url.host);
  console.log("- pathname:", url.pathname);

  console.log("\n参数列表:");
  for (const [key, value] of url.searchParams.entries()) {
    console.log(`- ${key}:`, value.substring(0, 100) + (value.length > 100 ? '...' : ''));
  }

  // 检查 url 参数
  const urlParam = url.searchParams.get('url');
  if (urlParam) {
    console.log("\n嵌套的 url 参数:", urlParam);
  }
} catch (e) {
  console.error("URL 解析失败:", e.message);
}
