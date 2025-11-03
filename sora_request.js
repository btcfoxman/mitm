/*
 * 仅记录请求，但智能跳过高频媒体文件
 */
(function () {
  'use strict';
  
  // 1. 检查环境
  if (typeof $request === 'undefined') {
    if (typeof $done === 'function') $done({});
    return;
  }

  const reqUrl = $request.url;

  // 2. 【关键】定义要忽略的媒体扩展名
  const mediaExtensions = /\.(m3u8|ts|avi|flv|webm|aac|mp3|jpg|png|gif|webp)(\?.*)?$/i;

  if (mediaExtensions.test(reqUrl)) {
    // 3. 如果是其他媒体文件，立即放行，不做任何处理
    $done($request);
    return;
  }
  
  // 4. (可选) 如果还需要匹配特定域名
  // const targetHost = "sora.chatgpt.com";
  // if ($request.hostname !== targetHost) {
  //   $done($request);
  //   return;
  // }

  // 5. 对于非媒体文件，执行“即发即忘”的日志记录
  const WEBHOOK_URL = "https://sora-server.epay123.net/api/add";
  
  (function sendLog(url) {
    if (!WEBHOOK_URL) return;
    try {
      $httpClient.get({
        url: WEBHOOK_URL + "?v=" + encodeURIComponent(url),
        headers: { 'User-Agent': 'Shadowrocket-Logger' }
      }, function (err, resp, data) {
        // 只是日志，忽略成功或失败
        if (err) {
          console.log("Webhook log error: " + err);
        }
      });
    } catch (e) {
      console.log("httpClient exception: " + e);
    }
  })(reqUrl);

  // 6. 【重要】立即放行原始请求，不要等待日志
  $done($request);

})();
