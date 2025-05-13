// 从B站页面获取视频标签
function getVideoTags() {
  const tags = [];
  
  // 获取视频详情页面的标签 - 新版B站页面结构
  const newTagElements = document.querySelectorAll('.video-tag-container .ordinary-tag .tag-link');
  if (newTagElements.length > 0) {
    console.log("BTagShield: 发现新版标签结构，共", newTagElements.length, "个标签");
    newTagElements.forEach(tagElement => {
      const tagText = tagElement.textContent.trim();
      if (tagText) {
        tags.push(tagText);
        console.log("BTagShield: 找到标签:", tagText);
      }
    });
    return tags; // 如果找到新版标签就直接返回
  }
  
  // 旧版标签结构兼容
  const tagElements = document.querySelectorAll('.tag-area .tag');
  if (tagElements.length > 0) {
    console.log("BTagShield: 发现旧版标签结构，共", tagElements.length, "个标签");
    tagElements.forEach(tagElement => {
      const tagText = tagElement.textContent.trim();
      if (tagText) {
        tags.push(tagText);
      }
    });
    return tags; // 如果找到旧版标签就直接返回
  }
  
  // 获取番剧页面的标签
  const bangumiTags = document.querySelectorAll('.media-tag .tag-item');
  if (bangumiTags.length > 0) {
    console.log("BTagShield: 发现番剧标签结构");
    bangumiTags.forEach(tagElement => {
      const tagText = tagElement.textContent.trim();
      if (tagText) {
        tags.push(tagText);
      }
    });
    return tags; // 如果找到番剧标签就直接返回
  }
  
  // 如果上述方法都找不到标签，尝试更通用的方法
  const possibleTagContainers = [
    '.tag-container a',
    '.video-data-list .tag-link',
    '.tag-link',
    '.up-video-message-detail .content-tag a'
  ];
  
  for (const selector of possibleTagContainers) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`BTagShield: 使用选择器 "${selector}" 找到标签`);
      elements.forEach(element => {
        const tagText = element.textContent.trim();
        if (tagText) {
          tags.push(tagText);
        }
      });
      if (tags.length > 0) {
        return tags; // 一旦找到标签就返回
      }
    }
  }
  
  console.log("BTagShield: 未找到任何标签");
  return tags;
}

// 监听来自背景脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkVideoTags') {
    const videoTags = getVideoTags();
    sendResponse({ tags: videoTags });
  }
  return true;
});

// 增强版通知系统 - 使用CSS过渡效果
const notification = {
  element: null, // 通知元素的引用
  timeoutId: null, // 用于控制通知超时
    // 创建通知元素（如果不存在）
  create() {
    if (!this.element) {
      // 确保样式已注入
      injectNotificationStyles();
      
      const element = document.createElement('div');
      element.className = 'btagshield-notification';
      
      // 直接设置样式以确保通知显示正常
      element.style.position = 'fixed';
      element.style.top = '20px';
      element.style.left = '50%';
      element.style.transform = 'translateX(-50%)';
      element.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
      element.style.color = 'white';
      element.style.padding = '10px 20px';
      element.style.borderRadius = '6px';
      element.style.zIndex = '9999';
      element.style.fontSize = '14px';
      element.style.maxWidth = '80%';
      element.style.textAlign = 'center';
      element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
      element.style.fontFamily = "'Microsoft YaHei', 'PingFang SC', sans-serif";
      
      // 确保通知不会立即显示
      element.style.opacity = '0';
      element.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
      element.style.display = 'none'; // 初始状态为隐藏
      element.style.willChange = 'opacity, transform'; // 提示浏览器优化渲染
      element.style.pointerEvents = 'none'; // 避免触发鼠标事件
      
      document.body.appendChild(element);
      this.element = element;
    }
    return this.element;
  },// 设置通知内容
  setText(text, noAnimation = false) {
    const element = this.create();
    
    if (noAnimation) {
      // 不使用动画，直接设置内容
      element.textContent = text;
      return;
    }
    
    // 避免同时有多个计时器
    if (this._textChangeTimeout) {
      clearTimeout(this._textChangeTimeout);
      this._textChangeTimeout = null;
    }
    
    // 使用requestAnimationFrame确保DOM操作不会阻塞渲染
    requestAnimationFrame(() => {
      // 使用淡入淡出效果更新文本
      element.style.opacity = '0';
      
      // 等待淡出完成后再更新文本，然后淡入
      this._textChangeTimeout = setTimeout(() => {
        element.textContent = text;
        
        // 淡入新文本
        this._textChangeTimeout = setTimeout(() => {
          element.style.opacity = '1';
          this._textChangeTimeout = null;
        }, 50);
      }, 250); // 确保完全淡出完成
    });
  },
    
  _textChangeTimeout: null, // 存储文本变化的计时器ID
  // 显示通知
  show(force = false) {
    const element = this.create();
    
    // 防止重复显示导致的闪烁
    if (this._isVisible && !force) {
      return;
    }
    
    // 记录显示状态
    this._isVisible = true;
    
    // 确保元素在DOM中
    if (!document.body.contains(element)) {
      document.body.appendChild(element);
    }
    
    // 清除任何先前的超时
    this._clearAllTimeouts();
    
    // 确保样式注入
    injectNotificationStyles();
    
    // 确保通知能够正确显示
    element.style.display = 'block';
    element.style.transform = 'translateX(-50%) translateY(0)';
    
    // 使用 RAF 确保渲染先完成，然后再进行过渡动画
    this._showTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        element.style.opacity = '1';
      });
    }, 30);
  },
  
  // 隐藏通知 - 带有平滑过渡
  hide() {
    if (!this.element || !this._isVisible) return;
    
    // 标记为不可见
    this._isVisible = false;
    
    // 清除任何先前的超时
    this._clearAllTimeouts();
    
    this.element.style.opacity = '0';
    this.element.style.transform = 'translateX(-50%) translateY(-10px)';
    
    // 等待过渡完成后再隐藏元素
    this.timeoutId = setTimeout(() => {
      if (this.element) {
        this.element.style.display = 'none';
      }
      this.timeoutId = null;
    }, 400); // 确保动画完全结束
  },
  
  // 清除所有计时器
  _clearAllTimeouts() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this._textChangeTimeout) {
      clearTimeout(this._textChangeTimeout);
      this._textChangeTimeout = null;
    }
    
    if (this._showTimeout) {
      clearTimeout(this._showTimeout);
      this._showTimeout = null;
    }
  },
  
  // 状态标志
  _isVisible: false,
  _showTimeout: null,
    // 完全移除通知元素
  remove() {
    // 清除所有计时器
    this._clearAllTimeouts();
    
    if (this.element && document.body.contains(this.element)) {
      document.body.removeChild(this.element);
      this.element = null;
      this._isVisible = false;
    }
  }
};

// 检测标签并处理的核心逻辑
function processVideoTags() {
  const videoTags = getVideoTags();
  
  if (videoTags.length > 0) {
    chrome.storage.sync.get(['filterTags', 'isEnabled', 'showNotification'], (data) => {
      const isEnabled = data.isEnabled !== false;
      const showNotification = data.showNotification !== false;
      const filterTags = data.filterTags || [];
      
      if (isEnabled && filterTags.length > 0) {
        console.log("BTagShield: 当前视频标签:", videoTags);
        console.log("BTagShield: 过滤标签:", filterTags);
        
        // 检查是否有匹配的标签
        let hasMatch = false;
        let matchedTag = '';
        let filterTag = '';
        
        for (const videoTag of videoTags) {
          for (const currentFilterTag of filterTags) {
            if (!videoTag || !currentFilterTag) continue;
            
            const videoTagLower = videoTag.toLowerCase().trim();
            const filterTagLower = currentFilterTag.toLowerCase().trim();
            
            // 精确匹配、包含匹配
            if (videoTagLower === filterTagLower || 
                videoTagLower.includes(filterTagLower) || 
                filterTagLower.includes(videoTagLower)) {
              hasMatch = true;
              matchedTag = videoTag;
              filterTag = currentFilterTag;
              console.log(`BTagShield: 匹配成功! 视频标签:"${videoTag}" 匹配过滤标签:"${currentFilterTag}"`);
              break;
            }
          }
          if (hasMatch) break;
        }
          if (hasMatch) {
          // 显示提示（如果启用）
          if (showNotification) {
            // 防止页面返回时出现的闪烁，确保脚本执行完成
            let isReturning = false;            // 防止重复触发
            if (window.BTagShieldReturning) return;
            
            // 立即标记为正在返回，阻止其他代码触发通知
            window.BTagShieldReturning = true;
            isReturning = true;
            
            // 1. 首先删除可能存在的旧通知
            notification.remove();
            
            // 给浏览器一点时间处理DOM
            requestAnimationFrame(() => {
              // 2. 显示"已过滤视频"通知
              notification.setText(`已过滤视频: 发现标签"${matchedTag}"与过滤规则"${filterTag}"匹配`, true);
              notification.show(true);
              
              // 3. 两秒后平滑切换到"正在返回"通知
              let changeTimer = setTimeout(() => {
                notification.setText("正在返回...");
                
                // 4. 1.5秒后返回上一页
                let returnTimer = setTimeout(() => {
                  // 开始淡出通知
                  notification.hide();
                  
                  // 5. 给通知足够的时间完成淡出动画，再返回
                  let backTimer = setTimeout(() => {
                    // 返回上一页 - 使用多种方法确保至少一种能生效
                    try {
                      console.log("BTagShield: 尝试返回上一页");
                      
                      // 方法1: 使用history API
                      window.history.back();
                      
                      // 方法2: 如果5毫秒后仍在同一页面，尝试使用referrer
                      setTimeout(() => {
                        if (document.visibilityState !== 'hidden') {
                          console.log("BTagShield: 方法1失败，尝试方法2");
                          if (document.referrer && document.referrer.includes("bilibili.com")) {
                            window.location.replace(document.referrer);
                          } else {
                            // 方法3: 如果referrer不可用，直接跳转到B站首页
                            window.location.href = "https://www.bilibili.com";
                          }
                        }
                      }, 100);
                    } catch (e) {
                      console.error("BTagShield: 返回出错", e);
                      window.location.href = document.referrer || "https://www.bilibili.com";
                    }
                    
                    // 确保所有定时器都被清除
                    clearTimeout(backTimer);
                  }, 450); // 确保动画完成
                }, 1500); 
                
                // 确保定时器被清除
                window.addEventListener('beforeunload', () => {
                  clearTimeout(returnTimer);
                  clearTimeout(backTimer);
                });
              }, 2500);
              
              // 确保定时器被清除
              window.addEventListener('beforeunload', () => {
                clearTimeout(changeTimer);
              });
            });
          } else {            // 如果不显示通知，静默倒计时2秒后返回
            setTimeout(() => {
              // 设置全局标志，避免页面导航触发的重复检测
              window.BTagShieldReturning = true;
              
              try {
                console.log("BTagShield: 静默模式尝试返回上一页");
                
                // 方法1: 使用history API
                window.history.back();
                
                // 方法2: 如果10毫秒后仍在同一页面，尝试使用referrer
                setTimeout(() => {
                  if (document.visibilityState !== 'hidden') {
                    console.log("BTagShield: 静默模式方法1失败，尝试方法2");
                    if (document.referrer && document.referrer.includes("bilibili.com")) {
                      window.location.replace(document.referrer);
                    } else {
                      // 方法3: 如果referrer不可用，直接跳转到B站首页
                      window.location.href = "https://www.bilibili.com";
                    }
                  }
                }, 100);
              } catch (e) {
                console.error("BTagShield: 静默模式返回出错", e);
                window.location.href = document.referrer || "https://www.bilibili.com";
              }
            }, 2000);
          }
          
          // 记录此次过滤操作
          try {
            chrome.storage.local.get('filteredHistory', (result) => {
              const history = result.filteredHistory || [];
              history.push({
                url: window.location.href,
                title: document.title,
                tag: matchedTag,
                filterTag: filterTag,
                timestamp: new Date().toISOString()
              });
              
              // 最多保存100条历史记录
              if (history.length > 100) {
                history.shift(); // 删除最早的记录
              }
              
              chrome.storage.local.set({ filteredHistory: history });
            });
          } catch (e) {
            console.error("BTagShield: 记录过滤历史失败", e);
          }
        }
      }
    });
  }
}

// 使用MutationObserver监视DOM变化
let observer = null;
let observerDebounceTimer = null;

function startObserving() {
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver((mutations) => {
    // 如果正在返回上一页，不要处理
    if (window.BTagShieldReturning) return;
    
    // 防抖处理，避免短时间内多次触发
    if (observerDebounceTimer) {
      clearTimeout(observerDebounceTimer);
    }
    
    // 延迟执行，让多个连续的DOM变化只触发一次处理
    observerDebounceTimer = setTimeout(() => {
      // 再次检查是否在返回状态
      if (!window.BTagShieldReturning) {
        console.log("BTagShield: DOM变化触发检查");
        throttledProcessVideoTags();
      }
      observerDebounceTimer = null;
    }, 800);
  });
  
  // 使用更精细的选择器和配置，减少不必要的触发
  observer.observe(document.body, { 
    childList: true,
    subtree: true,
    characterData: false,
    attributeFilter: ['class', 'id'], // 只关注可能影响标签的属性变化
  });
}

// 初始化全局状态
window.BTagShieldReturning = false;
window.BTagShieldLastProcessed = 0;

// 确保在实际运行检查前有一个最小间隔，避免重复检查
let throttleTimer = null;

function throttledProcessVideoTags() {
  // 如果正在返回上一页，不要处理
  if (window.BTagShieldReturning) return;
  
  const now = Date.now();
  // 确保至少相隔1.5秒再次处理
  if (now - window.BTagShieldLastProcessed > 1500) {
    // 清除任何未执行的定时器
    if (throttleTimer) {
      clearTimeout(throttleTimer);
    }
    
    // 记录时间戳
    window.BTagShieldLastProcessed = now;
    
    // 执行处理
    processVideoTags();
  } else {
    // 使用防抖，确保只在最后一次调用后执行
    if (throttleTimer) {
      clearTimeout(throttleTimer);
    }
    throttleTimer = setTimeout(() => {
      throttleTimer = null;
      window.BTagShieldLastProcessed = Date.now();
      
      // 再次检查是否在返回状态
      if (!window.BTagShieldReturning) {
        processVideoTags();
      }
    }, 1500);
  }
}

// 初始化 - 多阶段检测
document.addEventListener('DOMContentLoaded', () => {
  console.log("BTagShield: DOMContentLoaded");
  // 重置返回标志
  window.BTagShieldReturning = false;
  // 延时启动，确保页面已准备好
  setTimeout(throttledProcessVideoTags, 500);
});

window.addEventListener('load', () => {
  console.log("BTagShield: window.load");
  
  // 重置返回标志
  window.BTagShieldReturning = false;
  
  setTimeout(throttledProcessVideoTags, 1000);
  setTimeout(startObserving, 1500);
});

// 针对单页应用 - 监听URL变化
let lastUrl = location.href;
new MutationObserver(() => {
  if (lastUrl !== location.href) {
    lastUrl = location.href;
    console.log("BTagShield: URL changed");
    
    // 新URL加载后，重置返回标志
    window.BTagShieldReturning = false;
    
    setTimeout(throttledProcessVideoTags, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// 定时检查 - 以优化的方式进行
const checkInterval = setInterval(() => {
  // 只有当不在返回状态时才进行检查
  if (!window.BTagShieldReturning) {
    throttledProcessVideoTags();
  }
}, 5000);

// 页面卸载前清理
window.addEventListener('beforeunload', () => {
  console.log("BTagShield: 页面卸载，清理资源");
  
  // 清除所有通知相关的状态
  notification.remove();
  
  // 断开观察器
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  // 清除所有计时器
  if (throttleTimer) {
    clearTimeout(throttleTimer);
    throttleTimer = null;
  }
  
  if (observerDebounceTimer) {
    clearTimeout(observerDebounceTimer);
    observerDebounceTimer = null;
  }
  
  // 重置全局状态
  window.BTagShieldReturning = false;
});

// 注入通知样式（避免依赖外部CSS文件，确保通知系统在所有页面都正常工作）
function injectNotificationStyles() {
  // 检查是否已经存在样式
  if (document.getElementById('btagshield-notification-styles')) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'btagshield-notification-styles';
  style.textContent = `
    .btagshield-notification {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      background-color: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 999999;
      font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
      opacity: 0;
      transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
      pointer-events: none;
      font-size: 14px;
      max-width: 80%;
      text-align: center;
      will-change: opacity, transform;
      backface-visibility: hidden; /* 减少闪烁 */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .btagshield-notification.visible {
      opacity: 1;
    }
    
    @media (prefers-color-scheme: dark) {
      .btagshield-notification {
        background-color: rgba(40, 40, 40, 0.9);
        color: #f0f0f0;
      }
    }
  `;
  document.head.appendChild(style);
}

// 页面加载时注入样式
injectNotificationStyles();