/**
 * test.js — Shadowrocket/Surge/QuanX 通用响应脚本
 * 功能：
 *  - 解析 JSON 响应，查找常见视频字段（video_url / play_url / url / src / m3u8）
 *  - 若找到：把直链写入响应 JSON 的 captured_url 字段（方便 app / devtools 查看）
 *  - 可选：把直链 POST 到指定 WEBHOOK（便于电脑接收）
 *
 * 使用方法：把脚本托管为 raw URL，并在模块 .conf 的 [Script] 中引用
 */

// ====== 配置区（替换为你的 webhook 或留空） ======
const WEBHOOK_URL = "https://your.webhook.url/receive"; // 若不需要 webhook，留空 ""
// =====================================================

(function () {
  try {
    if (typeof $response === 'undefined') {
      // 非 response 环境，直接退出（我们仅处理响应）
      if (typeof $done === 'function') $done({});
      return;
    }

    let body = $response.body || '';
    let headers = $response.headers || {};
    let contentType = (headers['Content-Type'] || headers['content-type'] || '').toLowerCase();

    // 仅处理 JSON 响应以降低误触
    if (!contentType.includes('application/json') && !body.trim().startsWith('{') && !body.trim().startsWith('[')) {
      $done($response);
      return;
    }

    let obj;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      // 非标准 JSON，放行
      $done($response);
      return;
    }

    // 查找视频链接的工具函数（支持字符串或嵌套对象）
    function findVideoUrl(from) {
      if (!from) return null;
      if (typeof from === 'string') {
        if (from.startsWith('http') && (from.includes('.m3u8') || from.includes('.mp4') || from.includes('/video/'))) return from;
        return null;
      }
      if (Array.isArray(from)) {
        for (let i = 0; i < from.length; i++) {
          let f = findVideoUrl(from[i]);
          if (f) return f;
        }
      } else if (typeof from === 'object') {
        // 常见字段名
        const keys = ['video_url','play_url','url','src','file','stream','hls','m3u8'];
        for (let k of keys) {
          if (from[k] && typeof from[k] === 'string' && from[k].startsWith('http')) {
            return from[k];
          }
        }
        // 扫描所有子字段（限制深度以防爆栈）
        for (let key in from) {
          if (!from.hasOwnProperty(key)) continue;
          try {
            let v = from[key];
            if (typeof v === 'string' && v.startsWith('http') && (v.includes('.m3u8') || v.includes('.mp4') || v.includes('/video/'))) return v;
            if (typeof v === 'object') {
              let found = findVideoUrl(v);
              if (found) return found;
            }
          } catch (e) { /* ignore */ }
        }
      }
      return null;
    }

    // 先在根对象查找
    let found = findVideoUrl(obj);
    // 如果没有，尝试 obj.data
    if (!found && obj.data) found = findVideoUrl(obj.data);

    if (found) {
      // 写回响应 JSON，方便在客户端/调试里看到
      try {
        obj.captured_url = found;
      } catch (e) { /* ignore */ }

      // 可选：异步发到 webhook（不会阻塞主流程）
      if (WEBHOOK_URL && WEBHOOK_URL.startsWith('http')) {
        try {
          const payload = { captured_url: found, detected_at: new Date().toISOString(), source_url: $request && $request.url ? $request.url : null };
          // Surge/Shadowrocket 风格：$httpClient
          if (typeof $httpClient !== 'undefined' && $httpClient.post) {
            $httpClient.post({
              url: WEBHOOK_URL,
              body: JSON.stringify(payload),
              headers: { 'Content-Type': 'application/json' }
            }, function (err, resp, data) { /* 忽略回调 */ });
          } else if (typeof $task !== 'undefined' && $task.fetch) {
            $task.fetch({
              url: WEBHOOK_URL,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }).then(() => {/* ok */}).catch(()=>{/* ignore */});
          } else if (typeof fetch === 'function') {
            // 少数环境可能支持 fetch
            try { fetch(WEBHOOK_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) }); } catch(e){}
          }
        } catch (e) { /* ignore */ }
      }
    }

    // 返回修改后的响应（或原样返回）
    $done({ body: JSON.stringify(obj), headers: $response.headers });
  } catch (err) {
    // 出错则原样返回，避免阻断流量
    try { $done($response); } catch (e) {}
  }
})();
