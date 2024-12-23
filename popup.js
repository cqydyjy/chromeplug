document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('lockToggle');
  const statusText = document.getElementById('status');

  // 从存储中获取当前状态
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      function: checkLockStatus
    }, (results) => {
      if (results && results[0]) {
        toggleButton.checked = results[0].result;
        updateStatus(results[0].result);
      }
    });
  });

  // 监听开关变化
  toggleButton.addEventListener('change', function() {
    const isLocked = toggleButton.checked;
    updateStatus(isLocked);

    // 向当前标签页发送锁定/解锁命令
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: togglePageLock,
        args: [isLocked]
      });
    });
  });

  function updateStatus(isLocked) {
    statusText.textContent = `当前状态: ${isLocked ? '已锁定' : '未锁定'}`;
  }
});

// 检���页面锁定状态
function checkLockStatus() {
  return document.body.classList.contains('page-locked');
}

// 切换页面锁定状态
function togglePageLock(isLocked) {
  if (isLocked) {
    document.body.classList.add('page-locked');
  } else {
    document.body.classList.remove('page-locked');
  }
  return isLocked;
} 