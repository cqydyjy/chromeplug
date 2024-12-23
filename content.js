// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "toggleLock") {
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
  }
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