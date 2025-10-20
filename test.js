// 这是给 Shadowrocket/Surge 款脚本环境写的简单响应处理函数示例
// 仅用于自测：把 JSON 响应的 "note" 字段改为 "patched-by-me"
if (typeof $response !== 'undefined') {
  try {
    let body = $response.body;
    let obj = JSON.parse(body);
    obj.note = "patched-by-me";
    $done({body: JSON.stringify(obj)});
  } catch (e) {
    $done($response);
  }
}
