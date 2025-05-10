// 全局变量，存储过滤标签
let filterTags = [];
let isEnabled = true;
let isDarkMode = false;
let showNotification = true; 

// 标签管理相关变量
let currentPage = 1;
let tagsPerPage = 15; // 每页显示的标签数量
let filteredTags = [];
let currentSortMethod = 'newest'; // 默认按最新添加排序

// DOM元素
let tagInput, addTagBtn, tagList, tagSearch, tagSort, tagCount;
let prevPageBtn, nextPageBtn, pageInfo;
let exportTagsBtn, importTagsBtn, clearTagsBtn, importFile;
let enableFilter, showNotificationToggle, saveBtn, status, themeToggle;

// 初始化DOM元素引用
function initDOMElements() {
  console.log("初始化DOM元素...");
  tagInput = document.getElementById('tag-input');
  addTagBtn = document.getElementById('add-tag-btn');
  tagList = document.getElementById('tag-list');
  tagSearch = document.getElementById('tag-search');
  tagSort = document.getElementById('tag-sort');
  tagCount = document.getElementById('tag-count');
  prevPageBtn = document.getElementById('prev-page');
  nextPageBtn = document.getElementById('next-page');  pageInfo = document.getElementById('page-info');
  exportTagsBtn = document.getElementById('export-tags');
  importTagsBtn = document.getElementById('import-tags');
  clearTagsBtn = document.getElementById('clear-tags');
  importFile = document.getElementById('import-file');
  enableFilter = document.getElementById('enable-filter');
  showNotificationToggle = document.getElementById('show-notification');
  saveBtn = document.getElementById('save-btn');
  status = document.getElementById('status');
  themeToggle = document.getElementById('theme-toggle');
  
  // 检查分页按钮是否正确获取
  console.log("分页按钮:", prevPageBtn, nextPageBtn);
}

// 初始化，从存储中加载设置
function loadSettings() {
  chrome.storage.sync.get(['filterTags', 'isEnabled', 'isDarkMode', 'showNotification'], (data) => {
    if (data.filterTags) {
      filterTags = data.filterTags;
      filteredTags = [...filterTags]; // 初始化过滤后的标签列表
      updateTagCount();
      applyTagFilters();
    }
    
    if (data.isEnabled !== undefined) {
      isEnabled = data.isEnabled;
      enableFilter.checked = isEnabled;
    }
    
    if (data.isDarkMode !== undefined) {
      isDarkMode = data.isDarkMode;
      themeToggle.checked = isDarkMode;
      applyTheme();
    }
    
    if (data.showNotification !== undefined) {
      showNotification = data.showNotification;
      showNotificationToggle.checked = showNotification;
    }
    
    console.log("设置加载完成:", {filterTags, isEnabled, isDarkMode, showNotification});
  });
}

// 应用主题
function applyTheme() {
  if (isDarkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

// 切换主题
function toggleTheme() {
  isDarkMode = themeToggle.checked;
  applyTheme();
  
  // 保存主题设置
  chrome.storage.sync.set({ isDarkMode });
}

// 标签总数更新
function updateTagCount() {
  tagCount.textContent = filterTags.length;
}

// 应用标签过滤、排序和分页
function applyTagFilters() {
  // 1. 过滤
  const searchTerm = tagSearch.value.trim().toLowerCase();
  if (searchTerm) {
    filteredTags = filterTags.filter(tag => 
      tag.toLowerCase().includes(searchTerm)
    );
  } else {
    filteredTags = [...filterTags];
  }
  
  // 2. 排序
  sortTags();
  
  // 3. 更新分页信息
  updatePaginationInfo();
  
  // 4. 渲染标签
  renderTags();
}

// 排序标签
function sortTags() {
  switch (currentSortMethod) {
    case 'newest':
      // 不需要排序，默认就是最新添加在最前
      break;
    case 'oldest':
      filteredTags = [...filteredTags].reverse();
      break;
    case 'az':
      filteredTags.sort((a, b) => a.localeCompare(b, 'zh-CN'));
      break;
    case 'za':
      filteredTags.sort((a, b) => b.localeCompare(a, 'zh-CN'));
      break;
    case 'length':
      filteredTags.sort((a, b) => a.length - b.length);
      break;
  }
}

// 更新分页信息
function updatePaginationInfo() {
  const totalPages = Math.max(1, Math.ceil(filteredTags.length / tagsPerPage));
  
  // 确保当前页面有效
  if (currentPage > totalPages) {
    currentPage = totalPages;
  } else if (currentPage < 1) {
    currentPage = 1;
  }
  
  // 更新分页按钮状态和文本
  if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
  
  if (pageInfo) pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
  
  // 调试输出
  console.log(`分页信息: 当前页=${currentPage}, 总页数=${totalPages}, 每页标签数=${tagsPerPage}, 总标签数=${filteredTags.length}`);
}

// 获取当前页的标签
function getCurrentPageTags() {
  const startIndex = (currentPage - 1) * tagsPerPage;
  const endIndex = startIndex + tagsPerPage;
  return filteredTags.slice(startIndex, endIndex);
}

// 渲染标签列表
function renderTags() {
  if (!tagList) return;
  
  tagList.innerHTML = '';
  
  const currentPageTags = getCurrentPageTags();
  
  if (currentPageTags.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.textContent = filteredTags.length === 0 ? '暂无过滤标签，请添加' : '没有匹配的标签';
    emptyMessage.style.color = '#888';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.padding = '10px';
    emptyMessage.style.fontStyle = 'italic';
    tagList.appendChild(emptyMessage);
    return;
  }
  
  currentPageTags.forEach((tag) => {
    const tagItem = document.createElement('div');
    tagItem.className = 'tag-item';
    
    const tagText = document.createElement('div');
    tagText.className = 'tag-text';
    tagText.textContent = tag;
    
    const removeBtn = document.createElement('div');
    removeBtn.className = 'remove-tag';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => removeTag(tag));
    
    tagItem.appendChild(tagText);
    tagItem.appendChild(removeBtn);
    tagList.appendChild(tagItem);
  });
}

// 添加标签
function addTag() {
  const tag = tagInput.value.trim();
  
  if (!tag) {
    showStatus('请输入有效的标签', 'error');
    return;
  }
  
  // 检查是否已存在
  if (filterTags.includes(tag)) {
    showStatus('此标签已存在', 'error');
    return;
  }
  
  // 添加到列表头部，保持最新的在前面
  filterTags.unshift(tag);
  tagInput.value = '';
  
  // 重新应用过滤和排序
  updateTagCount();
  applyTagFilters();
  showStatus('标签已添加');
}

// 删除标签
function removeTag(tag) {
  const index = filterTags.indexOf(tag);
  if (index !== -1) {
    filterTags.splice(index, 1);
    
    updateTagCount();
    applyTagFilters();
    showStatus('标签已删除');
  }
}

// 导出标签
function exportTags() {
  if (filterTags.length === 0) {
    showStatus('没有标签可导出', 'error');
    return;
  }
  
  const dataStr = JSON.stringify({
    tags: filterTags,
    exportDate: new Date().toISOString(),
    version: '1.0'
  });
  
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `btagshield_tags_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showStatus('标签已导出');
}

// 导入标签
function importTags() {
  importFile.click();
}

// 清空所有标签
function clearAllTags() {
  if (filterTags.length === 0) {
    showStatus('没有标签可清空', 'error');
    return;
  }
  
  // 显示确认对话框
  if (confirm('确定要清空全部标签吗？此操作不可恢复！')) {
    filterTags = [];
    filteredTags = [];
    currentPage = 1;
    updateTagCount();
    applyTagFilters();
    showStatus('已清空所有标签');
  }
}

// 处理导入文件
function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      
      if (!data.tags || !Array.isArray(data.tags)) {
        throw new Error('无效的标签数据');
      }
      
      // 合并标签，去重
      const newTags = data.tags.filter(tag => !filterTags.includes(tag));
      if (newTags.length === 0) {
        showStatus('没有新的标签可导入', 'error');
        return;
      }
      
      // 添加新标签到列表前部
      filterTags = [...newTags, ...filterTags];
      
      updateTagCount();
      applyTagFilters();
      showStatus(`成功导入 ${newTags.length} 个新标签`);
      
    } catch (error) {
      console.error('导入失败', error);
      showStatus('导入失败：无效的文件格式', 'error');
    }
    
    // 重置文件输入
    importFile.value = '';
  };
  
  reader.readAsText(file);
}

// 保存设置
function saveSettings() {
  isEnabled = enableFilter.checked;
  showNotification = showNotificationToggle.checked;
  
  chrome.storage.sync.set(
    { 
      filterTags: filterTags,
      isEnabled: isEnabled,
      isDarkMode: isDarkMode,
      showNotification: showNotification
    }, 
    () => {
      showStatus('设置已保存');
      
      // 通知后台脚本更新设置
      chrome.runtime.sendMessage(
        { 
          action: 'updateTags',
          tags: filterTags
        }
      );
      
      chrome.runtime.sendMessage(
        {
          action: 'updateSettings',
          isEnabled: isEnabled,
          showNotification: showNotification
        }
      );
    }
  );
}

// 显示状态信息
function showStatus(message, type = 'success') {
  status.textContent = message;
  status.style.color = type === 'error' ? (isDarkMode ? '#ff4343' : '#e81123') : '#0078d7';
  
  // 3秒后清除状态
  setTimeout(() => {
    status.textContent = '';
  }, 3000);
}

// 页面切换
function goToPage(direction) {
  console.log(`尝试${direction === 'prev' ? '上一页' : '下一页'}, 当前页=${currentPage}, 总页数=${Math.ceil(filteredTags.length / tagsPerPage)}`);
  
  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(filteredTags.length / tagsPerPage));
  
  if (direction === 'prev' && currentPage > 1) {
    currentPage--;
    console.log(`成功翻到上一页: ${currentPage}`);
  } else if (direction === 'next' && currentPage < totalPages) {
    currentPage++;
    console.log(`成功翻到下一页: ${currentPage}`);
  } else {
    console.log(`无法翻页: 当前页=${currentPage}, 方向=${direction}, 总页数=${totalPages}`);
    return; // 如果无法翻页，直接返回
  }
  
  // 更新UI
  updatePaginationInfo();
  renderTags();
}

// 绑定事件处理函数
function bindEventHandlers() {
  // 标签添加事件
  addTagBtn.addEventListener('click', addTag);
  tagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTag();
    }
  });

  // 搜索和排序事件
  tagSearch.addEventListener('input', () => {
    currentPage = 1; // 搜索时重置到第一页
    applyTagFilters();
  });

  tagSort.addEventListener('change', () => {
    currentSortMethod = tagSort.value;
    applyTagFilters();
  });

  // 分页按钮事件
  prevPageBtn.addEventListener('click', () => {
    console.log("点击上一页按钮");
    goToPage('prev');
  });

  nextPageBtn.addEventListener('click', () => {
    console.log("点击下一页按钮");
    goToPage('next');
  });
  // 导入导出按钮事件
  exportTagsBtn.addEventListener('click', exportTags);
  importTagsBtn.addEventListener('click', importTags);
  clearTagsBtn.addEventListener('click', clearAllTags);
  importFile.addEventListener('change', handleImport);

  // 设置按钮事件
  saveBtn.addEventListener('click', saveSettings);
  themeToggle.addEventListener('change', toggleTheme);
  
  console.log("所有事件处理函数已绑定");
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM内容加载完成，开始初始化...");
  initDOMElements();
  bindEventHandlers();
  loadSettings();
});