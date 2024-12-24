document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('lockToggle');
  const statusText = document.getElementById('status');
  const noteTextarea = document.getElementById('noteInput');
  const notePosition = document.getElementById('notePosition');
  const saveNoteButton = document.getElementById('saveNote');

  // 定时器相关的DOM元素
  const startTimeInput = document.getElementById('startTime');
  const minutesInput = document.getElementById('minutesInput');
  const targetTimeDisplay = document.getElementById('targetTimeDisplay');
  const setTimerButton = document.getElementById('setTimer');
  const cancelTimerButton = document.getElementById('cancelTimer');

  let timerInterval;

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
      const lockStatus = await chrome.storage.local.get([`lock_${currentTab.url}`]);
      const isLocked = lockStatus[`lock_${currentTab.url}`] || false;
      toggleButton.checked = isLocked;
      updateStatus(isLocked);

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

  // 计算目标时间
  function calculateTargetTime(startTime, minutes) {
    const startDate = new Date(startTime);
    return new Date(startDate.getTime() + minutes * 60000);
  }

  // 更新目标时间显示
  function updateTargetTimeDisplay(targetTime) {
    targetTimeDisplay.textContent = targetTime.toLocaleTimeString();
  }

  // 验证时间格式
  function isValidTimeFormat(timeStr) {
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!regex.test(timeStr)) {
      return false;
    }
    const date = new Date(timeStr.replace(' ', 'T'));
    return !isNaN(date.getTime());
  }

  // 生成当前时间的格式化字符串
  function getCurrentFormattedTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // 设置定时器
  function setTimer() {
    let startTime = startTimeInput.value.trim();
    const minutes = parseInt(minutesInput.value);
    
    if (!startTime) {
      // 如果没有输入时间，使用当前时间
      startTime = getCurrentFormattedTime();
      startTimeInput.value = startTime;
    }

    if (!isValidTimeFormat(startTime)) {
      alert('请输入正确的时间格式：YYYY-MM-DD HH:mm:ss');
      return;
    }

    if (isNaN(minutes) || minutes <= 0) {
      alert('请输入有效的分钟数！');
      return;
    }

    const targetTime = calculateTargetTime(startTime.replace(' ', 'T'), minutes);
    updateTargetTimeDisplay(targetTime);

    // 存储定时器信息
    chrome.storage.local.set({
      timer: {
        startTime,
        minutes,
        targetTime: targetTime.getTime()
      }
    });

    // 向当前标签页发送定时器信息
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'setTimer',
        startTime,
        minutes,
        targetTime: targetTime.getTime()
      });
    });

    setTimerButton.style.display = 'none';
    cancelTimerButton.style.display = 'block';
  }

  // 重置定时器界面
  function resetTimerUI() {
    setTimerButton.style.display = 'block';
    cancelTimerButton.style.display = 'none';
    targetTimeDisplay.textContent = '--:--:--';
    startTimeInput.value = getCurrentFormattedTime();
    minutesInput.value = '';
  }

  // 监听来自content script的消息
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'timerComplete') {
      resetTimerUI();
    }
  });

  // 取消定时器
  function cancelTimer() {
    chrome.storage.local.remove('timer');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'cancelTimer'
      });
    });
    resetTimerUI();
  }

  // 初始化定时器状态
  function initializeTimerState() {
    chrome.storage.local.get('timer', function(data) {
      if (data.timer) {
        const targetTime = new Date(data.timer.targetTime);
        updateTargetTimeDisplay(targetTime);
        setTimerButton.style.display = 'none';
        cancelTimerButton.style.display = 'block';
      }
    });
  }

  // 事件监听器
  setTimerButton.addEventListener('click', setTimer);
  cancelTimerButton.addEventListener('click', cancelTimer);

  // 初始化
  initializePopup();
  initializeTimerState();

  // 监听开关变化
  toggleButton.addEventListener('change', async function() {
    try {
      const isLocked = toggleButton.checked;
      updateStatus(isLocked);

      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const currentTab = tabs[0];

      // 保存锁定状态到storage
      await chrome.storage.local.set({ [`lock_${currentTab.url}`]: isLocked });

      // 发送消息到content script
      await chrome.tabs.sendMessage(currentTab.id, {
        action: "toggleLock",
        isLocked: isLocked
      });

    } catch (error) {
      console.error('切换状态失败:', error);
      statusText.textContent = '操作失败，请���新页面重试';
      // 恢复按钮状态
      toggleButton.checked = !toggleButton.checked;
      updateStatus(!toggleButton.checked);
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
          saveNoteButton.textContent = '保存备注';
          saveNoteButton.style.backgroundColor = '#2196f3';
        }, 1000);
      }
    } catch (error) {
      console.error('保存备注失败:', error);
      saveNoteButton.textContent = '保存失��';
      saveNoteButton.style.backgroundColor = '#f44336';
      setTimeout(() => {
        saveNoteButton.textContent = '保存备注';
        saveNoteButton.style.backgroundColor = '#2196f3';
      }, 1000);
    }
  });

  function updateStatus(isLocked) {
    statusText.textContent = `当前状态: ${isLocked ? '已锁定' : '未锁定'}`;
  }

  // 初始化时间输入框
  function initializeTimeInput() {
    startTimeInput.value = getCurrentFormattedTime();
  }

  initializeTimeInput();
  initializeTimerState();
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