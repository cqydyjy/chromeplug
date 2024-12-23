// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // 响应ping请求
  if (request.action === "ping") {
    sendResponse({ success: true });
    return;
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
      sendResponse({success: true});
    } catch (error) {
      console.error('切换锁定状态失败:', error);
      sendResponse({success: false, error: error.message});
    }
  } else if (request.action === "updateNote") {
    try {
      // 处理备注更新
      updatePageNote(request.note, request.position);
      sendResponse({success: true});
    } catch (error) {
      console.error('更新备注失败:', error);
      sendResponse({success: false, error: error.message});
    }
  }
  
  // 返回true表示会异步发送响应
  return true;
});

// 阻止键盘事件
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

// 页面加载时恢复备注（使用多个事件确保可靠性）
function restoreNote() {
  // 获取当前页面URL
  const url = window.location.href;
  
  // 从storage中获取备注数据
  chrome.storage.local.get([url], function(result) {
    if (result[url]) {
      const noteData = result[url];
      if (noteData.text) {
        // 恢复备注内容和位置
        const noteElement = updatePageNote(noteData.text, noteData.position?.position);
        if (noteElement && noteData.position) {
          // 等待一小段时间后应用位置，确保DOM完全加载
          setTimeout(() => {
            restoreNotePosition(noteElement, noteData.position);
          }, 100);
        }
      }
    }
  });
}

// 使用多个事件监听器确保备注能够恢复
document.addEventListener('DOMContentLoaded', restoreNote);
window.addEventListener('load', restoreNote);

// 如果页面已经加载完成，立即执行恢复
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  restoreNote();
}

// 更新页面备注
function updatePageNote(noteText, position = 'top-right') {
  try {
    // 保存现有备注的位置信息（如果存在）
    const existingNote = document.querySelector('.page-note');
    let existingPosition = null;
    if (existingNote) {
      existingPosition = {
        transform: existingNote.style.transform,
        width: existingNote.style.width,
        height: existingNote.style.height,
        position: existingNote.className.includes('top-right') ? 'top-right' :
                 existingNote.className.includes('top-left') ? 'top-left' :
                 existingNote.className.includes('bottom-right') ? 'bottom-right' :
                 existingNote.className.includes('bottom-left') ? 'bottom-left' :
                 position
      };
      existingNote.remove();
    }

    // 如果备注为空，则不显示
    if (!noteText.trim()) {
      return;
    }

    // 创建新的备注元素
    const noteElement = document.createElement('div');
    noteElement.className = `page-note ${position || 'top-right'}`;
    
    // 添加工具栏
    const toolbar = document.createElement('div');
    toolbar.className = 'note-toolbar';
    
    // 添加内容区域
    const content = document.createElement('div');
    content.className = 'note-content';
    content.textContent = noteText;
    
    // 添加四个调整手柄
    const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    handles.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${position}`;
      noteElement.appendChild(handle);
    });
    
    // 组装备注元素
    noteElement.appendChild(toolbar);
    noteElement.appendChild(content);
    
    // 添加到页面
    document.body.appendChild(noteElement);

    // 如果存在之前的位置信息，则使用它
    if (existingPosition) {
      if (existingPosition.transform) noteElement.style.transform = existingPosition.transform;
      if (existingPosition.width) noteElement.style.width = existingPosition.width;
      if (existingPosition.height) noteElement.style.height = existingPosition.height;
      position = existingPosition.position; // 更新position以便保存
    } else {
      // 使用默认位置
      const defaultPositions = {
        'top-right': { top: '20px', right: '20px' },
        'top-left': { top: '20px', left: '20px' },
        'bottom-right': { bottom: '20px', right: '20px' },
        'bottom-left': { bottom: '20px', left: '20px' }
      };

      const defaultPos = defaultPositions[position || 'top-right'];
      Object.assign(noteElement.style, defaultPos);
    }

    // 初始化拖动和调整大小功能
    initNoteDrag(noteElement);
    initNoteResize(noteElement);
    
    // 保存备注内容和位置
    saveNote(noteText, position, noteElement);

    // 初始化大小监听
    observeNoteResize(noteElement);

    return noteElement;
  } catch (error) {
    console.error('创建备注元素失败:', error);
    throw error;
  }
}

// 保存备注内容和位置
function saveNote(noteText, position, noteElement) {
  const noteData = {
    text: noteText,
    position: {
      transform: noteElement.style.transform,
      width: noteElement.style.width,
      height: noteElement.style.height,
      position: position
    }
  };
  
  // 获取当前页面URL
  const url = window.location.href;
  
  // 保存到storage
  chrome.storage.local.set({ [url]: noteData }, function() {
    console.log('备注已保存:', noteData);
  });
}

// 保存备注位置（仅更新位置信息）
function saveNotePosition(noteElement) {
  // 获取当前页面URL
  const url = window.location.href;
  
  // 从storage中获取现有数据
  chrome.storage.local.get([url], function(result) {
    const data = result[url] || {};
    data.position = {
      transform: noteElement.style.transform,
      width: noteElement.style.width,
      height: noteElement.style.height,
      position: data.position?.position || 'top-right'
    };
    
    // 保存更新后的数据
    chrome.storage.local.set({ [url]: data });
  });
}

// 初始化备注拖动功能
function initNoteDrag(noteElement) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  // 鼠标按下事件
  noteElement.addEventListener('mousedown', dragStart);
  // 鼠标移动事件
  document.addEventListener('mousemove', drag);
  // 鼠标释放事件
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    // 如果是调整大小的区域，不启动拖动
    if (e.target !== noteElement && e.target.className !== 'note-content') {
      return;
    }

    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === noteElement || e.target.className === 'note-content') {
      isDragging = true;
      noteElement.classList.add('dragging');
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, noteElement);
    }
  }

  function dragEnd(e) {
    if (isDragging) {
      initialX = currentX;
      initialY = currentY;

      isDragging = false;
      noteElement.classList.remove('dragging');
      
      // 保存新位置
      saveNotePosition(noteElement);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }
}

// 恢复备注位置
function restoreNotePosition(noteElement, position) {
  try {
    if (position) {
      // 应用保存的样式
      if (position.transform) noteElement.style.transform = position.transform;
      if (position.width) noteElement.style.width = position.width;
      if (position.height) noteElement.style.height = position.height;
      
      // 如果没有transform，则应用默认位置
      if (!position.transform) {
        const defaultPositions = {
          'top-right': { top: '20px', right: '20px' },
          'top-left': { top: '20px', left: '20px' },
          'bottom-right': { bottom: '20px', right: '20px' },
          'bottom-left': { bottom: '20px', left: '20px' }
        };
        
        const defaultPos = defaultPositions[position.position || 'top-right'];
        Object.assign(noteElement.style, defaultPos);
      }
      
      // 确保备注在视口内
      ensureNoteInViewport(noteElement);
    }
  } catch (error) {
    console.error('恢复备注位置失败:', error);
  }
}

// 确保备注在视口内
function ensureNoteInViewport(noteElement) {
  const rect = noteElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 获取当前transform值
  const transform = noteElement.style.transform;
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
  noteElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  
  // 保存新位置
  saveNotePosition(noteElement);
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