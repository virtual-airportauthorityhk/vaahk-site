// 香港国际机场实时METAR和TAF数据获取
class WeatherService {
    constructor() {
        this.metarAPI = 'https://aviationweather.gov/api/data/metar?ids=VHHH&format=raw';
        this.tafAPI = 'https://aviationweather.gov/api/data/taf?ids=VHHH&format=raw';
        this.currentDisplay = 'metar';
        this.refreshInterval = 300000; 
        this.intervalId = null;
        this.metarInfo = null;
        this.tafInfo = null;
    }

    // 初始化天气服务
    async init() {
        await this.loadWeatherData();
        this.startAutoRefresh();
        this.setupEventListeners();
    }

    // 设置事件监听器
    setupEventListeners() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const refreshBtn = document.getElementById('weather-refresh-btn');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadWeatherData());
        }
    }

    // 切换标签页
    switchTab(tab) {
        this.currentDisplay = tab;
        
        // 更新按钮状态
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });

        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-content`);
        });

        this.updateDisplay();
    }

    // 开始自动刷新
    startAutoRefresh() {
        this.stopAutoRefresh();
        this.intervalId = setInterval(() => {
            this.loadWeatherData();
        }, this.refreshInterval);
    }

    // 停止自动刷新
    stopAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    // 加载天气数据
    async loadWeatherData() {
        this.showLoading();
        
        try {
            const [metarData, tafData] = await Promise.all([
                this.fetchWithRetry(this.metarAPI),
                this.fetchWithRetry(this.tafAPI)
            ]);

            this.processData(metarData, tafData);
            this.updateDisplay();
            this.updateLastUpdated();
        } catch (error) {
            console.error('获取天气数据失败:', error);
            this.showError('获取天气数据失败，请稍后重试或检查网络连接');
        }
    }

    // 带重试的获取函数
    async fetchWithRetry(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                return await this.fetchData(url);
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    // 获取数据
    async fetchData(url) {
        // 使用CORS代理绕过限制
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
        
        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        // 处理API返回的原始文本数据
        if (text.trim() === '') {
            throw new Error('API返回空数据');
        }
        
        // AviationWeather API返回的是原始文本，不是JSON
        return text.trim();
    }

    // 处理数据
    processData(metarData, tafData) {
        // 处理METAR数据
        if (metarData && metarData !== '') {
            this.metarInfo = this.processMetarData(metarData);
        } else {
            this.metarInfo = null;
        }

        // 处理TAF数据
        if (tafData && tafData !== '') {
            this.tafInfo = this.processTafData(tafData);
        } else {
            this.tafInfo = null;
        }
    }

    // 处理METAR数据
    processMetarData(rawData) {
        const now = new Date();
        return {
            icaoId: 'VHHH',
            rawOb: rawData,
            reportTime: this.formatTime(now),
            receiptTime: this.formatTime(now),
            // 从原始METAR中提取基本信息
            station: rawData.split(' ')[0] || 'VHHH',
            time: this.extractTimeFromMetar(rawData)
        };
    }

    // 处理TAF数据
    processTafData(rawData) {
        const now = new Date();
        return {
            icaoId: 'VHHH',
            rawTAF: rawData,
            issueTime: this.formatTime(now),
            validTimeFrom: this.extractValidTimeFromTaf(rawData, 'from'),
            validTimeTo: this.extractValidTimeFromTaf(rawData, 'to')
        };
    }

    // 从METAR中提取时间
    extractTimeFromMetar(metar) {
        const timeMatch = metar.match(/(\d{6})Z/);
        if (timeMatch) {
            const timeStr = timeMatch[1]; // DDhhmm
            const day = timeStr.substring(0, 2);
            const hour = timeStr.substring(2, 4);
            const minute = timeStr.substring(4, 6);
            
            const now = new Date();
            const reportDate = new Date(now.getFullYear(), now.getMonth(), parseInt(day), parseInt(hour), parseInt(minute));
            
            return this.formatTime(reportDate);
        }
        return this.formatTime(new Date());
    }

    // 从TAF中提取有效时间
    extractValidTimeFromTaf(taf, type) {
        const timeMatch = taf.match(/(\d{4})\/(\d{4})/);
        if (timeMatch) {
            const from = timeMatch[1]; // DDhh
            const to = timeMatch[2];   // DDhh
            
            const now = new Date();
            let fromDate, toDate;
            
            if (type === 'from') {
                const day = from.substring(0, 2);
                const hour = from.substring(2, 4);
                fromDate = new Date(now.getFullYear(), now.getMonth(), parseInt(day), parseInt(hour));
                return this.formatTime(fromDate);
            } else {
                const day = to.substring(0, 2);
                const hour = to.substring(2, 4);
                toDate = new Date(now.getFullYear(), now.getMonth(), parseInt(day), parseInt(hour));
                return this.formatTime(toDate);
            }
        }
        return this.formatTime(new Date());
    }

    // 格式化时间
    formatTime(date) {
        if (!date || isNaN(date.getTime())) return 'N/A';
        
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
    }

    // 更新显示
    updateDisplay() {
        if (this.currentDisplay === 'metar') {
            this.updateMetarDisplay();
        } else {
            this.updateTafDisplay();
        }
    }

    // 更新METAR显示
    updateMetarDisplay() {
        const contentDiv = document.getElementById('metar-content');
        if (!contentDiv) return;

        if (!this.metarInfo) {
            contentDiv.innerHTML = this.getErrorHTML('暂无METAR数据');
            return;
        }

        contentDiv.innerHTML = `
            <div class="weather-data">
                <div class="weather-raw">
                    <h4>原始报文：</h4>
                    <div class="weather-raw-text">${this.metarInfo.rawOb}</div>
                </div>
                <div class="weather-details">
                    <div class="result-item">
                        <strong>机场</strong>: ${this.metarInfo.station}
                    </div>
                    <div class="result-item">
                        <strong>观测时间</strong>: ${this.metarInfo.time}
                    </div>
                    <div class="result-item">
                        <strong>报告时间</strong>: ${this.metarInfo.reportTime}
                    </div>
                    <div class="text-center" style="margin-top: 20px;">
                        <button class="btn" onclick="decodeRawMETAR()">解码此METAR</button>
                    </div>
                </div>
            </div>
        `;
    }

    // 更新TAF显示
    updateTafDisplay() {
        const contentDiv = document.getElementById('taf-content');
        if (!contentDiv) return;

        if (!this.tafInfo) {
            contentDiv.innerHTML = this.getErrorHTML('暂无TAF数据');
            return;
        }

        contentDiv.innerHTML = `
            <div class="weather-data">
                <div class="weather-raw">
                    <h4>原始报文：</h4>
                    <div class="weather-raw-text">${this.tafInfo.rawTAF}</div>
                </div>
                <div class="weather-details">
                    <div class="result-item">
                        <strong>机场</strong>: ${this.tafInfo.icaoId}
                    </div>
                    <div class="result-item">
                        <strong>发布时间</strong>: ${this.tafInfo.issueTime}
                    </div>
                    <div class="result-item">
                        <strong>有效期从</strong>: ${this.tafInfo.validTimeFrom}
                    </div>
                    <div class="result-item">
                        <strong>有效期至</strong>: ${this.tafInfo.validTimeTo}
                    </div>
                    <div class="text-center" style="margin-top: 20px;">
                        <button class="btn" onclick="decodeRawTAF()">解码此TAF</button>
                    </div>
                </div>
            </div>
        `;
    }

    // 显示加载状态
    showLoading() {
        const activeContent = document.querySelector('.tab-content.active');
        if (activeContent) {
            activeContent.innerHTML = `
                <div class="weather-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>正在获取天气数据...</p>
                </div>
            `;
        }
    }

    // 显示错误信息
    showError(message) {
        const activeContent = document.querySelector('.tab-content.active');
        if (activeContent) {
            activeContent.innerHTML = this.getErrorHTML(message);
        }
    }

    // 获取错误HTML
    getErrorHTML(message) {
        return `
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button class="btn" onclick="weatherService.loadWeatherData()" style="margin-top: 15px;">重试</button>
            </div>
        `;
    }

    // 更新最后更新时间
    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('weather-last-updated');
        if (lastUpdatedElement) {
            const now = new Date();
            lastUpdatedElement.textContent = `最后更新: ${this.formatTime(now)}`;
        }
    }

    // 销毁服务
    destroy() {
        this.stopAutoRefresh();
    }
}

// 全局函数 - 解码当前显示的METAR
function decodeRawMETAR() {
    const rawText = weatherService.metarInfo?.rawOb;
    if (rawText) {
        document.getElementById('metar-input').value = rawText;
        decodeMETAR();
        // 滚动到解码器位置
        document.getElementById('metar').scrollIntoView({ behavior: 'smooth' });
    }
}

// 全局函数 - 解码当前显示的TAF
function decodeRawTAF() {
    const rawText = weatherService.tafInfo?.rawTAF;
    if (rawText) {
        document.getElementById('taf-input').value = rawText;
        decodeTAF();
        // 滚动到解码器位置
        document.getElementById('taf').scrollIntoView({ behavior: 'smooth' });
    }
}

// 全局变量
let weatherService = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在service-center页面
    if (document.getElementById('weather-widget')) {
        weatherService = new WeatherService();
        weatherService.init();
    }
});

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    if (weatherService) {
        weatherService.destroy();
    }
});
