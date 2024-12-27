document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('lockToggle');
  const statusText = document.getElementById('status');
  const noteTextarea = document.getElementById('noteInput');
  const saveNoteButton = document.getElementById('saveNote');

  // 定时器相关的DOM元素
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');
  const minutesInput = document.getElementById('minutesInput');
  const targetTimeDisplay = document.getElementById('targetTimeDisplay');
  const cancelTimerButton = document.getElementById('cancelTimer');

  let timerInterval;

  // 检查当前标签页是否可以执行脚本
  function checkIfContentScriptLoaded(tabId) {
    return new Promise((resolve) => {
      try {
        chrome.tabs.sendMessage(tabId, { action: "ping" }, response => {
          if (chrome.runtime.lastError) {
            resolve(false);
          } else {
            resolve(!!response);
          }
        });
      } catch (error) {
        resolve(false);
      }
    });
  }

  // 注入content script
  async function injectContentScriptIfNeeded(tab) {
    try {
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
        // 等待脚本加载完成
        await new Promise(resolve => setTimeout(resolve, 100));
        // 再次检查确保脚本已加载
        const isNowLoaded = await checkIfContentScriptLoaded(tab.id);
        if (!isNowLoaded) {
          throw new Error('无法加载内容脚本');
        }
      }
      return true;
    } catch (error) {
      console.error('注入脚本失败:', error);
      return false;
    }
  }

  // 发送消息到content script的包装函数
  async function sendMessageToContentScript(tabId, message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tabId, message, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // 初始化页面状态
  async function initializePopup() {
    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const currentTab = tabs[0];
      
      // 确保content script已加载
      const scriptLoaded = await injectContentScriptIfNeeded(currentTab);
      if (!scriptLoaded) {
        throw new Error('无法初始化插件，请刷新页面重试');
      }

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
        
        // 如果有定时器数据，恢复定时器状态
        if (noteData.timer) {
          const now = new Date().getTime();
          const targetTime = new Date(noteData.timer.targetTime).getTime();
          if (targetTime > now) {
            updateTargetTimeDisplay(new Date(targetTime));
            cancelTimerButton.style.display = 'block';
            startTimeInput.value = noteData.timer.startTime;
            minutesInput.value = noteData.timer.minutes;
          }
        }
      }
    } catch (error) {
      console.error('初始化失败:', error);
      statusText.textContent = error.message || '初始化失败，请刷新页面重试';
    }
  }

  // 计算目标时间
  function calculateTargetTime(startTime, minutes) {
    const startDate = new Date(startTime);
    return new Date(startDate.getTime() + minutes * 60000);
  }

  // 计算两个时间之间的分钟数
  function calculateMinutesBetween(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return (end - start) / 60000; // 转换为分钟
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

  // 重置定时器界面
  function resetTimerUI() {
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
        cancelTimerButton.style.display = 'block';
      }
    });
  }

  // 事件监听器
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
      statusText.textContent = '操作失败，请刷新���面重试';
      // 恢复按钮状态
      toggleButton.checked = !toggleButton.checked;
      updateStatus(!toggleButton.checked);
    }
  });

  // 监听结束时间输入
  endTimeInput.addEventListener('change', function() {
    const endTime = endTimeInput.value.trim();
    const startTime = startTimeInput.value.trim() || getCurrentFormattedTime();
    
    if (endTime && isValidTimeFormat(endTime)) {
      if (!startTime) {
        startTimeInput.value = getCurrentFormattedTime();
      }
      
      const minutes = calculateMinutesBetween(startTime.replace(' ', 'T'), endTime.replace(' ', 'T'));
      if (minutes > 0) {
        minutesInput.value = minutes.toFixed(1);
        const targetTime = new Date(endTime.replace(' ', 'T'));
        updateTargetTimeDisplay(targetTime);
      } else {
        alert('结束时间必须晚于开始时间');
        endTimeInput.value = '';
        minutesInput.value = '';
        targetTimeDisplay.textContent = '--:--:--';
      }
    }
  });

  // 监听分钟数输入
  minutesInput.addEventListener('change', function() {
    const minutes = parseFloat(minutesInput.value);
    const startTime = startTimeInput.value.trim() || getCurrentFormattedTime();
    
    if (!isNaN(minutes) && minutes > 0) {
      if (!startTime) {
        startTimeInput.value = getCurrentFormattedTime();
      }
      
      const targetTime = calculateTargetTime(startTime.replace(' ', 'T'), minutes);
      endTimeInput.value = targetTime.toISOString().replace('T', ' ').slice(0, 19);
      updateTargetTimeDisplay(targetTime);
    }
  });

  // 保存备注
  saveNoteButton.addEventListener('click', async function(e) {
    e.preventDefault();
    
    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const currentTab = tabs[0];
      
      // 确保content script已加载
      const scriptLoaded = await injectContentScriptIfNeeded(currentTab);
      if (!scriptLoaded) {
        throw new Error('无法保存备注，请刷新页面重试');
      }

      const noteText = noteTextarea.value;
      let minutes = parseFloat(minutesInput.value);
      let startTime = startTimeInput.value.trim();
      let endTime = endTimeInput.value.trim();
      let timerData = null;

      // 如果输入了结束时间但没有输入分钟数
      if (endTime && !minutes) {
        if (!startTime) {
          startTime = getCurrentFormattedTime();
          startTimeInput.value = startTime;
        }
        
        if (!isValidTimeFormat(endTime)) {
          alert('请输入正确的时间格式：YYYY-MM-DD HH:mm:ss');
          return;
        }
        
        minutes = calculateMinutesBetween(startTime.replace(' ', 'T'), endTime.replace(' ', 'T'));
      }

      // 如果输入了分钟数或结束时间，则设置定时器
      if (!isNaN(minutes) && minutes > 0) {
        if (!startTime) {
          startTime = getCurrentFormattedTime();
          startTimeInput.value = startTime;
        }

        if (!isValidTimeFormat(startTime)) {
          alert('请输入正确的时间格式：YYYY-MM-DD HH:mm:ss');
          return;
        }

        const targetTime = calculateTargetTime(startTime.replace(' ', 'T'), minutes);
        updateTargetTimeDisplay(targetTime);

        timerData = {
          startTime,
          endTime: targetTime.toISOString().replace('T', ' ').slice(0, 19),
          minutes,
          targetTime: targetTime.getTime()
        };

        cancelTimerButton.style.display = 'block';
      }

      // 保存到存储
      const data = {};
      data[currentTab.url] = {
        text: noteText,
        timer: timerData
      };
      await chrome.storage.local.set(data);

      // 更新页面显示
      const response = await sendMessageToContentScript(currentTab.id, {
        action: "updateNote",
        note: noteText,
        timer: timerData
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
      console.error('保存失败:', error);
      saveNoteButton.textContent = '保存失败';
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

  // 设置开始时间默认为当前时间
  startTimeInput.value = getCurrentFormattedTime();

  // 每秒更新一次开始时间
  setInterval(() => {
    if (!startTimeInput.value || document.activeElement !== startTimeInput) {
      startTimeInput.value = getCurrentFormattedTime();
    }
  }, 1000);
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