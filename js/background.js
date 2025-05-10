// 存储过滤标签的列表
let filterTags = [];
let isEnabled = true;
let showNotification = true;

// 初始化，从存储中加载设置
chrome.storage.sync.get(['filterTags', 'isEnabled', 'showNotification'], (data) => {
  if (data.filterTags) {
    filterTags = data.filterTags;
    console.log("BTagShield: 从存储加载了过滤标签", filterTags);
  }
  if (data.isEnabled !== undefined) {
    isEnabled = data.isEnabled;
    console.log("BTagShield: 过滤功能状态", isEnabled ? "启用" : "禁用");
  }
  if (data.showNotification !== undefined) {
    showNotification = data.showNotification;
  }
});

// 监听标签和设置更新消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTags') {
    filterTags = message.tags;
    chrome.storage.sync.set({ filterTags });
    console.log("BTagShield: 更新过滤标签", filterTags);
    sendResponse({ status: 'success' });
  } else if (message.action === 'updateSettings') {
    if (message.isEnabled !== undefined) {
      isEnabled = message.isEnabled;
      chrome.storage.sync.set({ isEnabled });
      console.log("BTagShield: 更新过滤状态", isEnabled ? "启用" : "禁用");
    }
    if (message.showNotification !== undefined) {
      showNotification = message.showNotification;
      chrome.storage.sync.set({ showNotification });
      console.log("BTagShield: 更新通知设置", showNotification ? "显示" : "隐藏");
    }
    sendResponse({ status: 'success' });
  } else if (message.action === 'getStats') {
    // 获取过滤统计数据
    chrome.storage.local.get('filteredHistory', (result) => {
      const history = result.filteredHistory || [];
      sendResponse({
        totalFiltered: history.length,
        recentFiltered: history.slice(-10) // 最近10条记录
      });
    });
    return true; // 异步响应需要返回true
  }
  return true;
});

// 在标签加载时检查是否需要拦截
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 仅在页面完成加载时处理
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('bilibili.com')) {
    // 检查是否启用过滤
    if (!isEnabled) return;
    
    // 检查是否是视频页面
    if (tab.url.includes('/video/') || tab.url.includes('/bangumi/')) {
      console.log(`BTagShield: 检测到B站视频页面加载 ${tab.url}`);
      
      // 等待一段时间，确保页面内容加载完成
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: 'checkVideoTags' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("BTagShield:", chrome.runtime.lastError);
            return;
          }
          
          if (response && response.tags && response.tags.length > 0) {
            console.log("BTagShield: 获取到视频标签", response.tags);
          } else {
            console.log("BTagShield: 未获取到视频标签");
          }
        });
      }, 1500);
    }
  }
});

// 监听来自popup的标签检查请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkCurrentPageTags') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('bilibili.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'checkVideoTags' }, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: chrome.runtime.lastError.message });
            return;
          }
          
          if (response && response.tags) {
            sendResponse({ tags: response.tags });
          } else {
            sendResponse({ tags: [] });
          }
        });
        return true; // 异步响应需要返回true
      } else {
        sendResponse({ error: '当前页面不是B站' });
      }
    });
    return true;
  }
});