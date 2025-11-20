// 404错误处理和页面跳转功能
class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        // 检查页面是否正常加载
        this.checkPageStatus();
        
        // 监听所有链接点击，捕获可能的404
        this.monitorLinkClicks();
        
        // 监听图片加载错误
        this.monitorImageErrors();
        
        // 监听脚本加载错误
        this.monitorScriptErrors();
    }

    // 检查页面状态
    checkPageStatus() {
        // 如果当前页面本身就是404页面，不需要处理
        if (this.is404Page()) {
            this.showOriginalPageInfo();
            return;
        }

        // 检查是否有404状态码（通过检查页面内容）
        if (this.isLikely404()) {
            this.redirectTo404();
        }
    }

    // 判断是否是404页面
    is404Page() {
        return window.location.pathname.includes('404.html') || 
               window.location.pathname.includes('404') ||
               document.title.includes('404');
    }

    // 判断页面是否可能是404
    isLikely404() {
        // 检查页面内容是否包含404相关关键词
        const pageText = document.body.innerText.toLowerCase();
        const has404Keywords = pageText.includes('404') || 
                               pageText.includes('not found') || 
                               pageText.includes('页面不存在') ||
                               pageText.includes('无法找到');

        // 检查页面是否内容过少（可能是空页面）
        const hasMinimalContent = document.body.innerText.trim().length < 100;

        // 检查是否有主要内容结构
        const hasMainContent = document.querySelector('main, .main, #main, .content, .container') !== null;

        return has404Keywords || (hasMinimalContent && !hasMainContent);
    }

    // 重定向到404页面
    redirectTo404() {
        // 保存原始URL信息
        sessionStorage.setItem('originalUrl', window.location.href);
        sessionStorage.setItem('referrer', document.referrer);
        sessionStorage.setItem('timestamp', Date.now().toString());

        // 重定向到404页面
        window.location.href = '/404.html';
    }

    // 显示原始页面信息（在404页面中使用）
    showOriginalPageInfo() {
        const originalUrl = sessionStorage.getItem('originalUrl');
        const referrer = sessionStorage.getItem('referrer');
        const timestamp = sessionStorage.getItem('timestamp');

        if (originalUrl) {
            const messageElement = document.querySelector('.message');
            if (messageElement) {
                // 尝试美化URL显示
                const displayUrl = this.beautifyUrl(originalUrl);
                messageElement.innerHTML = `您尝试访问的页面 <strong>${displayUrl}</strong> 不存在或已被删除。`;
                
                // 如果有来源页面，添加返回链接
                if (referrer && referrer !== window.location.href) {
                    const backLink = document.createElement('div');
                    backLink.style.marginTop = '20px';
                    backLink.innerHTML = `<a href="${referrer}" class="back-link">← 返回上一页</a>`;
                    messageElement.parentNode.insertBefore(backLink, messageElement.nextSibling);
                }
            }
        }

        // 清除存储的信息
        sessionStorage.removeItem('originalUrl');
        sessionStorage.removeItem('referrer');
        sessionStorage.removeItem('timestamp');
    }

    // 美化URL显示
    beautifyUrl(url) {
        try {
            const urlObj = new URL(url);
            // 如果是当前域名，只显示路径
            if (urlObj.hostname === window.location.hostname) {
                return urlObj.pathname + urlObj.search;
            }
            // 否则显示完整URL但移除协议
            return url.replace(/^https?:\/\//, '');
        } catch (e) {
            return url;
        }
    }

    // 监听链接点击
    monitorLinkClicks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                // 检查链接是否指向不存在的页面
                this.checkLinkValidity(link.href);
            }
        });
    }

    // 检查链接有效性
    async checkLinkValidity(href) {
        try {
            // 只检查同域名的链接
            const linkUrl = new URL(href);
            if (linkUrl.hostname !== window.location.hostname) {
                return;
            }

            // 使用fetch检查页面是否存在
            const response = await fetch(href, { 
                method: 'HEAD',
                mode: 'no-cors' // 避免CORS问题
            });

            // 由于no-cors模式，我们无法准确判断状态码
            // 所以这里主要依赖客户端检测
        } catch (error) {
            console.log('链接检查失败:', error);
        }
    }

    // 监听图片加载错误
    monitorImageErrors() {
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                console.warn('图片加载失败:', e.target.src);
                // 可以在这里添加图片错误处理逻辑
            }
        }, true);
    }

    // 监听脚本加载错误
    monitorScriptErrors() {
        window.addEventListener('error', (e) => {
            if (e.target.tagName === 'SCRIPT') {
                console.warn('脚本加载失败:', e.target.src);
                // 可以在这里添加脚本错误处理逻辑
            }
        }, true);
    }

    // 手动触发404重定向（供其他脚本调用）
    static trigger404() {
        const handler = new ErrorHandler();
        handler.redirectTo404();
    }

    // 检查特定URL是否存在（供其他脚本调用）
    static async checkUrlExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// 自动初始化错误处理器
document.addEventListener('DOMContentLoaded', () => {
    new ErrorHandler();
});

// 导出供全局使用
window.ErrorHandler = ErrorHandler;
window.handle404Error = () => ErrorHandler.trigger404();