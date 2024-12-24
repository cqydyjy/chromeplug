let blinkInterval;
let originalFavicon;

// 开始标签页闪烁
function startTabBlinking(tabId) {
  let isBlinking = false;

  // 保存原始favicon
  chrome.tabs.get(tabId, function(tab) {
    originalFavicon = tab.favIconUrl;
  });

  // 清除现有的闪烁定时器
  if (blinkInterval) {
    clearInterval(blinkInterval);
  }

  // 设置新的闪烁定时器
  blinkInterval = setInterval(() => {
    isBlinking = !isBlinking;
    if (isBlinking) {
      // 设置红色favicon
      chrome.tabs.sendMessage(tabId, {
        action: 'setFavicon',
        color: '#ff0000'
      });
    } else {
      // 恢复原始favicon
      chrome.tabs.sendMessage(tabId, {
        action: 'setFavicon',
        url: originalFavicon
      });
    }
  }, 500); // 每500毫秒闪烁一次
}

// 停止标签页闪烁
function stopTabBlinking(tabId) {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    // 恢复原始favicon
    if (originalFavicon) {
      chrome.tabs.sendMessage(tabId, {
        action: 'setFavicon',
        url: originalFavicon
      });
    }
  }
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'startTabBlinking') {
    startTabBlinking(sender.tab.id);
    sendResponse({success: true});
  } else if (request.action === 'stopTabBlinking') {
    stopTabBlinking(sender.tab.id);
    sendResponse({success: true});
  }
  return true;
}); 