/**
 * test.js (已修复)
 * 功能：
 * 1. 拦截 portal.epay123.net 的响应。
 * 2. 检查响应是否为文本类型。
 * 3. 将响应体和请求URL POST到 Webhook。
 */

// ====== 配置区 ======
const WEBHOOK_URL = "https://sandbox-portal.epay123.net/receive";
const TARGET_HOST = "portal.epay123.net";
// =====================

(function () {
  'use strict';

  // 1. 检查环境
  /** if (typeof $response === 'undefined' || !$response.body || $request.hostname !== TARGET_HOST) {
    $done({});
    return;
  } */

  // 2. 检查响应是否为文本
  //    我们只处理 HTML, JSON, JS, CSS 等文本类型，忽略图片/文件
  /** const contentType = $response.headers['Content-Type'] || $response.headers['content-type'] || '';
  if (!contentType.match(/text|json|javascript|xml/i)) {
    console.log(`Sora Parser: 忽略非文本响应 (Content-Type: ${contentType})`);
    $done({});
    return;
  } */

  // 3. 尝试发送 Webhook
  try {
    const payload = {
      response_body: $response.body, // 此时 $response.body 确定是文本
      request_url: $request.url,
      detected_at: new Date().toISOString()
    };
    
    // 将 payload 字符串化
    /**const bodyString = JSON.stringify(payload);
     
    $httpClient.post({
      url: WEBHOOK_URL,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': String(bodyString.length) // 明确指定长度
      },
      body: bodyString
    }, function (err, resp, data) {
      if (err) {
        // 提交失败
        console.log("Sora Parser Webhook 错误: " + String(err));
      } else {
        // 提交成功
        console.log(`Sora Parser Webhook 成功发送到: ${payload.request_url} (HTTP Status: ${resp.status})`);
      }
    });*/
    (function sendToWebhook(webhook, bodyObj) {
      if (!webhook || typeof webhook !== 'string' || !webhook.startsWith('http')) return;
      const body = JSON.stringify(bodyObj);

      // Surge / Shadowrocket 风格
      if (typeof $httpClient !== 'undefined' && $httpClient.get) {
        try {
          $httpClient.post({
            url: webhook,
            body: body,
            headers: { 'Content-Type': 'application/json' }
          }, function (err, resp, data) {
            // 忽略回调与错误
          });
          return;
        } catch (e) { /* fallthrough */ }
      }

      // QuanX 风格
      else if (typeof $task !== 'undefined' && $task.fetch) {
        try {
          $task.fetch({
            url: webhook,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
          }).then(() => {/* ok */}).catch(()=>{/* ignore */});
          return;
        } catch (e) { /* fallthrough */ }
      }

      // 通用 fetch（少数环境）
      else if (typeof fetch === 'function') {
        try { fetch(webhook, { method: 'POST', headers: {'Content-Type':'application/json'}, body: body }); } catch (e) {}
      }
    })(WEBHOOK_URL, payload);

  } catch (e) {
    // 脚本内部异常（例如 JSON.stringify 失败）
    console.log("Sora Parser $httpClient 异常: " + String(e));
  }

  // 4. 原始响应不变
  $done({});

})();
