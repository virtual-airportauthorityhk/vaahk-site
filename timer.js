// 实时时钟功能
function updateClock() {
    const now = new Date();

    // 格式化时间
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    // 格式化日期
    const dateOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short'
    };

    const currentTime = now.toLocaleTimeString('zh-CN', timeOptions);
    const currentDate = now.toLocaleDateString('zh-CN', dateOptions);

    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    
    if (timeElement) {
        timeElement.textContent = currentTime;
    }
    if (dateElement) {
        dateElement.textContent = currentDate;
    }
}

// 初始化时钟
updateClock();
setInterval(updateClock, 1000);