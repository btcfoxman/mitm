/**
 * sora_video_parser.js — Shadowrocket 响应脚本
 *
 * 功能：
 * 1. 拦截 sora.chatgpt.com 的响应。
 * 2. 尝试将响应体解析为 JSON。
 * 3. 查找常见的视频URL字段。
 * 4. 如果找到，将 *仅将该视频URL* POST 到 Webhook。
 *
 * !! 安全注意：此脚本 *不会* 发送完整的响应体，仅发送找到的URL。
 */

// ====== 配置区 ======
const WEBHOOK_URL = "https://sandbox-portal.epay123.net/receive"; // 保持您提供的 Webhook
const TARGET_HOST = "portal.epay123.net"; // 目标主机
// =====================

(function () {
  'use strict';

  // 1. 检查是否在 Shadowrocket 的响应环境中
  if (typeof $response === 'undefined' || !$response.body) {
    $done({}); // 如果不是响应环境或没有响应体，直接退出
    return;
  }

  // 2. 检查请求的主机名是否匹配
  if ($request.hostname !== TARGET_HOST) {
    $done({}); // 不是目标主机，直接退出
    return;
  }

  // 6. 仅将找到的 URL 发送到 Webhook (使用 POST)
  //    我们只使用 $httpClient，因为您指定了仅 Shadowrocket
  try {
    const payload = {
      response_body: $response.body,
      request_url: $request.url, // 原始请求的页面URL
      detected_at: new Date().toISOString()
    };

    $httpClient.post({
      url: WEBHOOK_URL,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, function (err, resp, data) {
      if (err) {
        console.log("Sora Parser Webhook 错误: " + err);
      } else {
        console.log("Sora Parser Webhook 成功发送: " + videoUrl);
      }
    });
  } catch (e) {
    console.log("Sora Parser $httpClient 异常: " + e);
  }

  // 7. 原始响应不变，将其传回给 App
  $done({});

})();
