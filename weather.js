// weather.js - 香港国际机场实时气象数据
class WeatherAPI {
    constructor() {
        this.metarUrl = 'https://aviationweather.gov/api/data/metar?ids=VHHH&format=json';
        this.tafUrl = 'https://aviationweather.gov/api/data/taf?ids=VHHH&format=json';
        this.translations = {
            // 强度修饰符
            '+': '强',
            '-': '轻',
            'VC': '附近',
            'RE': '近期',
            
            // 描述符
            'MI': '浅的',
            'BC': '散的',
            'DR': '低吹',
            'BL': '高吹',
            'SH': '阵性',
            'TS': '雷暴',
            'FZ': '冻结',
            'PR': '部分的',
            
            // 降水类型
            'RA': '雨',
            'DZ': '毛毛雨',
            'SN': '雪',
            'SG': '米雪',
            'IC': '冰晶',
            'PL': '冰粒',
            'GR': '冰雹',
            'GS': '小冰雹',
            'UP': '未知降水',
            
            // 视程障碍现象
            'BR': '轻雾',
            'FG': '雾',
            'FU': '烟',
            'VA': '火山灰',
            'DU': '浮尘',
            'SA': '沙',
            'HZ': '薄雾',
            'PY': '喷雾',
            
            // 其他天气现象
            'PO': '尘卷风',
            'SQ': '飑线',
            'FC': '漏斗云',
            'SS': '沙暴',
            'DS': '尘暴',
            
            // 云量
            'FEW': '少云',
            'SCT': '散云',
            'BKN': '裂云',
            'OVC': '阴天',
            'CLR': '无云',
            'SKC': '碧空',
            'NSC': '无显著云',
            'VV': '垂直能见度',
            
            // 飞行类别
            'VFR': '目视飞行规则',
            'MVFR': '边际目视飞行规则',
            'IFR': '仪表飞行规则',
            'LIFR': '低空仪表飞行规则',
            
            // 风向
            'VRB': '风向不定',
            'CALM': '静风',
            
            // 能见度
            'CAVOK': '能见度良好，无云',
            
            // 气压趋势
            'NOSIG': '无显著变化',
            
            // 跑道状况
            'R': '跑道',
            'L': '左',
            'C': '中',
            'R': '右',
            'U': '起飞端',
            'T': '接地端',
            'D': '停机坪',
            'P': '跑道',
            'SNOCLO': '因雪关闭',
            
            // 跑道污染物
            '0': '清洁干燥',
            '1': '潮湿',
            '2': '湿或积水',
            '3': '霜',
            '4': '干雪',
            '5': '湿雪',
            '6': '雪浆',
            '7': '冰',
            '8': '压实雪',
            '9': '冰冻的轮迹',
            
            // 跑道刹车作用
            '91': '差',
            '92': '中差',
            '93': '中',
            '94': '中好',
            '95': '好',
            '99': '不可靠',
            
            // 温度相关
            'M': '零下',
            'TX': '最高温度',
            'TN': '最低温度',
            
            // 时间相关
            'TEMPO': '暂时',
            'BECMG': '变为',
            'FM': '从',
            'TL': '直到',
            'AT': '在',
            
            // 概率
            'PROB': '概率',
            'PROB30': '30%概率',
            'PROB40': '40%概率',
            
            // 特殊天气
            'VIRGA': '幡状云',
            'TCU': '浓积云',
            'CB': '积雨云',
            'ACC': '高积云',
            'SCSL': '层积云',
            'ACSL': '高积云',
            
            // 能见度单位
            'SM': '英里',
            'KM': '公里',
            'M': '米',
            'FT': '英尺',
            
            // 风切变
            'WS': '风切变',
            'ALL': '所有跑道',
            
            // 自动观测系统类型
            'AO1': '自动观测系统无降水传感器',
            'AO2': '自动观测系统有降水传感器',
            'A02A': '自动观测系统有降水类型传感器',
            
            // 维护标志
            'RMK': '备注',
            'COR': '修正报',
            'AMD': '修正',
            'NIL': '无数据',
            'AUTO': '自动观测',
            
            // 云类型
            'CU': '积云',
            'CB': '积雨云',
            'TCU': '浓积云',
            'SC': '层积云',
            'ST': '层云',
            'NS': '雨层云',
            'AC': '高积云',
            'AS': '高层云',
            'CC': '卷积云',
            'CS': '卷层云',
            'CI': '卷云',
            
            // 湍流强度
            'LGT': '轻度',
            'MOD': '中度',
            'SEV': '严重',
            'EXTRM': '极端',
            
            // 积冰强度
            'TRACE': '微量',
            'LGT-MOD': '轻度到中度',
            'MOD-SEV': '中度到严重',
            
            // 趋势预报组
            'NOSIG': '无显著变化',
            'BECMG': '变为',
            'TEMPO': '暂时',
            
            // 特殊报告
            'SPECI': '特殊报告',
            'METAR': '航空例行天气报告',
            'TAF': '航站天气预报'
        };

        // 特殊组合翻译
        this.specialCombinations = {
            'TSRA': '雷雨',
            'TSSN': '雷雪',
            'FZRA': '冻雨',
            'FZDZ': '冻毛毛雨',
            'SHRA': '阵雨',
            'SHSN': '阵雪',
            'SHGR': '阵性冰雹',
            'SHGS': '阵性小冰雹',
            'BLSN': '高吹雪',
            'BLSA': '高吹沙',
            'BLDU': '高吹尘',
            'DRSN': '低吹雪',
            'DRSA': '低吹沙',
            'DRDU': '低吹尘',
            'MIFG': '浅雾',
            'BCFG': '散的雾',
            'VCFG': '附近的雾',
            'VCSH': '附近的阵性降水'
        };
    }

    // 格式化时间
    formatTime(timestamp) {
        if (!timestamp) return '未知时间';
        try {
            // 处理不同格式的时间戳
            let date;
            if (typeof timestamp === 'number') {
                // Unix时间戳（秒）
                date = new Date(timestamp * 1000);
            } else if (typeof timestamp === 'string') {
                // ISO字符串
                date = new Date(timestamp);
            } else {
                return '无效时间';
            }
            
            if (isNaN(date.getTime())) return '无效时间';
            
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
        } catch (error) {
            console.error('时间格式化错误:', error);
            return '时间错误';
        }
    }

    // 高级天气现象翻译
    translateWeather(text) {
        if (!text || text === 'null' || text === '') return '无显著天气';
        
        let translated = text;
        
        // 首先检查特殊组合
        Object.keys(this.specialCombinations).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            translated = translated.replace(regex, this.specialCombinations[key]);
        });
        
        // 然后翻译单个代码
        Object.keys(this.translations).forEach(key => {
            // 使用单词边界匹配，避免部分匹配
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            translated = translated.replace(regex, this.translations[key]);
        });
        
        // 处理强度修饰符在代码前的情况（如 -RA, +SN, VCTS）
        translated = translated.replace(/([+\-VC])([A-Z]{2,})/g, (match, modifier, code) => {
            const modTrans = this.translations[modifier] || modifier;
            const codeTrans = this.translations[code] || code;
            return `${modTrans}${codeTrans}`;
        });
        
        // 处理数字和单位的组合（如 10SM, 2000FT）
        translated = translated.replace(/(\d+)([A-Z]{2})/g, (match, number, unit) => {
            const unitTrans = this.translations[unit] || unit;
            return `${number}${unitTrans}`;
        });
        
        // 处理概率（如 PROB30, PROB40）
        translated = translated.replace(/PROB(\d+)/g, (match, prob) => {
            return `${this.translations['PROB']}${prob}%`;
        });
        
        // 处理跑道信息（如 R36L, R18C）
        translated = translated.replace(/R(\d{2})([LCR])?/g, (match, runway, position) => {
            let posTrans = '';
            if (position) {
                posTrans = this.translations[position] || position;
            }
            return `跑道${runway}${posTrans}`;
        });
        
        return translated;
    }

    // 获取METAR数据
    async fetchMETAR() {
        try {
            console.log('正在获取METAR数据...');
            const response = await fetch(this.metarUrl);
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('METAR原始数据:', data);
            
            if (!data || data.length === 0) {
                throw new Error('未收到METAR数据');
            }
            
            return this.processMETAR(data[0]);
        } catch (error) {
            console.error('获取METAR数据错误:', error);
            return {
                error: true,
                message: `获取METAR数据失败: ${error.message}`
            };
        }
    }

    // 处理METAR数据
    processMETAR(metar) {
        try {
            return {
                icaoId: metar.icaoId || 'VHHH',
                stationName: this.translateStationName(metar.name) || '香港国际机场',
                observationTime: this.formatTime(metar.obsTime),
                reportTime: this.formatTime(metar.reportTime),
                temperature: metar.temp !== undefined ? `${metar.temp}°C` : '未知',
                dewpoint: metar.dewp !== undefined ? `${metar.dewp}°C` : '未知',
                wind: this.formatWind(metar.wdir, metar.wspd, metar.wgst),
                visibility: metar.visib !== undefined ? `${metar.visib} 英里` : '未知',
                altimeter: metar.altim !== undefined ? `${metar.altim} hPa` : '未知',
                weather: this.translateWeather(metar.wxString),
                clouds: this.formatClouds(metar.clouds),
                flightCategory: this.translations[metar.fltCat] || metar.fltCat || '未知',
                raw: metar.rawOb || '无原始数据',
                seaLevelPressure: metar.slp !== undefined ? `${metar.slp} hPa` : '未知',
                recentWeather: metar.pcp3hr !== undefined ? `${metar.pcp3hr} 英寸` : '无',
                snow: metar.snow !== undefined ? `${metar.snow} 英寸` : '无',
                verticalVisibility: metar.vertVis !== undefined ? `${metar.vertVis} 英尺` : '未知'
            };
        } catch (error) {
            console.error('处理METAR数据错误:', error);
            return {
                error: true,
                message: `处理METAR数据失败: ${error.message}`
            };
        }
    }

    // 翻译机场名称
    translateStationName(name) {
        if (!name) return '香港国际机场';
        
        const stationTranslations = {
            'Hong Kong International Airport': '香港国际机场',
            'Chicago O\'Hare International Airport': '芝加哥奥黑尔国际机场',
            'KORD': '芝加哥奥黑尔国际机场',
            'VHHH': '香港国际机场'
        };
        
        return stationTranslations[name] || name;
    }

    // 格式化风信息
    formatWind(direction, speed, gust) {
        if (direction === null || direction === undefined) {
            return '静风';
        }
        
        if (direction === 'VRB') {
            if (gust && gust > speed) {
                return `风向不定 ${speed}节 阵风${gust}节`;
            }
            return `风向不定 ${speed}节`;
        }
        
        let windStr = `${direction}度 ${speed}节`;
        if (gust && gust > speed) {
            windStr += ` 阵风${gust}节`;
        }
        
        return windStr;
    }

    // 格式化云信息
    formatClouds(clouds) {
        if (!clouds || clouds.length === 0) return '无云';
        
        try {
            return clouds.map(cloud => {
                const cover = this.translations[cloud.cover] || cloud.cover;
                const base = cloud.base !== undefined ? `${cloud.base}英尺` : '未知高度';
                let cloudType = '';
                if (cloud.type) {
                    cloudType = ` (${this.translations[cloud.type] || cloud.type})`;
                }
                return `${cover} ${base}${cloudType}`;
            }).join(', ');
        } catch (error) {
            console.error('格式化云信息错误:', error);
            return '云信息错误';
        }
    }

    // 获取TAF数据
    async fetchTAF() {
        try {
            console.log('正在获取TAF数据...');
            const response = await fetch(this.tafUrl);
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('TAF原始数据:', data);
            
            if (!data || data.length === 0) {
                throw new Error('未收到TAF数据');
            }
            
            return this.processTAF(data[0]);
        } catch (error) {
            console.error('获取TAF数据错误:', error);
            return {
                error: true,
                message: `获取TAF数据失败: ${error.message}`
            };
        }
    }

    // 处理TAF数据
    processTAF(taf) {
        try {
            return {
                icaoId: taf.icaoId || 'VHHH',
                stationName: this.translateStationName(taf.name) || '香港国际机场',
                issueTime: this.formatTime(taf.issueTime),
                validFrom: this.formatTime(taf.validTimeFrom),
                validTo: this.formatTime(taf.validTimeTo),
                raw: taf.rawTAF || '无原始数据',
                forecasts: this.processForecasts(taf.fcsts || []),
                bulletinTime: this.formatTime(taf.bulletinTime),
                remarks: this.translateWeather(taf.remarks) || '无备注'
            };
        } catch (error) {
            console.error('处理TAF数据错误:', error);
            return {
                error: true,
                message: `处理TAF数据失败: ${error.message}`
            };
        }
    }

    // 处理预报数据
    processForecasts(forecasts) {
        if (!forecasts || forecasts.length === 0) {
            return [{ period: '无预报数据', details: '暂无预报信息' }];
        }
        
        return forecasts.map(fcst => {
            const details = [];
            
            // 风信息
            if (fcst.wdir || fcst.wspd) {
                details.push(`风: ${this.formatWind(fcst.wdir, fcst.wspd, fcst.wgst)}`);
            }
            
            // 能见度
            if (fcst.visib) {
                details.push(`能见度: ${fcst.visib} 英里`);
            }
            
            // 天气现象
            if (fcst.wxString) {
                details.push(`天气: ${this.translateWeather(fcst.wxString)}`);
            }
            
            // 云量
            if (fcst.clouds && fcst.clouds.length > 0) {
                details.push(`云: ${this.formatClouds(fcst.clouds)}`);
            }
            
            // 概率
            if (fcst.probability) {
                details.push(`概率: ${fcst.probability}%`);
            }
            
            // 预报变化类型
            if (fcst.fcstChange) {
                details.push(`变化: ${this.translations[fcst.fcstChange] || fcst.fcstChange}`);
            }
            
            // 湍流信息
            if (fcst.icgTurb && fcst.icgTurb.length > 0) {
                const turb = fcst.icgTurb[0];
                if (turb.var === 'TURB') {
                    const intensity = this.translateTurbulenceIntensity(turb.intensity);
                    details.push(`湍流: ${intensity} ${turb.minAlt}-${turb.maxAlt}英尺`);
                }
            }
            
            // 积冰信息
            if (fcst.icgTurb && fcst.icgTurb.length > 0) {
                const icing = fcst.icgTurb.find(item => item.var === 'ICING');
                if (icing) {
                    const intensity = this.translateIcingIntensity(icing.intensity);
                    details.push(`积冰: ${intensity} ${icing.minAlt}-${icing.maxAlt}英尺`);
                }
            }
            
            return {
                period: `${this.formatTime(fcst.timeFrom)} - ${this.formatTime(fcst.timeTo)}`,
                details: details.length > 0 ? details.join(' | ') : '无显著天气变化'
            };
        });
    }

    // 翻译湍流强度
    translateTurbulenceIntensity(intensity) {
        const turbTranslations = {
            0: '无湍流',
            1: '轻度湍流',
            2: '中度湍流',
            3: '严重湍流',
            4: '极端湍流',
            5: '极端湍流',
            6: '极端湍流'
        };
        return turbTranslations[intensity] || `强度${intensity}`;
    }

    // 翻译积冰强度
    translateIcingIntensity(intensity) {
        const icingTranslations = {
            0: '无积冰',
            1: '轻度积冰',
            2: '轻到中度积冰',
            3: '中度积冰',
            4: '中到严重积冰',
            5: '严重积冰',
            6: '严重积冰'
        };
        return icingTranslations[intensity] || `强度${intensity}`;
    }
}

// 初始化天气API
const weatherAPI = new WeatherAPI();

// 导出函数供HTML调用
window.initializeWeatherWidget = async function() {
    const metarContainer = document.getElementById('metar-content');
    const tafContainer = document.getElementById('taf-content');
    
    if (!metarContainer || !tafContainer) {
        console.error('气象容器未找到');
        return;
    }

    // 显示加载状态
    metarContainer.innerHTML = '<div class="weather-loading">正在获取METAR数据...</div>';
    tafContainer.innerHTML = '<div class="weather-loading">正在获取TAF数据...</div>';

    try {
        // 并行获取数据
        const [metarData, tafData] = await Promise.all([
            weatherAPI.fetchMETAR(),
            weatherAPI.fetchTAF()
        ]);

        // 显示METAR数据
        if (metarData.error) {
            metarContainer.innerHTML = `<div class="weather-error">${metarData.message}</div>`;
        } else {
            metarContainer.innerHTML = this.renderMETAR(metarData);
        }

        // 显示TAF数据
        if (tafData.error) {
            tafContainer.innerHTML = `<div class="weather-error">${tafData.message}</div>`;
        } else {
            tafContainer.innerHTML = this.renderTAF(tafData);
        }

        // 添加自动刷新功能（每10分钟刷新一次）
        setTimeout(() => {
            this.initializeWeatherWidget();
        }, 10 * 60 * 1000);

    } catch (error) {
        console.error('初始化气象组件错误:', error);
        metarContainer.innerHTML = '<div class="weather-error">初始化气象数据失败</div>';
        tafContainer.innerHTML = '<div class="weather-error">初始化气象数据失败</div>';
    }
};

// 渲染METAR数据
window.renderMETAR = function(data) {
    return `
        <div class="weather-data">
            <div class="weather-item">
                <span class="weather-label">观测时间:</span>
                <span class="weather-value">${data.observationTime}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">温度/露点:</span>
                <span class="weather-value">${data.temperature} / ${data.dewpoint}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">风:</span>
                <span class="weather-value">${data.wind}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">能见度:</span>
                <span class="weather-value">${data.visibility}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">天气现象:</span>
                <span class="weather-value">${data.weather}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">云况:</span>
                <span class="weather-value">${data.clouds}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">气压:</span>
                <span class="weather-value">${data.altimeter}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">海平面气压:</span>
                <span class="weather-value">${data.seaLevelPressure}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">飞行类别:</span>
                <span class="weather-value">${data.flightCategory}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">垂直能见度:</span>
                <span class="weather-value">${data.verticalVisibility}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">近期降水:</span>
                <span class="weather-value">${data.recentWeather}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">积雪:</span>
                <span class="weather-value">${data.snow}</span>
            </div>
            <div class="weather-item full-width">
                <span class="weather-label">原始报文:</span>
                <span class="weather-value raw-text">${data.raw}</span>
            </div>
        </div>
    `;
};

// 渲染TAF数据
window.renderTAF = function(data) {
    const forecastsHtml = data.forecasts.map(fcst => `
        <div class="taf-forecast">
            <div class="taf-period">${fcst.period}</div>
            <div class="taf-details">${fcst.details}</div>
        </div>
    `).join('');

    return `
        <div class="weather-data">
            <div class="weather-item">
                <span class="weather-label">发布时间:</span>
                <span class="weather-value">${data.issueTime}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">有效时间:</span>
                <span class="weather-value">${data.validFrom} 至 ${data.validTo}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">公告时间:</span>
                <span class="weather-value">${data.bulletinTime}</span>
            </div>
            <div class="weather-item">
                <span class="weather-label">备注:</span>
                <span class="weather-value">${data.remarks}</span>
            </div>
            <div class="weather-item full-width">
                <span class="weather-label">原始报文:</span>
                <span class="weather-value raw-text">${data.raw}</span>
            </div>
            <div class="taf-forecasts">
                <div class="taf-section-title">详细预报:</div>
                ${forecastsHtml}
            </div>
        </div>
    `;
};

// 标签切换功能
window.switchWeatherTab = function(tabName) {
    // 更新按钮状态
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-content').classList.add('active');
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (typeof initializeWeatherWidget === 'function') {
                initializeWeatherWidget();
            }
        }, 1000);
    });
} else {
    setTimeout(() => {
        if (typeof initializeWeatherWidget === 'function') {
            initializeWeatherWidget();
        }
    }, 1000);
}
