/**
 * 深度搜索 Hook 脚本
 * 注入到页面 MAIN world，拦截 JS 运行时数据
 */
export const DEEP_SEARCH_SCRIPT = `
(function() {
  'use strict';

  // 收集到的媒体资源
  var seenUrls = new Set();
  var seenKeys = new Set();

  // 回调函数，由外部通过 exposeFunction 注入
  var callback = window.__ccSnifferCallback || function() {};

  // 去重并上报
  function report(data) {
    if (data.url && seenUrls.has(data.url)) return;
    if (data.url) seenUrls.add(data.url);
    callback(data);
  }

  // 上报密钥
  function reportKey(key, source) {
    var keyStr = Array.isArray(key) ? key.join(',') : Array.from(new Uint8Array(key)).join(',');
    if (seenKeys.has(keyStr)) return;
    seenKeys.add(keyStr);
    callback({ action: 'ccSnifferAddKey', key: key, source: source });
  }

  // 获取扩展名
  function getExtension(str) {
    try {
      var url = new URL(str, location.href);
      var pathname = url.pathname.split('?')[0];
      var ext = pathname.split('.').pop().toLowerCase();
      var mediaExts = ['m3u8', 'm3u', 'mpd', 'mp4', 'mp3', 'flv', 'f4v', 'webm', 'ogg', 'ogv', 'mov', 'mkv', 'avi', 'wmv', 'asf', 'm4a', 'm4s', 'aac', 'wma', 'wav', 'mpeg', 'ts', 'key', 'srt', 'vtt', 'weba', 'opus'];
      if (mediaExts.indexOf(ext) !== -1) return ext;
    } catch(e) {}
    return null;
  }

  // 检查是否为 m3u8 内容
  function isM3U8Content(text) {
    if (!text || typeof text !== 'string') return false;
    return text.substring(0, 7).toUpperCase() === '#EXTM3U';
  }

  // 检查是否为 m3u8 URL
  function isM3U8Url(url) {
    var ext = getExtension(url);
    return ext === 'm3u8' || ext === 'm3u';
  }

  // 检查是否为 mpd URL
  function isMpdUrl(url) {
    return getExtension(url) === 'mpd';
  }

  // 检查是否为有效的 HTTP URL
  function isValidUrl(url) {
    return url && (url.indexOf('http://') === 0 || url.indexOf('https://') === 0);
  }

  // 检查是否为媒体 URL
  function isMediaUrl(url) {
    if (!isValidUrl(url)) return false;
    var ext = getExtension(url);
    return ext !== null;
  }

  // 递归搜索对象中的媒体 URL
  function searchObject(obj, depth) {
    if (depth > 5) return;
    if (obj === null || obj === undefined) return;
    
    if (typeof obj === 'string') {
      if (obj.length > 10 && obj.length < 2048) {
        if (isValidUrl(obj) && (isM3U8Url(obj) || isMpdUrl(obj) || isMediaUrl(obj))) {
          report({ url: obj, ext: getExtension(obj), source: 'deep-search-object' });
        }
      }
    } else if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        for (var i = 0; i < Math.min(obj.length, 50); i++) {
          searchObject(obj[i], depth + 1);
        }
      } else {
        var keys = Object.keys(obj);
        for (var i = 0; i < Math.min(keys.length, 30); i++) {
          searchObject(obj[keys[i]], depth + 1);
        }
      }
    }
  }

  // Hook JSON.parse
  var origJSONParse = JSON.parse;
  JSON.parse = function() {
    var result = origJSONParse.apply(this, arguments);
    try { searchObject(result, 0); } catch(e) {}
    return result;
  };

  // Hook XMLHttpRequest
  var origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    try {
      if (isM3U8Url(url) || isMpdUrl(url) || isMediaUrl(url)) {
        report({ url: url, ext: getExtension(url), source: 'deep-search-xhr' });
      }
    } catch(e) {}
    return origXHROpen.apply(this, arguments);
  };

  var origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function() {
    var xhr = this;
    xhr.addEventListener('load', function() {
      try {
        var text = xhr.responseText;
        if (isM3U8Content(text)) {
          report({ url: xhr.responseURL || '', ext: 'm3u8', content: text, source: 'deep-search-xhr-response' });
        }
        searchObject(text, 0);
      } catch(e) {}
    });
    return origXHRSend.apply(this, arguments);
  };

  // Hook fetch
  var origFetch = window.fetch;
  window.fetch = function() {
    var url = arguments[0];
    if (typeof url === 'string') {
      try {
        if (isM3U8Url(url) || isMpdUrl(url) || isMediaUrl(url)) {
          report({ url: url, ext: getExtension(url), source: 'deep-search-fetch' });
        }
      } catch(e) {}
    }
    return origFetch.apply(this, arguments).then(function(response) {
      var clone = response.clone();
      clone.text().then(function(text) {
        try {
          if (isM3U8Content(text)) {
            report({ url: typeof url === 'string' ? url : '', ext: 'm3u8', content: text, source: 'deep-search-fetch-response' });
          }
          searchObject(text, 0);
        } catch(e) {}
      }).catch(function() {});
      return response;
    });
  };

  // Hook TextDecoder
  var origTextDecode = TextDecoder.prototype.decode;
  TextDecoder.prototype.decode = function() {
    var result = origTextDecode.apply(this, arguments);
    try {
      if (isM3U8Content(result)) {
        report({ url: '', ext: 'm3u8', content: result, source: 'deep-search-textdecoder' });
      }
    } catch(e) {}
    return result;
  };

  // Hook String.fromCharCode
  var origFromCharCode = String.fromCharCode;
  String.fromCharCode = function() {
    var result = origFromCharCode.apply(this, arguments);
    try {
      if (isM3U8Content(result)) {
        report({ url: '', ext: 'm3u8', content: result, source: 'deep-search-fromcharcode' });
      }
    } catch(e) {}
    return result;
  };

  // Hook Array.prototype.join
  var origJoin = Array.prototype.join;
  Array.prototype.join = function() {
    var result = origJoin.apply(this, arguments);
    try {
      if (isM3U8Content(result)) {
        report({ url: '', ext: 'm3u8', content: result, source: 'deep-search-join' });
      }
    } catch(e) {}
    return result;
  };

  // Hook String.prototype.indexOf - 检测 #EXTM3U 查找
  var origIndexOf = String.prototype.indexOf;
  String.prototype.indexOf = function() {
    var result = origIndexOf.apply(this, arguments);
    try {
      if (arguments[0] === '#EXTM3U' && result !== -1) {
        report({ url: '', ext: 'm3u8', content: this.substring(0, 200), source: 'deep-search-indexof' });
      }
    } catch(e) {}
    return result;
  };

  // Hook btoa/atob
  var origAtob = window.atob;
  window.atob = function(str) {
    var result = origAtob.apply(this, arguments);
    try {
      if (isM3U8Content(result)) {
        report({ url: '', ext: 'm3u8', content: result, source: 'deep-search-atob' });
      }
      if (result && result.length > 10 && result.length < 2048) {
        if (isM3U8Url(result) || isMpdUrl(result)) {
          report({ url: result, ext: getExtension(result), source: 'deep-search-atob-url' });
        }
      }
    } catch(e) {}
    return result;
  };

  // Hook Worker
  var origWorker = window.Worker;
  window.Worker = function(scriptURL) {
    try {
      if (isM3U8Url(scriptURL) || isMpdUrl(scriptURL)) {
        report({ url: scriptURL, ext: getExtension(scriptURL), source: 'deep-search-worker' });
      }
    } catch(e) {}
    return new origWorker(scriptURL);
  };
  window.Worker.prototype = origWorker.prototype;

  // 定时检查页面中的 video/audio 元素
  setInterval(function() {
    var videos = document.querySelectorAll('video, audio');
    for (var i = 0; i < videos.length; i++) {
      var src = videos[i].src;
      if (src && src.length > 0) {
        try {
          // blob URL 追踪
          if (src.indexOf('blob:') === 0) {
            report({ url: src, ext: 'blob', source: 'deep-search-blob-url' });
          } else if (isM3U8Url(src) || isMpdUrl(src) || isMediaUrl(src)) {
            report({ url: src, ext: getExtension(src), source: 'deep-search-media-element' });
          }
        } catch(e) {}
      }
      // 检查 source 子元素
      var sources = videos[i].querySelectorAll('source');
      for (var j = 0; j < sources.length; j++) {
        var s = sources[j].src;
        if (s && s.length > 0) {
          try {
            if (s.indexOf('blob:') === 0) {
              report({ url: s, ext: 'blob', source: 'deep-search-blob-source' });
            } else if (isM3U8Url(s) || isMpdUrl(s) || isMediaUrl(s)) {
              report({ url: s, ext: getExtension(s), source: 'deep-search-source-element' });
            }
          } catch(e) {}
        }
      }
    }
  }, 2000);

  // 初始检查
  setTimeout(function() {
    var videos = document.querySelectorAll('video, audio');
    for (var i = 0; i < videos.length; i++) {
      var src = videos[i].src;
      if (src && src.length > 0) {
        try {
          if (isM3U8Url(src) || isMpdUrl(src) || isMediaUrl(src)) {
            report({ url: src, ext: getExtension(src), source: 'deep-search-media-element-init' });
          }
        } catch(e) {}
      }
    }
  }, 3000);

  // ===== 密钥检测 =====
  
  // Hook Uint8Array
  var OrigUint8Array = window.Uint8Array;
  window.Uint8Array = function(arg1, arg2, arg3) {
    var result;
    if (arguments.length === 0) {
      result = new OrigUint8Array();
    } else if (arguments.length === 1) {
      result = new OrigUint8Array(arg1);
    } else if (arguments.length === 2) {
      result = new OrigUint8Array(arg1, arg2);
    } else {
      result = new OrigUint8Array(arg1, arg2, arg3);
    }
    try {
      if (result.length === 16 || result.length === 32) {
        reportKey(Array.from(result), 'Uint8Array-' + result.length);
      }
    } catch(e) {}
    return result;
  };
  window.Uint8Array.prototype = OrigUint8Array.prototype;
  window.Uint8Array.from = OrigUint8Array.from;
  window.Uint8Array.of = OrigUint8Array.of;

  // Hook Uint16Array
  var OrigUint16Array = window.Uint16Array;
  window.Uint16Array = function(arg1, arg2, arg3) {
    var result;
    if (arguments.length === 0) {
      result = new OrigUint16Array();
    } else if (arguments.length === 1) {
      result = new OrigUint16Array(arg1);
    } else if (arguments.length === 2) {
      result = new OrigUint16Array(arg1, arg2);
    } else {
      result = new OrigUint16Array(arg1, arg2, arg3);
    }
    try {
      if (result.length === 8 || result.length === 16) {
        reportKey(Array.from(result), 'Uint16Array-' + result.length);
      }
    } catch(e) {}
    return result;
  };
  window.Uint16Array.prototype = OrigUint16Array.prototype;

  // Hook Uint32Array
  var OrigUint32Array = window.Uint32Array;
  window.Uint32Array = function(arg1, arg2, arg3) {
    var result;
    if (arguments.length === 0) {
      result = new OrigUint32Array();
    } else if (arguments.length === 1) {
      result = new OrigUint32Array(arg1);
    } else if (arguments.length === 2) {
      result = new OrigUint32Array(arg1, arg2);
    } else {
      result = new OrigUint32Array(arg1, arg2, arg3);
    }
    try {
      if (result.length === 4 || result.length === 8) {
        reportKey(Array.from(result), 'Uint32Array-' + result.length);
      }
    } catch(e) {}
    return result;
  };
  window.Uint32Array.prototype = OrigUint32Array.prototype;

  // Hook DataView
  var OrigDataView = window.DataView;
  window.DataView = function(arg1, arg2, arg3) {
    var result;
    if (arguments.length === 0) {
      result = new OrigDataView();
    } else if (arguments.length === 1) {
      result = new OrigDataView(arg1);
    } else if (arguments.length === 2) {
      result = new OrigDataView(arg1, arg2);
    } else {
      result = new OrigDataView(arg1, arg2, arg3);
    }
    try {
      if (result.byteLength === 16 || result.byteLength === 32) {
        var bytes = new OrigUint8Array(result.byteLength);
        for (var i = 0; i < result.byteLength; i++) {
          bytes[i] = result.getUint8(i);
        }
        reportKey(Array.from(bytes), 'DataView-' + result.byteLength);
      }
    } catch(e) {}
    return result;
  };
  window.DataView.prototype = OrigDataView.prototype;

  // Hook escape - 检测 Base64 密钥
  var origEscape = window.escape;
  window.escape = function(str) {
    var result = origEscape.apply(this, arguments);
    try {
      if (result && result.length === 24 && result.substring(22, 24) === '==') {
        reportKey(result, 'escape-base64');
      }
    } catch(e) {}
    return result;
  };

  // ===== MSE Proxy (MediaSource 捕获) =====
  // 代理 addSourceBuffer 拦截 appendBuffer
  if (window.MediaSource && window.MediaSource.prototype.addSourceBuffer) {
    var origAddSourceBuffer = window.MediaSource.prototype.addSourceBuffer;
    window.MediaSource.prototype.addSourceBuffer = function(mimeType) {
      var buffer = origAddSourceBuffer.apply(this, arguments);
      try {
        var origAppendBuffer = buffer.appendBuffer;
        buffer.appendBuffer = function(data) {
          // 收集媒体数据块
          report({ action: 'mse-appendBuffer', size: data.byteLength || data.length, source: 'mse-proxy' });
          return origAppendBuffer.apply(this, arguments);
        };
      } catch(e) {}
      return buffer;
    };
  }

})();
`;
