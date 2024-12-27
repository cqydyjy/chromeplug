let blinkingTabs = new Map(); // 使用Map存储所有闪烁的标签页信息

// 请求通知权限
chrome.runtime.onInstalled.addListener(function() {
  // 检查通知权限
  chrome.notifications.getPermissionLevel(function(level) {
    if (level !== 'granted') {
      // 如果没有权限，尝试请求权限
      chrome.permissions.request({
        permissions: ['notifications']
      });
    }
  });
});

// 存储通知URL的映射
let notificationUrlMap = new Map();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'startTabBlinking') {
    if (sender.tab) {
      const tabId = sender.tab.id;
      
      // 保存原始favicon和闪烁间隔
      chrome.tabs.get(tabId, function(tab) {
        const tabInfo = {
          originalFavicon: tab.favIconUrl,
          interval: null
        };
        
        // 清除现有的闪烁间隔
        if (blinkingTabs.has(tabId)) {
          clearInterval(blinkingTabs.get(tabId).interval);
        }
        
        let isBlinking = false;
        tabInfo.interval = setInterval(() => {
          isBlinking = !isBlinking;
          if (isBlinking) {
            const color = request.color || '#FFA500';
            chrome.tabs.sendMessage(tabId, {
              action: 'setFavicon',
              color: color
            });
          } else {
            chrome.tabs.sendMessage(tabId, {
              action: 'setFavicon',
              url: tabInfo.originalFavicon
            });
          }
        }, 500);
        
        blinkingTabs.set(tabId, tabInfo);
      });
    }
  } else if (request.action === 'stopTabBlinking') {
    // 停止所有标签页的闪烁
    for (const [tabId, tabInfo] of blinkingTabs) {
      clearInterval(tabInfo.interval);
      chrome.tabs.sendMessage(tabId, {
        action: 'setFavicon',
        url: tabInfo.originalFavicon
      });
    }
    blinkingTabs.clear();
  } else if (request.action === 'createNotification') {
    // 创建Mac系统通知
    const notificationId = 'timer_' + Date.now();
    
    // 存储通知ID和URL的映射关系
    notificationUrlMap.set(notificationId, request.url);
    
    chrome.notifications.create(notificationId, request.options, function(id) {
      if (chrome.runtime.lastError) {
        console.error('创建通知失败:', chrome.runtime.lastError);
      }
    });
  }
  return true;
});

// 处理通知点击事件
chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
  const url = notificationUrlMap.get(notificationId);
  if (url) {
    // 查找并激活包含该URL的标签页
    chrome.tabs.query({url: url}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, {active: true});
        chrome.windows.update(tabs[0].windowId, {focused: true});
      } else {
        // 如果找不到标签页，则新建一个
        chrome.tabs.create({url: url, active: true});
      }
    });
    
    // 清除通知
    chrome.notifications.clear(notificationId);
    notificationUrlMap.delete(notificationId);
  }
});

// 处理通知关闭事件
chrome.notifications.onClosed.addListener(function(notificationId) {
  notificationUrlMap.delete(notificationId);
}); 