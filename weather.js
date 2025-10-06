// 天气组件 - 调用自己的 METAR 和 TAF API
class WeatherWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.metarApiUrl = '/api/metar';
        this.tafApiUrl = '/api/taf';
        this.refreshInterval = 5 * 60 * 1000; // 5分钟自动刷新
        this.refreshTimer = null;
        
        this.init();
    }

    async init() {
        if (!this.container) {
            console.error('Weather widget container not found');
            return;
        }

        // 创建天气显示界面
        this.createWeatherDisplay();
        
        // 初次加载天气数据
        await this.loadWeatherData();
        
        // 设置自动刷新
        this.startAutoRefresh();
    }

    createWeatherDisplay() {
        this.container.innerHTML = `
            <div class="weather-widget">
                <div class="weather-header">
                    <h3>🌤️ 香港国际机场实时天气</h3>
                    <div class="weather-controls">
                        <button id="weather-refresh" class="refresh-btn">🔄 刷新</button>
                    </div>
                </div>
                
                <div class="weather-tabs">
                    <button class="tab-btn active" data-tab="metar">METAR (当前天气)</button>
                    <button class="tab-btn" data-tab="taf">TAF (天气预报)</button>
                </div>
                
                <div id="metar-content" class="weather-content active">
                    <div class="loading">正在加载 METAR 数据...</div>
                </div>
                
                <div id="taf-content" class="weather-content">
                    <div class="loading">正在加载 TAF 数据...</div>
                </div>
                
                <div id="weather-timestamp" class="weather-timestamp"></div>
            </div>
        `;

        // 添加事件监听
        this.addEventListeners();
    }

    addEventListeners() {
        // 刷新按钮
        const refreshBtn = document.getElementById('weather-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadWeatherData());
        }

        // 标签页切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    switchTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 显示对应内容
        document.querySelectorAll('.weather-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`).classList.add('active');
    }

    async loadWeatherData() {
        try {
            const refreshBtn = document.getElementById('weather-refresh');
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '🔄 刷新中...';
            }

            // 并行加载 METAR 和 TAF 数据
            const [metarResponse, tafResponse] = await Promise.all([
                fetch(this.metarApiUrl),
                fetch(this.tafApiUrl)
            ]);

            const metarData = await metarResponse.json();
            const tafData = await tafResponse.json();

            if (metarData.success) {
                this.displayMetarData(metarData.data);
            } else {
                this.displayError('metar', metarData.error || '获取 METAR 数据失败');
            }

            if (tafData.success) {
                this.displayTafData(tafData.data);
            } else {
                this.displayError('taf', tafData.error || '获取 TAF 数据失败');
            }

            // 更新时间戳
            this.updateTimestamp();

        } catch (error) {
            console.error('Failed to load weather data:', error);
            this.displayError('metar', '网络连接失败，请检查网络连接');
            this.displayError('taf', '网络连接失败，请检查网络连接');
        } finally {
            const refreshBtn = document.getElementById('weather-refresh');
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '🔄 刷新';
            }
        }
    }

    displayMetarData(data) {
        const container = document.getElementById('metar-content');
        if (!container) return;

        container.innerHTML = `
            <div class="weather-section">
                <h4>📊 观测信息</h4>
                <div class="weather-info-grid">
                    <div class="info-item">
                        <strong>机场:</strong> ${data.机场代码} - ${data.机场名称}
                    </div>
                    <div class="info-item">
                        <strong>观测时间:</strong> ${data.观测时间}
                    </div>
                    <div class="info-item">
                        <strong>坐标:</strong> ${data.坐标}
                    </div>
                    <div class="info-item">
                        <strong>海拔:</strong> ${data.海拔}
                    </div>
                </div>
            </div>

            <div class="weather-section">
                <h4>🌡️ 气象要素</h4>
                <div class="weather-info-grid">
                    <div class="info-item highlight">
                        <strong>温度:</strong> ${data.温度}
                    </div>
                    <div class="info-item highlight">
                        <strong>露点:</strong> ${data.露点}
                    </div>
                    <div class="info-item highlight">
                        <strong>风向:</strong> ${data.风向}
                    </div>
                    <div class="info-item highlight">
                        <strong>风速:</strong> ${data.风速}
                    </div>
                    <div class="info-item">
                        <strong>阵风:</strong> ${data.阵风}
                    </div>
                    <div class="info-item">
                        <strong>能见度:</strong> ${data.能见度}
                    </div>
                    <div class="info-item">
                        <strong>气压:</strong> ${data.气压}
                    </div>
                    <div class="info-item">
                        <strong>飞行类别:</strong> <span class="flight-category">${data.飞行类别}</span>
                    </div>
                </div>
            </div>

            <div class="weather-section">
                <h4>☁️ 云况信息</h4>
                <div class="weather-info-grid">
                    <div class="info-item">
                        <strong>主要云况:</strong> ${data.主要云况}
                    </div>
                    <div class="info-item full-width">
                        <strong>云层详情:</strong> ${data.云层详情}
                    </div>
                    <div class="info-item full-width">
                        <strong>天气现象:</strong> ${data.天气现象}
                    </div>
                </div>
            </div>

            <div class="weather-section">
                <h4>📝 原始报文</h4>
                <div class="raw-message">
                    <code>${data.原始报文}</code>
                </div>
            </div>
        `;
    }

    displayTafData(data) {
        const container = document.getElementById('taf-content');
        if (!container) return;

        let forecastsHtml = '';
        if (data.预报时段详情 && data.预报时段详情.length > 0) {
            forecastsHtml = data.预报时段详情.map((forecast, index) => `
                <div class="forecast-period">
                    <h5>预报时段 ${index + 1}</h5>
                    <div class="weather-info-grid">
                        <div class="info-item">
                            <strong>时段:</strong> ${forecast.时段开始} 至 ${forecast.时段结束}
                        </div>
                        <div class="info-item">
                            <strong>变化类型:</strong> ${forecast.变化类型}
                        </div>
                        <div class="info-item">
                            <strong>风向风速:</strong> ${forecast.风向} / ${forecast.风速}
                        </div>
                        <div class="info-item">
                            <strong>阵风:</strong> ${forecast.阵风}
                        </div>
                        <div class="info-item">
                            <strong>能见度:</strong> ${forecast.能见度}
                        </div>
                        <div class="info-item">
                            <strong>天气现象:</strong> ${forecast.天气现象}
                        </div>
                        <div class="info-item full-width">
                            <strong>云层:</strong> ${forecast.云层}
                        </div>
                        <div class="info-item full-width">
                            <strong>温度预报:</strong> ${forecast.温度预报}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        container.innerHTML = `
            <div class="weather-section">
                <h4>📊 预报信息</h4>
                <div class="weather-info-grid">
                    <div class="info-item">
                        <strong>机场:</strong> ${data.机场代码} - ${data.机场名称}
                    </div>
                    <div class="info-item">
                        <strong>发布时间:</strong> ${data.发布时间}
                    </div>
                    <div class="info-item">
                        <strong>有效期:</strong> ${data.有效期开始} 至 ${data.有效期结束}
                    </div>
                    <div class="info-item">
                        <strong>预报时段数:</strong> ${data.预报时段数量}
                    </div>
                </div>
            </div>

            <div class="weather-section">
                <h4>📅 预报时段详情</h4>
                <div class="forecasts-container">
                    ${forecastsHtml || '<p>暂无预报时段数据</p>'}
                </div>
            </div>

            <div class="weather-section">
                <h4>📝 原始报文</h4>
                <div class="raw-message">
                    <code>${data.原始报文}</code>
                </div>
            </div>
        `;
    }

    displayError(type, errorMessage) {
        const container = document.getElementById(`${type}-content`);
        if (container) {
            container.innerHTML = `
                <div class="weather-error">
                    ⚠️ ${errorMessage}
                    <br><small>请稍后再试或联系系统管理员</small>
                </div>
            `;
        }
    }

    updateTimestamp() {
        const timestampDiv = document.getElementById('weather-timestamp');
        if (timestampDiv) {
            const now = new Date().toLocaleString('zh-CN');
            timestampDiv.innerHTML = `最后更新: ${now}`;
        }
    }

    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.refreshTimer = setInterval(() => {
            this.loadWeatherData();
        }, this.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    destroy() {
        this.stopAutoRefresh();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// 页面加载完成后初始化天气组件
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('weather-widget-container')) {
        window.weatherWidget = new WeatherWidget('weather-widget-container');
    }
});
