// 在文件顶部声明全局变量
let countdownInterval = null;
let timerInfo = null;

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // 响应ping请求
  if (request.action === "ping") {
    const isLocked = document.body.classList.contains('page-locked');
    sendResponse({ success: true, isLocked: isLocked });
    return true;
  }
  
  if (request.action === "toggleLock") {
    try {
      if (request.isLocked) {
        // 添加锁定类
        document.body.classList.add('page-locked');
        
        // 禁用所有表单元素
        const formElements = document.querySelectorAll('input, textarea, select, button');
        formElements.forEach(element => {
          element.setAttribute('disabled', 'true');
          element.style.pointerEvents = 'none';
        });

        // 禁用所有链接
        const links = document.querySelectorAll('a');
        links.forEach(link => {
          link.style.pointerEvents = 'none';
          link.setAttribute('tabindex', '-1');
        });

        // 阻止键盘事件
        document.addEventListener('keydown', preventKeyboardEvents, true);
        document.addEventListener('keyup', preventKeyboardEvents, true);
        document.addEventListener('keypress', preventKeyboardEvents, true);

        // 阻止鼠标事件
        document.addEventListener('click', preventMouseEvents, true);
        document.addEventListener('dblclick', preventMouseEvents, true);
        document.addEventListener('mousedown', preventMouseEvents, true);
        document.addEventListener('mouseup', preventMouseEvents, true);
        document.addEventListener('contextmenu', preventMouseEvents, true);

        // 阻止复制粘贴
        document.addEventListener('copy', preventClipboardEvents, true);
        document.addEventListener('cut', preventClipboardEvents, true);
        document.addEventListener('paste', preventClipboardEvents, true);

        // 阻止拖拽
        document.addEventListener('drag', preventDragEvents, true);
        document.addEventListener('dragstart', preventDragEvents, true);
        document.addEventListener('drop', preventDragEvents, true);

      } else {
        // 移除锁定类
        document.body.classList.remove('page-locked');
        
        // 启用所有表单元素
        const formElements = document.querySelectorAll('input, textarea, select, button');
        formElements.forEach(element => {
          element.removeAttribute('disabled');
          element.style.pointerEvents = '';
        });

        // 启用所有链接
        const links = document.querySelectorAll('a');
        links.forEach(link => {
          link.style.pointerEvents = '';
          link.removeAttribute('tabindex');
        });

        // 移除所有事件监听器
        document.removeEventListener('keydown', preventKeyboardEvents, true);
        document.removeEventListener('keyup', preventKeyboardEvents, true);
        document.removeEventListener('keypress', preventKeyboardEvents, true);

        document.removeEventListener('click', preventMouseEvents, true);
        document.removeEventListener('dblclick', preventMouseEvents, true);
        document.removeEventListener('mousedown', preventMouseEvents, true);
        document.removeEventListener('mouseup', preventMouseEvents, true);
        document.removeEventListener('contextmenu', preventMouseEvents, true);

        document.removeEventListener('copy', preventClipboardEvents, true);
        document.removeEventListener('cut', preventClipboardEvents, true);
        document.removeEventListener('paste', preventClipboardEvents, true);

        document.removeEventListener('drag', preventDragEvents, true);
        document.removeEventListener('dragstart', preventDragEvents, true);
        document.removeEventListener('drop', preventDragEvents, true);
      }

      // 保存锁定状态
      const url = window.location.href;
      chrome.storage.local.set({ [`lock_${url}`]: request.isLocked });

      sendResponse({success: true});
    } catch (error) {
      console.error('切换锁定状态失败:', error);
      sendResponse({success: false, error: error.message});
    }
    return true;
  } else if (request.action === "updateNote") {
    try {
      // 处理备注更新
      updatePageNote(request.note, request.timer);
      sendResponse({success: true});
    } catch (error) {
      console.error('更新备注失败:', error);
      sendResponse({success: false, error: error.message});
    }
    return true;
  } else if (request.action === 'setTimer') {
    setPageTimer(request);
    sendResponse({success: true});
  } else if (request.action === 'cancelTimer') {
    cancelPageTimer();
    sendResponse({success: true});
  } else if (request.action === 'setFavicon') {
    if (request.color) {
      updateFavicon(request.color);
    } else if (request.url) {
      // 恢复原始favicon
      const link = document.querySelector('link[rel="icon"]');
      if (link) {
        link.href = request.url;
      }
    }
    sendResponse({success: true});
    return true;
  }
});

// 阻事
function preventKeyboardEvents(e) {
  e.stopPropagation();
  e.preventDefault();
}

// 阻止鼠标事件
function preventMouseEvents(e) {
  e.stopPropagation();
  e.preventDefault();
}

// 阻止剪贴板事件
function preventClipboardEvents(e) {
  e.stopPropagation();
  e.preventDefault();
}

// 阻止拖拽事件
function preventDragEvents(e) {
  e.stopPropagation();
  e.preventDefault();
}

// 页面加载时恢复状态
document.addEventListener('DOMContentLoaded', function() {
  restoreLockStatus();
  restoreNote();
  restoreTimer();
});

// 如果页面已经加载完成，立即执行恢复
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  restoreLockStatus();
  restoreNote();
  restoreTimer();
}

// 恢复锁定状态
function restoreLockStatus() {
  const url = window.location.href;
  chrome.storage.local.get([`lock_${url}`], function(result) {
    if (result[`lock_${url}`]) {
      // 添加锁定类
      document.body.classList.add('page-locked');
      
      // 禁用所有表单元素
      const formElements = document.querySelectorAll('input, textarea, select, button');
      formElements.forEach(element => {
        element.setAttribute('disabled', 'true');
        element.style.pointerEvents = 'none';
      });

      // 禁用所有链接
      const links = document.querySelectorAll('a');
      links.forEach(link => {
        link.style.pointerEvents = 'none';
        link.setAttribute('tabindex', '-1');
      });

      // 阻止键盘事件
      document.addEventListener('keydown', preventKeyboardEvents, true);
      document.addEventListener('keyup', preventKeyboardEvents, true);
      document.addEventListener('keypress', preventKeyboardEvents, true);

      // 阻止鼠标事件
      document.addEventListener('click', preventMouseEvents, true);
      document.addEventListener('dblclick', preventMouseEvents, true);
      document.addEventListener('mousedown', preventMouseEvents, true);
      document.addEventListener('mouseup', preventMouseEvents, true);
      document.addEventListener('contextmenu', preventMouseEvents, true);

      // 阻止复制粘贴
      document.addEventListener('copy', preventClipboardEvents, true);
      document.addEventListener('cut', preventClipboardEvents, true);
      document.addEventListener('paste', preventClipboardEvents, true);

      // 阻止拖拽
      document.addEventListener('drag', preventDragEvents, true);
      document.addEventListener('dragstart', preventDragEvents, true);
      document.addEventListener('drop', preventDragEvents, true);
    }
  });
}

// 应用锁/解锁
function applyLock(isLocked) {
  if (isLocked) {
    // 添加锁定类
    document.body.classList.add('page-locked');
    
    // 禁用所有表单元素
    const formElements = document.querySelectorAll('input, textarea, select, button');
    formElements.forEach(element => {
      element.setAttribute('disabled', 'true');
      element.style.pointerEvents = 'none';
    });

    // 禁用所有链接
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      link.style.pointerEvents = 'none';
      link.setAttribute('tabindex', '-1');
    });

    // 阻止键盘事件
    document.addEventListener('keydown', preventKeyboardEvents, true);
    document.addEventListener('keyup', preventKeyboardEvents, true);
    document.addEventListener('keypress', preventKeyboardEvents, true);

    // 阻止鼠标事件
    document.addEventListener('click', preventMouseEvents, true);
    document.addEventListener('dblclick', preventMouseEvents, true);
    document.addEventListener('mousedown', preventMouseEvents, true);
    document.addEventListener('mouseup', preventMouseEvents, true);
    document.addEventListener('contextmenu', preventMouseEvents, true);

    // 阻止复制粘贴
    document.addEventListener('copy', preventClipboardEvents, true);
    document.addEventListener('cut', preventClipboardEvents, true);
    document.addEventListener('paste', preventClipboardEvents, true);

    // 阻止拖拽
    document.addEventListener('drag', preventDragEvents, true);
    document.addEventListener('dragstart', preventDragEvents, true);
    document.addEventListener('drop', preventDragEvents, true);

  } else {
    // 移除锁定类
    document.body.classList.remove('page-locked');
    
    // 启用所有表单元素
    const formElements = document.querySelectorAll('input, textarea, select, button');
    formElements.forEach(element => {
      element.removeAttribute('disabled');
      element.style.pointerEvents = '';
    });

    // 启用所有链接
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      link.style.pointerEvents = '';
      link.removeAttribute('tabindex');
    });

    // 移除所有事件监听器
    document.removeEventListener('keydown', preventKeyboardEvents, true);
    document.removeEventListener('keyup', preventKeyboardEvents, true);
    document.removeEventListener('keypress', preventKeyboardEvents, true);

    document.removeEventListener('click', preventMouseEvents, true);
    document.removeEventListener('dblclick', preventMouseEvents, true);
    document.removeEventListener('mousedown', preventMouseEvents, true);
    document.removeEventListener('mouseup', preventMouseEvents, true);
    document.removeEventListener('contextmenu', preventMouseEvents, true);

    document.removeEventListener('copy', preventClipboardEvents, true);
    document.removeEventListener('cut', preventClipboardEvents, true);
    document.removeEventListener('paste', preventClipboardEvents, true);

    document.removeEventListener('drag', preventDragEvents, true);
    document.removeEventListener('dragstart', preventDragEvents, true);
    document.removeEventListener('drop', preventDragEvents, true);
  }

  // 保存锁定状态
  const url = window.location.href;
  chrome.storage.local.set({ [`lock_${url}`]: isLocked });
}

// 页面加载时恢复备注和定时器
function restoreNote() {
  // 获取当前页面URL
  const url = window.location.href;
  
  // 从storage中获取备注数据
  chrome.storage.local.get([url], function(result) {
    if (result[url]) {
      const noteData = result[url];
      if (noteData.text) {
        // 恢复备注内容和位置
        updatePageNote(noteData.text, noteData.timer);
        
        // 如果有保存的位置数据，则恢复位置
        const container = document.querySelector('.note-container');
        if (container && noteData.position && noteData.position.transform) {
          restoreNotePosition(container, noteData.position);
        }
      }
    }
  });
}

// 使用个��监听器确保备注能够恢复
document.addEventListener('DOMContentLoaded', restoreNote);
window.addEventListener('load', restoreNote);

// 更新页面备注
function updatePageNote(noteText, timerData = null) {
  try {
    // 移除现有的备注和倒计时容器
    const existingContainer = document.querySelector('.note-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // 如果备注为空，则不显示
    if (!noteText.trim()) {
      return;
    }

    // ���容器
    const container = document.createElement('div');
    container.className = 'note-container center-top';
    
    // 创建备注元素
    const noteElement = document.createElement('div');
    noteElement.className = 'page-note';
    
    // 添加工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'note-toolbar';
    
    // 添加内容区域
    const content = document.createElement('div');
    content.className = 'note-content';
    content.textContent = noteText;
    
    // 组装备注元素
    noteElement.appendChild(toolbar);
    noteElement.appendChild(content);
    
    // 备注添加到容器
    container.appendChild(noteElement);
    
    // 添加到页面
    document.body.appendChild(container);

    // 设置容器的初始位置（固定为页面中心偏上）
    container.style.top = '30%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';

    // 初始化拖动功能
    initContainerDrag(container);

    // 如果有定时器数据，创建倒计时显示
    if (timerData) {
      const targetTime = new Date(timerData.targetTime);
      const now = new Date().getTime();
      if (targetTime.getTime() > now) {
        const display = createCountdownDisplay();
        if (display) {
          startCountdown(display, targetTime);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('更新备注失败:', error);
    return { success: false, error: error.message };
  }
}

// 创建倒计时显示元素
function createCountdownDisplay() {
  // 获取容器
  const container = document.querySelector('.note-container');
  if (!container) return null;
  
  // 获取备注元素
  const noteElement = container.querySelector('.page-note');
  if (!noteElement) return null;
  
  // 移除现有的倒计时显示
  const existingDisplay = document.getElementById('countdownDisplay');
  if (existingDisplay) {
    existingDisplay.remove();
  }
  
  const display = document.createElement('div');
  display.className = 'countdown-display';
  display.id = 'countdownDisplay';
  
  // 添加到备注元素内部
  noteElement.appendChild(display);
  
  return display;
}

// 初始化容器拖动功能
function initContainerDrag(container) {
  if (container.hasAttribute('data-drag-initialized')) {
    return;
  }
  
  let isDragging = false;
  let startX, startY;
  let startTranslateX = 0;
  let startTranslateY = 0;

  // 从transform中获取当前的translate值
  function getCurrentTranslate() {
    const transform = getComputedStyle(container).transform;
    if (transform === 'none') return { x: 0, y: 0 };
    const matrix = new DOMMatrix(transform);
    return { x: matrix.m41, y: matrix.m42 };
  }

  // 开始拖动
  function startDrag(e) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const { x, y } = getCurrentTranslate();
    startTranslateX = x;
    startTranslateY = y;
    container.classList.add('dragging');
  }

  // 拖动中
  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newTranslateX = startTranslateX + dx;
    const newTranslateY = startTranslateY + dy;
    
    container.style.transform = `translate3d(${newTranslateX}px, ${newTranslateY}px, 0)`;
  }

  // 结束拖动
  function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    container.classList.remove('dragging');
    saveContainerPosition(container);
  }

  // 添加事件监听器
  container.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
  
  // 标记容器已初始化拖动功能
  container.setAttribute('data-drag-initialized', 'true');
}

// 保存容器位置和大小
function saveContainerPosition(container) {
  const url = window.location.href;
  const noteElement = container.querySelector('.page-note');
  const countdownElement = container.querySelector('.countdown-display');
  
  const position = {
    transform: container.style.transform,
    top: container.style.top,
    left: container.style.left,
    right: container.style.right,
    bottom: container.style.bottom,
    position: container.className.match(/top-right|top-left|bottom-right|bottom-left/)[0],
    noteSize: noteElement ? {
      width: noteElement.style.width,
      height: noteElement.style.height
    } : null,
    countdownSize: countdownElement ? {
      width: countdownElement.style.width,
      height: countdownElement.style.height
    } : null
  };

  chrome.storage.local.get([url], function(result) {
    const data = result[url] || {};
    data.position = position;
    chrome.storage.local.set({ [url]: data });
  });
}

// 监听窗口大小变化，确保备注始终可见
window.addEventListener('resize', function() {
  const noteElement = document.querySelector('.page-note');
  if (noteElement) {
    ensureNoteInViewport(noteElement);
  }
});

// 监听备注大小变化
function observeNoteResize(noteElement) {
  let resizeTimeout;
  const resizeObserver = new ResizeObserver(entries => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      saveNotePosition(noteElement);
    }, 500);
  });
  
  resizeObserver.observe(noteElement);
}

// 初始化备注大小调整功能
function initNoteResize(noteElement) {
  const handles = noteElement.querySelectorAll('.resize-handle');
  
  handles.forEach(handle => {
    handle.addEventListener('mousedown', initResize);
  });

  function initResize(e) {
    e.stopPropagation(); // 防止触发拖动
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = noteElement.offsetWidth;
    const startHeight = noteElement.offsetHeight;
    const handlePosition = e.target.className.split(' ')[1]; // 获取手柄位置
    
    const startRect = noteElement.getBoundingClientRect();
    const startTransform = getComputedStyle(noteElement).transform;
    const matrix = new DOMMatrix(startTransform);
    const startTranslateX = matrix.m41;
    const startTranslateY = matrix.m42;

    noteElement.classList.add('resizing');

    function resize(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let translateX = startTranslateX;
      let translateY = startTranslateY;

      // 根据不同角落调整大小和位置
      switch(handlePosition) {
        case 'top-left':
          newWidth = startWidth - dx;
          newHeight = startHeight - dy;
          translateX = startTranslateX + dx;
          translateY = startTranslateY + dy;
          break;
        case 'top-right':
          newWidth = startWidth + dx;
          newHeight = startHeight - dy;
          translateY = startTranslateY + dy;
          break;
        case 'bottom-left':
          newWidth = startWidth - dx;
          newHeight = startHeight + dy;
          translateX = startTranslateX + dx;
          break;
        case 'bottom-right':
          newWidth = startWidth + dx;
          newHeight = startHeight + dy;
          break;
      }

      // 应用最小尺寸限制
      newWidth = Math.max(100, newWidth);
      newHeight = Math.max(50, newHeight);
      
      // 应用最大尺寸限制
      newWidth = Math.min(500, newWidth);
      newHeight = Math.min(400, newHeight);

      // 更新大小和位置
      noteElement.style.width = `${newWidth}px`;
      noteElement.style.height = `${newHeight}px`;
      noteElement.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    }

    function stopResize() {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      noteElement.classList.remove('resizing');
      
      // 保存新的位置和大小
      saveNotePosition(noteElement);
    }

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  }
}

// 恢复备注位置和大小
function restoreNotePosition(container, position) {
  if (position && position.transform) {
    // 如果有保存的位置数据，则恢复
    if (position.transform) container.style.transform = position.transform;
    if (position.top) container.style.top = position.top;
    if (position.left) container.style.left = position.left;
    if (position.right) container.style.right = position.right;
    if (position.bottom) container.style.bottom = position.bottom;
    if (position.position) {
      container.className = `note-container ${position.position}`;
    }
    
    // 恢复备注大小
    const noteElement = container.querySelector('.page-note');
    if (noteElement && position.noteSize) {
      if (position.noteSize.width) noteElement.style.width = position.noteSize.width;
      if (position.noteSize.height) noteElement.style.height = position.noteSize.height;
    }
    
    // 恢复倒计时大小
    const countdownElement = container.querySelector('.countdown-display');
    if (countdownElement && position.countdownSize) {
      if (position.countdownSize.width) countdownElement.style.width = position.countdownSize.width;
      if (position.countdownSize.height) countdownElement.style.height = position.countdownSize.height;
    }
  }
  
  // 确保备注在视口内
  ensureNoteInViewport(container);
}

// 确保备注在视口内
function ensureNoteInViewport(container) {
  const rect = container.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 获取前transform值
  const transform = container.style.transform;
  const matches = transform.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/);
  let x = matches ? parseFloat(matches[1]) : 0;
  let y = matches ? parseFloat(matches[2]) : 0;
  
  // 检查并调整水平位置
  if (rect.right > viewportWidth) {
    x -= (rect.right - viewportWidth + 20);
  }
  if (rect.left < 0) {
    x -= rect.left - 20;
  }
  
  // 检查并调整垂直位置
  if (rect.bottom > viewportHeight) {
    y -= (rect.bottom - viewportHeight + 20);
  }
  if (rect.top < 0) {
    y -= rect.top - 20;
  }
  
  // 应用新位置
  container.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  
  // 保存新位置
  saveContainerPosition(container);
}

// 监听窗口大小变化，确保备注始终可见
window.addEventListener('resize', function() {
  const noteElement = document.querySelector('.page-note');
  if (noteElement) {
    ensureNoteInViewport(noteElement);
  }
});

// 监听备注大小变化
function observeNoteResize(noteElement) {
  let resizeTimeout;
  const resizeObserver = new ResizeObserver(entries => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      saveNotePosition(noteElement);
    }, 500);
  });
  
  resizeObserver.observe(noteElement);
}

// 初始化备注大小调整功能
function initNoteResize(noteElement) {
  const handles = noteElement.querySelectorAll('.resize-handle');
  
  handles.forEach(handle => {
    handle.addEventListener('mousedown', initResize);
  });

  function initResize(e) {
    e.stopPropagation(); // 防止触发拖动
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = noteElement.offsetWidth;
    const startHeight = noteElement.offsetHeight;
    const handlePosition = e.target.className.split(' ')[1]; // 获取手柄位置
    
    const startRect = noteElement.getBoundingClientRect();
    const startTransform = getComputedStyle(noteElement).transform;
    const matrix = new DOMMatrix(startTransform);
    const startTranslateX = matrix.m41;
    const startTranslateY = matrix.m42;

    noteElement.classList.add('resizing');

    function resize(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let translateX = startTranslateX;
      let translateY = startTranslateY;

      // 根据不同角落调整大小和位置
      switch(handlePosition) {
        case 'top-left':
          newWidth = startWidth - dx;
          newHeight = startHeight - dy;
          translateX = startTranslateX + dx;
          translateY = startTranslateY + dy;
          break;
        case 'top-right':
          newWidth = startWidth + dx;
          newHeight = startHeight - dy;
          translateY = startTranslateY + dy;
          break;
        case 'bottom-left':
          newWidth = startWidth - dx;
          newHeight = startHeight + dy;
          translateX = startTranslateX + dx;
          break;
        case 'bottom-right':
          newWidth = startWidth + dx;
          newHeight = startHeight + dy;
          break;
      }

      // 应用最小尺寸限制
      newWidth = Math.max(100, newWidth);
      newHeight = Math.max(50, newHeight);
      
      // 应用最大尺寸限制
      newWidth = Math.min(500, newWidth);
      newHeight = Math.min(400, newHeight);

      // 更新大小和位置
      noteElement.style.width = `${newWidth}px`;
      noteElement.style.height = `${newHeight}px`;
      noteElement.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    }

    function stopResize() {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      noteElement.classList.remove('resizing');
      
      // 保存新的位置和大小
      saveNotePosition(noteElement);
    }

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  }
}

// 开始倒计时
function startCountdown(display, targetTime) {
  // 清除现有的定时器
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  // 立即更新一次显示
  updateCountdown(targetTime.getTime());

  // 设置新的定时器
  countdownInterval = setInterval(() => {
    updateCountdown(targetTime.getTime());
  }, 1000);
}

// 更新倒计时显示
function updateCountdown(targetTime) {
  const now = new Date().getTime();
  const timeLeft = targetTime - now;

  if (timeLeft <= 0) {
    // 时间到，触发提醒
    clearInterval(countdownInterval);
    triggerReminder();
    return;
  }

  // 计算剩余时间（转换为分钟，保留一位小数）
  const minutesLeft = (timeLeft / 60000).toFixed(1);
  const displayText = `${minutesLeft}分钟`;

  // 更新显示
  const countdownDisplay = document.getElementById('countdownDisplay');
  if (countdownDisplay) {
    countdownDisplay.textContent = displayText;
  }
}

// 触发提醒
function triggerReminder() {
  const currentUrl = window.location.href;
  const pageTitle = document.title;
  
  // 获取备注内容
  const noteContent = document.querySelector('.note-content');
  const noteText = noteContent ? noteContent.textContent.trim() : '';

  // 播放提示音
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');
  audio.play().catch(e => console.log('无法播放提示音:', e));

  // 发送消息给background script来闪烁标签页
  chrome.runtime.sendMessage({
    action: 'startTabBlinking',
    url: currentUrl
  });

  // 发送消息给background script来创建Mac系统通知
  chrome.runtime.sendMessage({
    action: 'createNotification',
    options: {
      type: 'basic',
      title: '时间到！',
      message: noteText || pageTitle || '您设置的定时器时间已到',
      iconUrl: chrome.runtime.getURL('images/icon128.png'),
      priority: 2,
      requireInteraction: true,
      buttons: [{
        title: '点击跳转到页面'
      }],
      silent: false,
      eventTime: Date.now() + 600000 // 设置通知持续时间为10分钟
    },
    url: currentUrl
  });

  // 添加闪烁效果到倒计时显示
  const countdownDisplay = document.getElementById('countdownDisplay');
  if (countdownDisplay) {
    countdownDisplay.textContent = '时间到！';
    countdownDisplay.classList.add('blink');
  }

  // 修改页面标题
  const originalTitle = document.title;
  let titleBlinkInterval = setInterval(() => {
    document.title = document.title === '⚠️ 时间到！' ? originalTitle : '⚠️ 时间到！';
  }, 500);

  // 30秒后停止所有提醒效果
  setTimeout(() => {
    // 停止标签栏闪烁
    chrome.runtime.sendMessage({
      action: 'stopTabBlinking',
      url: currentUrl
    });

    // 停止标题闪烁
    clearInterval(titleBlinkInterval);
    document.title = originalTitle;
    
    // 清除定时器状态
    chrome.storage.local.get([currentUrl], function(result) {
      const data = result[currentUrl] || {};
      delete data.timer;
      chrome.storage.local.set({ [currentUrl]: data });
    });

    // 通知popup重置界面
    chrome.runtime.sendMessage({
      action: 'timerComplete',
      url: currentUrl
    });

    // 移除倒计时显示
    if (countdownDisplay) {
      countdownDisplay.remove();
    }
  }, 30000); // 30秒后停止所有提醒效果
}

// 设置定时器
function setPageTimer(request) {
  timerInfo = request;
  const targetTime = new Date(request.targetTime);

  // 创建新的倒计时显示
  const display = createCountdownDisplay();
  if (!display) return;
  
  // 立即更新一次显示
  updateCountdown(targetTime);

  // 获取当前页面URL
  const url = window.location.href;
  
  // 从storage中获取现有数据
  chrome.storage.local.get([url], function(result) {
    const data = result[url] || {};
    
    // 更新定时器数据
    data.timer = request;
    
    // 保存数据
    chrome.storage.local.set({ [url]: data });
  });

  // 清除现有的定时器
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  // 设置新的定时器
  countdownInterval = setInterval(() => {
    updateCountdown(targetTime);
  }, 1000);
}

// 取消定时器
function cancelPageTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  const countdownDisplay = document.getElementById('countdownDisplay');
  if (countdownDisplay) {
    countdownDisplay.remove();
  }

  // 获取当前页面URL
  const url = window.location.href;
  
  // 从storage中获取现有数据
  chrome.storage.local.get([url], function(result) {
    const data = result[url] || {};
    // 删除定时器数据
    delete data.timer;
    // 保存更新后的数据
    chrome.storage.local.set({ [url]: data });
  });
  
  timerInfo = null;
}

// 页面加载时恢复定时器状态
function restoreTimer() {
  // 获取当前页面URL
  const url = window.location.href;
  
  // 从storage中获取数据
  chrome.storage.local.get([url], function(result) {
    if (result[url] && result[url].timer) {
      const timerData = result[url].timer;
      const now = new Date().getTime();
      const targetTime = new Date(timerData.targetTime).getTime();
      
      // 只有当目标时间还没时才恢复定时器
      if (targetTime > now) {
        // 创建新的倒计时显示
        const display = createCountdownDisplay();
        const container = display.parentElement;
        
        // 恢复位置和大小
        if (timerData.position) {
          if (timerData.position.transform) container.style.transform = timerData.position.transform;
          if (timerData.position.top) container.style.top = timerData.position.top;
          if (timerData.position.left) container.style.left = timerData.position.left;
          if (timerData.position.right) container.style.right = timerData.position.right;
          if (timerData.position.bottom) container.style.bottom = timerData.position.bottom;
          if (timerData.position.position) {
            container.className = `note-container ${timerData.position.position}`;
          }
          if (timerData.position.countdownSize) {
            if (timerData.position.countdownSize.width) display.style.width = timerData.position.countdownSize.width;
            if (timerData.position.countdownSize.height) display.style.height = timerData.position.countdownSize.height;
          }
        }
        
        // 设置定时器
        setPageTimer(timerData);
      } else {
        // 如果时间已到，删除存储的定时器状态
        const data = result[url];
        delete data.timer;
        chrome.storage.local.set({ [url]: data });
      }
    }
  });
}

// 创建和更新favicon
function updateFavicon(url) {
  // 移除现有的favicon
  const existingFavicon = document.querySelector('link[rel="icon"]');
  if (existingFavicon) {
    existingFavicon.remove();
  }

  if (!url) {
    // 如果没有提供URL，创建一个闪烁的favicon
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    // 绘制橙黄色圆形
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFA500';
    ctx.fill();

    url = canvas.toDataURL();
  }

  // 创建新的favicon链接
  const link = document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'icon';
  link.href = url;
  document.head.appendChild(link);
} 