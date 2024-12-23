document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('lockToggle');
  const statusText = document.getElementById('status');
  const noteTextarea = document.getElementById('pageNote');
  const notePosition = document.getElementById('notePosition');
  const saveNoteButton = document.getElementById('saveNote');

  // 检查当前标签页是否可以执行脚本
  function checkIfContentScriptLoaded(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: "ping" }, response => {
        resolve(!!response);
      });
    });
  }

  // 注入content script
  async function injectContentScriptIfNeeded(tab) {
    const isLoaded = await checkIfContentScriptLoaded(tab.id);
    if (!isLoaded) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['styles.css']
      });
    }
  }

  // 初始化页面状态
  async function initializePopup() {
    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const currentTab = tabs[0];
      
      // 确保content script已加载
      await injectContentScriptIfNeeded(currentTab);

      // 获取锁定状态
      const results = await chrome.scripting.executeScript({
        target: {tabId: currentTab.id},
        function: checkLockStatus
      });

      if (results && results[0]) {
        toggleButton.checked = results[0].result;
        updateStatus(results[0].result);
      }

      // 获取当前页面的备注
      const result = await chrome.storage.local.get([currentTab.url]);
      if (result[currentTab.url]) {
        const noteData = result[currentTab.url];
        noteTextarea.value = noteData.text || '';
        notePosition.value = noteData.position || 'top-right';
      }
    } catch (error) {
      console.error('初始化失败:', error);
      statusText.textContent = '初始化失败，请刷新页面重试';
    }
  }

  // 初始化
  initializePopup();

  // 监听开关变化
  toggleButton.addEventListener('change', async function() {
    try {
      const isLocked = toggleButton.checked;
      updateStatus(isLocked);

      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      await chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: togglePageLock,
        args: [isLocked]
      });
    } catch (error) {
      console.error('切换状态失败:', error);
      statusText.textContent = '操作失败，请刷新页面重试';
    }
  });

  // 保存备注
  saveNoteButton.addEventListener('click', async function() {
    try {
      const noteText = noteTextarea.value;
      const position = notePosition.value;

      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const currentTab = tabs[0];

      // 保存到存储
      const data = {};
      data[currentTab.url] = {
        text: noteText,
        position: position
      };
      await chrome.storage.local.set(data);

      // 更新页面显示
      const response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(currentTab.id, {
          action: "updateNote",
          note: noteText,
          position: position
        }, resolve);
      });

      if (response && response.success) {
        saveNoteButton.textContent = '已保存';
        saveNoteButton.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
          window.close();
        }, 500);
      }
    } catch (error) {
      console.error('保存备注失败:', error);
      saveNoteButton.textContent = '保存失败';
      saveNoteButton.style.backgroundColor = '#f44336';
    }
  });

  function updateStatus(isLocked) {
    statusText.textContent = `当前状态: ${isLocked ? '已锁定' : '未锁定'}`;
  }
});

// 检查页面锁定状态
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