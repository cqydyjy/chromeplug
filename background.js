// 存储闪烁定时器的对象
const blinkIntervals = {};

// 监听来自content script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'startTabBlinking') {
    const tabId = sender.tab.id;
    
    // 清除现有的闪烁定时器
    if (blinkIntervals[tabId]) {
      clearInterval(blinkIntervals[tabId].interval);
      clearTimeout(blinkIntervals[tabId].timeout);
      delete blinkIntervals[tabId];
    }
    
    // 开始新的闪烁
    let isBlinking = false;
    const interval = setInterval(() => {
      chrome.tabs.get(tabId, function(tab) {
        if (chrome.runtime.lastError) {
          clearInterval(interval);
          return;
        }
        isBlinking = !isBlinking;
        chrome.tabs.sendMessage(tabId, {
          action: 'setFavicon',
          url: isBlinking ? null : tab.favIconUrl
        });
      });
    }, 500);

    // 30秒后自动停止闪烁
    const timeout = setTimeout(() => {
      if (blinkIntervals[tabId]) {
        clearInterval(blinkIntervals[tabId].interval);
        chrome.tabs.get(tabId, function(tab) {
          if (!chrome.runtime.lastError) {
            chrome.tabs.sendMessage(tabId, {
              action: 'setFavicon',
              url: tab.favIconUrl
            });
          }
        });
        delete blinkIntervals[tabId];
      }
    }, 30000);

    // 保存定时器引用
    blinkIntervals[tabId] = {
      interval: interval,
      timeout: timeout
    };

  } else if (request.action === 'stopTabBlinking') {
    const tabId = sender.tab.id;
    if (blinkIntervals[tabId]) {
      clearInterval(blinkIntervals[tabId].interval);
      clearTimeout(blinkIntervals[tabId].timeout);
      chrome.tabs.get(tabId, function(tab) {
        if (!chrome.runtime.lastError) {
          chrome.tabs.sendMessage(tabId, {
            action: 'setFavicon',
            url: tab.favIconUrl
          });
        }
      });
      delete blinkIntervals[tabId];
    }
  } else if (request.action === 'createNotification') {
    chrome.notifications.create({
      type: request.options.type,
      title: request.options.title,
      message: request.options.message,
      iconUrl: request.options.iconUrl,
      priority: request.options.priority,
      requireInteraction: request.options.requireInteraction,
      buttons: request.options.buttons,
      silent: request.options.silent,
      eventTime: request.options.eventTime
    });
  }
}); 