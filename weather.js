class WeatherService {
    constructor() {
        const basePath = window.location.origin;
        this.metarAPI = `${basePath}/api/weather?type=metar`;
        this.tafAPI = `${basePath}/api/weather?type=taf`;
        this.station = 'VHHH'; // 香港国际机场
        this.stationName = '香港国际机场';
        this.currentDisplay = 'metar';
        this.refreshInterval = 300000; // 5分钟
        this.intervalId = null;
        this.metarInfo = null;
        this.tafInfo = null;
        
        console.log(`WeatherService initialized for ${this.stationName} (${this.station})`);
    }

    // 初始化天气服务
    async init() {
        console.log(`Initializing WeatherService for ${this.stationName}...`);
        await this.loadWeatherData();
        this.startAutoRefresh();
        this.setupEventListeners();
    }

    // 设置事件监听器
    setupEventListeners() {
        const tabButtons = document.querySelectorAll('.tab-button');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // 添加手动刷新按钮事件
        const refreshBtn = document.getElementById('weather-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadWeatherData());
        }
    }

    // 切换标签页
    switchTab(tab) {
        this.currentDisplay = tab;
        
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });

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
            console.log(`Loading weather data for ${this.stationName}...`);
            const [metarData, tafData] = await Promise.all([
                this.fetchWithRetry(this.metarAPI),
                this.fetchWithRetry(this.tafAPI)
            ]);

            // 验证数据包含正确的机场代码
            if (metarData && !metarData.includes(this.station)) {
                throw new Error(`METAR数据不包含机场代码 ${this.station}`);
            }
            if (tafData && !tafData.includes(this.station)) {
                throw new Error(`TAF数据不包含机场代码 ${this.station}`);
            }

            this.processData(metarData, tafData);
            this.updateDisplay();
            this.updateLastUpdated();
            console.log(`Weather data loaded successfully for ${this.station}`);
        } catch (error) {
            console.error(`获取${this.stationName}天气数据失败:`, error);
            this.showError(`获取${this.stationName}天气数据失败: ${error.message}`);
        }
    }

    // 带重试的获取函数
    async fetchWithRetry(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`尝试获取数据 (${i + 1}/${retries}):`, url);
                return await this.fetchData(url);
            } catch (error) {
                console.warn(`请求失败 (${i + 1}/${retries}):`, error.message);
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    // 获取数据
    async fetchData(url) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain',
            }
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        
        if (text.trim() === '') {
            throw new Error('API返回空数据');
        }
        
        // 检查是否是错误JSON响应
        if (text.startsWith('{') && text.includes('error')) {
            try {
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || 'API返回错误');
            } catch (e) {
                // 不是JSON，继续处理
            }
        }
        
        return text.trim();
    }

    // 处理数据
    processData(metarData, tafData) {
        console.log('Processing weather data for', this.station);
        
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
            icaoId: this.station,
            stationName: this.stationName,
            rawOb: rawData,
            reportTime: this.formatTime(now),
            receiptTime: this.formatTime(now),
            station: rawData.split(' ')[0] || this.station,
            time: this.extractTimeFromMetar(rawData)
        };
    }

    // 处理TAF数据
    processTafData(rawData) {
        const now = new Date();
        return {
            icaoId: this.station,
            stationName: this.stationName,
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
            const timeStr = timeMatch[1];
            const day = timeStr.substring(0, 2);
            const hour = timeStr.substring(2, 4);
            const minute = timeStr.substring(4, 6);
            
            const now = new Date();
            const reportDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), parseInt(day), parseInt(hour), parseInt(minute));
            
            return this.formatTime(reportDate);
        }
        return this.formatTime(new Date());
    }

    // 从TAF中提取有效时间
    extractValidTimeFromTaf(taf, type) {
        const timeMatch = taf.match(/(\d{4})\/(\d{4})/);
        if (timeMatch) {
            const from = timeMatch[1];
            const to = timeMatch[2];
            
            const now = new Date();
            
            if (type === 'from') {
                const day = from.substring(0, 2);
                const hour = from.substring(2, 4);
                const fromDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), parseInt(day), parseInt(hour));
                return this.formatTime(fromDate);
            } else {
                const day = to.substring(0, 2);
                const hour = to.substring(2, 4);
                const toDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), parseInt(day), parseInt(hour));
                if (toDate < now) {
                    toDate.setMonth(toDate.getMonth() + 1);
                }
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
            contentDiv.innerHTML = this.getErrorHTML(`暂无${this.stationName}的METAR数据`);
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
                        <strong>机场</strong>: ${this.stationName} (${this.metarInfo.station})
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
            contentDiv.innerHTML = this.getErrorHTML(`暂无${this.stationName}的TAF数据`);
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
                        <strong>机场</strong>: ${this.stationName} (${this.tafInfo.icaoId})
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
                    <p>正在获取${this.stationName}天气数据...</p>
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
                <div style="margin-top: 15px;">
                    <button class="btn" onclick="weatherService.loadWeatherData()">重试</button>
                    <button class="btn btn-secondary" onclick="weatherService.useFallbackData()" style="margin-left: 10px;">使用示例数据</button>
                </div>
            </div>
        `;
    }

    // 使用备用数据
    useFallbackData() {
        console.log(`Using fallback data for ${this.stationName}`);
        // 香港国际机场的示例数据
        const mockMetar = 'VHHH 190600Z 24015KT 9999 FEW020 SCT030 25/22 Q1012 NOSIG';
        const mockTaf = 'TAF VHHH 190500Z 1906/2012 24012KT 9999 FEW020 SCT030 TEMPO 1906/1912 24018G28KT';
        
        this.processData(mockMetar, mockTaf);
        this.updateDisplay();
        this.updateLastUpdated();
    }

    // 更新最后更新时间
    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('weather-last-updated');
        if (lastUpdatedElement) {
            const now = new Date();
            lastUpdatedElement.textContent = `最后更新: ${this.formatTime(now)} - ${this.stationName}`;
        }
    }

    // 销毁服务
    destroy() {
        this.stopAutoRefresh();
    }
}

// 全局函数 - 解码当前显示的METAR
function decodeRawMETAR() {
    if (!window.weatherService || !window.weatherService.metarInfo) {
        alert('请先加载METAR数据');
        return;
    }
    
    const rawText = window.weatherService.metarInfo.rawOb;
    const metarInput = document.getElementById('metar-input');
    
    if (metarInput && rawText) {
        metarInput.value = rawText;
        
        if (typeof decodeMETAR === 'function') {
            decodeMETAR();
        }
        
        const metarElement = document.getElementById('metar');
        if (metarElement) {
            metarElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// 全局函数 - 解码当前显示的TAF
function decodeRawTAF() {
    if (!window.weatherService || !window.weatherService.tafInfo) {
        alert('请先加载TAF数据');
        return;
    }
    
    const rawText = window.weatherService.tafInfo.rawTAF;
    const tafInput = document.getElementById('taf-input');
    
    if (tafInput && rawText) {
        tafInput.value = rawText;
        
        if (typeof decodeTAF === 'function') {
            decodeTAF();
        }
        
        const tafElement = document.getElementById('taf');
        if (tafElement) {
            tafElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// 全局变量
let weatherService = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('weather-widget')) {
        console.log('Initializing WeatherService for Hong Kong International Airport');
        weatherService = new WeatherService();
        weatherService.init();
        
        window.weatherService = weatherService;
    }
});

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    if (weatherService) {
        weatherService.destroy();
    }
});
