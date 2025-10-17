// 香港国际机场实时METAR和TAF数据获取
class WeatherAPI {
    constructor() {
        // AWC OpenAPI 链接
        this.metarUrl = 'https://aviationweather.gov/api/data/metar?ids=VHHH&format=json';
        this.tafUrl = 'https://aviationweather.gov/api/data/taf?ids=VHHH&format=json';
        this.updateInterval = 300000; // 5分钟更新一次
        this.isUpdating = false;
    }

    // 时间格式转换函数
    formatTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
    }

    formatDateString(dateString) {
        const date = new Date(dateString);
        return date.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
    }

    // 风向翻译 - 完整的360度覆盖
    translateWindDirection(degrees) {
        if (degrees === null || degrees === undefined || degrees === 'VRB') return '变向';
        if (degrees === 0 || degrees === 360) return '正北';
        
        const directions = [
            { min: 0, max: 11.25, name: '正北' },
            { min: 11.25, max: 33.75, name: '北东北' },
            { min: 33.75, max: 56.25, name: '东北' },
            { min: 56.25, max: 78.75, name: '东东北' },
            { min: 78.75, max: 101.25, name: '正东' },
            { min: 101.25, max: 123.75, name: '东东南' },
            { min: 123.75, max: 146.25, name: '东南' },
            { min: 146.25, max: 168.75, name: '南东南' },
            { min: 168.75, max: 191.25, name: '正南' },
            { min: 191.25, max: 213.75, name: '南西南' },
            { min: 213.75, max: 236.25, name: '西南' },
            { min: 236.25, max: 258.75, name: '西西南' },
            { min: 258.75, max: 281.25, name: '正西' },
            { min: 281.25, max: 303.75, name: '西西北' },
            { min: 303.75, max: 326.25, name: '西北' },
            { min: 326.25, max: 348.75, name: '北西北' },
            { min: 348.75, max: 360, name: '正北' }
        ];
        
        for (const dir of directions) {
            if (degrees >= dir.min && degrees < dir.max) {
                return dir.name;
            }
        }
        return '未知风向';
    }

    // 能见度翻译
    translateVisibility(visib) {
        if (visib === null || visib === undefined) return '未知';
        if (visib >= 10) return '10公里以上';
        if (visib >= 9) return '9-10公里';
        if (visib >= 8) return '8-9公里';
        if (visib >= 7) return '7-8公里';
        if (visib >= 6) return '6-7公里';
        if (visib >= 5) return '5-6公里';
        if (visib >= 4) return '4-5公里';
        if (visib >= 3) return '3-4公里';
        if (visib >= 2) return '2-3公里';
        if (visib >= 1) return '1-2公里';
        if (visib >= 0.5) return '0.5-1公里';
        return `${visib}公里`;
    }

    // 天气现象翻译 - 完整的ICAO代码
    translateWeatherPhenomena(wxString) {
        if (!wxString) return '无特殊天气现象';
        
        const translations = {
            // 降水类型
            'RA': '雨',
            '-RA': '小雨',
            '+RA': '大雨',
            'SHRA': '阵雨',
            '-SHRA': '小阵雨',
            '+SHRA': '大阵雨',
            'DZ': '毛毛雨',
            '-DZ': '小毛毛雨',
            '+DZ': '大毛毛雨',
            'SN': '雪',
            '-SN': '小雪',
            '+SN': '大雪',
            'SHSN': '阵雪',
            '-SHSN': '小阵雪',
            '+SHSN': '大阵雪',
            'SG': '雪粒',
            'IC': '冰晶',
            'PL': '冰丸',
            'GR': '冰雹',
            'GS': '小冰雹',
            'UP': '未知降水',
            
            // 遮蔽现象
            'FG': '雾',
            'BR': '薄雾',
            'HZ': '霾',
            'FU': '烟',
            'VA': '火山灰',
            'DU': '广泛尘土',
            'SA': '沙',
            'PY': '飞沫',
            
            // 其他现象
            'SQ': '飑线',
            'FC': '漏斗云(龙卷风)',
            'SS': '沙暴',
            'DS': '尘暴',
            'TS': '雷暴',
            'TSRA': '雷阵雨',
            '-TSRA': '弱雷阵雨',
            '+TSRA': '强雷阵雨',
            'TSSN': '雷阵雪',
            'TSGS': '雷暴伴小冰雹',
            'TSGR': '雷暴伴冰雹',
            
            // 冻结现象
            'FZ': '冻结',
            'FZRA': '冻雨',
            '-FZRA': '小冻雨',
            '+FZRA': '大冻雨',
            'FZDZ': '冻毛毛雨',
            'FZFG': '冻雾',
            
            // 吹刮现象
            'BL': '吹',
            'BLSN': '吹雪',
            'BLSA': '吹沙',
            'BLDU': '吹尘',
            'DR': '低吹',
            'DRSN': '低吹雪',
            'DRSA': '低吹沙',
            'DRDU': '低吹尘',
            
            // 部分现象
            'MI': '浅',
            'BC': '片状',
            'PR': '部分',
            'VC': '附近',
            'MIFG': '浅雾',
            'BCFG': '片状雾',
            'PRFG': '部分雾',
            'VCFG': '附近有雾',
            'VCSH': '附近阵雨',
            'VCTS': '附近雷暴',
            'VCSS': '附近沙暴',
            'VCDS': '附近尘暴',
            'VCPO': '附近尘旋风',
            'VCFC': '附近漏斗云',
            'VCVA': '附近火山灰',
            
            // 强度前缀
            '-': '轻微',
            '+': '强烈',
            'RE': '最近',
            
            // 时间修饰词
            'RESN': '最近下雪',
            'RERA': '最近下雨',
            'REFG': '最近有雾',
            'RETS': '最近雷暴',
            'RESH': '最近阵雨',
            'REGS': '最近小冰雹',
            'REGR': '最近冰雹',
            'REUP': '最近未知降水',
            'REFZRA': '最近冻雨',
            'REPL': '最近冰丸',
            'RESG': '最近雪粒',
            'REIC': '最近冰晶',
            'REBLSN': '最近吹雪',
            'REFC': '最近漏斗云',
            'RESS': '最近沙暴',
            'REDS': '最近尘暴',
            'REVA': '最近火山灰'
        };

        let result = wxString;
        
        // 按长度排序，先匹配长的组合
        const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
        
        for (const code of sortedKeys) {
            const regex = new RegExp(`\\b${code.replace(/[+\-]/g, '\\$&')}\\b`, 'g');
            result = result.replace(regex, translations[code]);
        }
        
        return result;
    }

    // 云层翻译 - 完整的云层类型和高度
    translateClouds(clouds) {
        if (!clouds || clouds.length === 0) return '晴朗';
        
        const typeTranslations = {
            'FEW': '少云',      // 1-2 oktas
            'SCT': '疏云',      // 3-4 oktas
            'BKN': '多云',      // 5-7 oktas
            'OVC': '阴天',      // 8 oktas
            'CLR': '晴朗',      // 0 oktas
            'SKC': '万里无云',   // sky clear
            'NSC': '无显著云',   // no significant cloud
            'NCD': '无云被探测', // no clouds detected
            'VV': '垂直能见度',  // vertical visibility
            'CB': '积雨云',      // cumulonimbus
            'TCU': '浓积云',     // towering cumulus
            'AC': '高积云',      // altocumulus
            'AS': '高层云',      // altostratus
            'CC': '卷积云',      // cirrocumulus
            'CI': '卷云',       // cirrus
            'CS': '卷层云',     // cirrostratus
            'CU': '积云',       // cumulus
            'NS': '雨层云',     // nimbostratus
            'SC': '层积云',     // stratocumulus
            'ST': '层云'        // stratus
        };

        return clouds.map(cloud => {
            let type = typeTranslations[cloud.cover] || cloud.cover;
            let height = '';
            
            if (cloud.base !== null && cloud.base !== undefined) {
                const heightFt = cloud.base;
                const heightM = Math.round(heightFt * 0.3048);
                height = `${heightM}米(${heightFt}英尺)`;
            }
            
            // 处理特殊云类型
            if (cloud.type) {
                const cloudType = typeTranslations[cloud.type] || cloud.type;
                type += ` (${cloudType})`;
            }
            
            return height ? `${type} ${height}` : type;
        }).join(', ');
    }

    // 飞行类别翻译
    translateFlightCategory(fltCat) {
        const categories = {
            'VFR': 'VFR (目视飞行规则)',
            'MVFR': 'MVFR (边际目视飞行规则)', 
            'IFR': 'IFR (仪表飞行规则)',
            'LIFR': 'LIFR (低仪表飞行规则)',
            'UNKNOWN': '未知'
        };
        return categories[fltCat] || fltCat || '未知';
    }

    // 温度翻译
    translateTemperature(temp) {
        if (temp === null || temp === undefined) return '未知';
        return `${temp.toFixed(1)}°C`;
    }

    // 气压翻译
    translatePressure(pressure) {
        if (pressure === null || pressure === undefined) return '未知';
        // 转换为中国常用的百帕单位
        if (pressure > 500) {
            // 如果数值很大，可能是以百帕为单位
            return `${pressure.toFixed(1)}百帕`;
        } else {
            // 如果数值较小，可能是以英寸汞柱为单位，需要转换
            const hPa = pressure * 33.8639;
            return `${hPa.toFixed(1)}百帕 (${pressure.toFixed(2)}英寸汞柱)`;
        }
    }

    // 风速翻译
    translateWindSpeed(speed, unit = 'KT') {
        if (speed === null || speed === undefined) return '静风';
        
        let speedKmh;
        switch (unit.toUpperCase()) {
            case 'KT':
            case 'KNOTS':
                speedKmh = speed * 1.852; // 节转公里/小时
                break;
            case 'MPS':
                speedKmh = speed * 3.6; // 米/秒转公里/小时
                break;
            case 'MPH':
                speedKmh = speed * 1.60934; // 英里/小时转公里/小时
                break;
            default:
                speedKmh = speed; // 假设已经是公里/小时
        }
        
        return `${Math.round(speedKmh)}公里/小时 (${speed}节)`;
    }

    // METAR类型翻译
    translateMETARType(type) {
        const types = {
            'METAR': '例行观测报告',
            'SPECI': '特殊观测报告',
            'AUTO': '自动观测报告'
        };
        return types[type] || type || '观测报告';
    }

    // 获取METAR数据
    async fetchMETAR() {
        try {
            const response = await fetch(this.metarUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data[0] || null; // 返回第一个结果
        } catch (error) {
            console.error('获取METAR数据失败:', error);
            throw error;
        }
    }

    // 获取TAF数据
    async fetchTAF() {
        try {
            const response = await fetch(this.tafUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data[0] || null; // 返回第一个结果
        } catch (error) {
            console.error('获取TAF数据失败:', error);
            throw error;
        }
    }

    // 解析METAR数据
    parseMETAR(data) {
        if (!data) return null;

        return {
            icaoId: data.icaoId || 'VHHH',
            rawOb: data.rawOb || '无原始数据',
            metarType: this.translateMETARType(data.metarType),
            reportTime: data.reportTime ? this.formatDateString(data.reportTime) : '未知时间',
            receiptTime: data.receiptTime ? this.formatDateString(data.receiptTime) : '未知时间',
            observationTime: data.obsTime ? this.formatTimestamp(data.obsTime) : '未知时间',
            temperature: this.translateTemperature(data.temp),
            dewpoint: this.translateTemperature(data.dewp),
            windDirection: this.translateWindDirection(data.wdir),
            windSpeed: this.translateWindSpeed(data.wspd),
            windGust: data.wgst ? `阵风 ${this.translateWindSpeed(data.wgst)}` : '无阵风',
            visibility: this.translateVisibility(data.visib),
            verticalVisibility: data.vertVis ? `垂直能见度 ${Math.round(data.vertVis * 0.3048)}米` : null,
            pressure: this.translatePressure(data.altim),
            seaLevelPressure: data.slp ? `海平面气压 ${data.slp.toFixed(1)}百帕` : null,
            weatherPhenomena: this.translateWeatherPhenomena(data.wxString),
            clouds: this.translateClouds(data.clouds),
            flightCategory: this.translateFlightCategory(data.fltCat),
            maxTemp: data.maxT ? `最高温度 ${this.translateTemperature(data.maxT)}` : null,
            minTemp: data.minT ? `最低温度 ${this.translateTemperature(data.minT)}` : null,
            maxTemp24: data.maxT24 ? `24小时最高温度 ${this.translateTemperature(data.maxT24)}` : null,
            minTemp24: data.minT24 ? `24小时最低温度 ${this.translateTemperature(data.minT24)}` : null,
            precipitation: data.precip ? `降水量 ${data.precip}毫米` : null,
            precipitation3hr: data.pcp3hr ? `3小时降水量 ${data.pcp3hr}毫米` : null,
            precipitation6hr: data.pcp6hr ? `6小时降水量 ${data.pcp6hr}毫米` : null,
            precipitation24hr: data.pcp24hr ? `24小时降水量 ${data.pcp24hr}毫米` : null,
            snowDepth: data.snow ? `积雪深度 ${data.snow}毫米` : null,
            airportName: data.name || '香港国际机场',
            latitude: data.lat ? `纬度 ${data.lat.toFixed(4)}°` : null,
            longitude: data.lon ? `经度 ${data.lon.toFixed(4)}°` : null,
            elevation: data.elev ? `海拔 ${data.elev}米` : null
        };
    }

    // 解析TAF数据
    parseTAF(data) {
        if (!data) return null;

        const formatTime = (timestamp) => {
            const date = new Date(timestamp * 1000);
            const day = date.getUTCDate().toString().padStart(2, '0');
            const hour = date.getUTCHours().toString().padStart(2, '0');
            const minute = date.getUTCMinutes().toString().padStart(2, '0');
            return `${day}日${hour}:${minute}Z`;
        };

        const forecasts = data.fcsts ? data.fcsts.map(fcst => {
            const forecast = {
                timeFrom: formatTime(fcst.timeFrom),
                timeTo: formatTime(fcst.timeTo),
                changeType: this.translateChangeType(fcst.fcstChange),
                probability: fcst.probability ? `概率 ${fcst.probability}%` : null,
                windDirection: this.translateWindDirection(fcst.wdir),
                windSpeed: this.translateWindSpeed(fcst.wspd),
                windGust: fcst.wgst ? `阵风 ${this.translateWindSpeed(fcst.wgst)}` : '无阵风',
                windShear: this.translateWindShear(fcst.wshearHgt, fcst.wshearDir, fcst.wshearSpd),
                visibility: this.translateVisibility(fcst.visib),
                verticalVisibility: fcst.vertVis ? `垂直能见度 ${Math.round(fcst.vertVis * 0.3048)}米` : null,
                pressure: this.translatePressure(fcst.altim),
                weatherPhenomena: this.translateWeatherPhenomena(fcst.wxString),
                clouds: this.translateClouds(fcst.clouds),
                icingTurbulence: this.translateIcingTurbulence(fcst.icgTurb),
                temperatures: this.translateTemperatureForecast(fcst.temp),
                notDecoded: fcst.notDecoded ? `未解码信息: ${fcst.notDecoded}` : null
            };
            
            return forecast;
        }) : [];

        return {
            icaoId: data.icaoId || 'VHHH',
            rawTAF: data.rawTAF || '无原始数据',
            issueTime: data.issueTime ? this.formatDateString(data.issueTime) : '未知时间',
            bulletinTime: data.bulletinTime ? this.formatDateString(data.bulletinTime) : '未知时间',
            validFrom: this.formatTimestamp(data.validTimeFrom),
            validTo: this.formatTimestamp(data.validTimeTo),
            mostRecent: data.mostRecent ? '最新版本' : '非最新版本',
            remarks: data.remarks ? `备注: ${data.remarks}` : null,
            airportName: data.name || '香港国际机场',
            latitude: data.lat ? `纬度 ${data.lat.toFixed(4)}°` : null,
            longitude: data.lon ? `经度 ${data.lon.toFixed(4)}°` : null,
            elevation: data.elev ? `海拔 ${data.elev}米` : null,
            forecasts: forecasts
        };
    }

    // 翻译变化类型
    translateChangeType(changeType) {
        const types = {
            'FM': '从...开始',
            'BECMG': '逐渐变为',
            'TEMPO': '临时',
            'PROB': '可能',
            'INTER': '间歇性',
            'OCNL': '偶尔'
        };
        return types[changeType] || changeType;
    }

    // 翻译风切变
    translateWindShear(height, direction, speed) {
        if (!height || !direction || !speed) return null;
        const heightM = Math.round(height * 0.3048);
        const dirName = this.translateWindDirection(direction);
        const speedKmh = Math.round(speed * 1.852);
        return `风切变: ${heightM}米高度 ${dirName}风 ${speedKmh}公里/小时`;
    }

    // 翻译结冰和颠簸
    translateIcingTurbulence(icgTurb) {
        if (!icgTurb || icgTurb.length === 0) return null;
        
        return icgTurb.map(item => {
            const types = {
                'ICE': '结冰',
                'TURB': '颠簸',
                'MTW': '山地波'
            };
            
            const intensities = {
                0: '无',
                1: '轻微',
                2: '轻度',
                3: '中度',
                4: '重度',
                5: '严重',
                6: '极端'
            };
            
            const type = types[item.var] || item.var;
            const intensity = intensities[item.intensity] || `强度${item.intensity}`;
            const minAltM = item.minAlt ? Math.round(item.minAlt * 0.3048) : null;
            const maxAltM = item.maxAlt ? Math.round(item.maxAlt * 0.3048) : null;
            
            let altRange = '';
            if (minAltM && maxAltM) {
                altRange = ` ${minAltM}-${maxAltM}米`;
            } else if (minAltM) {
                altRange = ` ${minAltM}米以上`;
            } else if (maxAltM) {
                altRange = ` ${maxAltM}米以下`;
            }
            
            return `${intensity}${type}${altRange}`;
        }).join(', ');
    }

    // 翻译温度预报
    translateTemperatureForecast(temps) {
        if (!temps || temps.length === 0) return null;
        
        return temps.map(temp => {
            const time = new Date(temp.validTime * 1000);
            const timeStr = time.toISOString().substring(8, 13).replace('T', '日') + 'Z';
            const tempC = temp.sfcTemp ? `${temp.sfcTemp.toFixed(1)}°C` : '未知';
            const type = temp.maxOrMin === 'MAX' ? '最高' : '最低';
            return `${timeStr} ${type}温度 ${tempC}`;
        }).join(', ');
    }

    // 更新METAR显示
    updateMETARDisplay(metarData, isError = false) {
        const container = document.getElementById('real-time-metar-content');
        if (!container) return;

        if (isError) {
            container.innerHTML = `
                <div class="weather-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>无法获取METAR数据，请稍后重试</p>
                    <p class="error-detail">请检查网络连接或稍后再试</p>
                </div>
            `;
            return;
        }

        if (!metarData) {
            container.innerHTML = `
                <div class="weather-no-data">
                    <i class="fas fa-info-circle"></i>
                    <p>暂无METAR数据</p>
                </div>
            `;
            return;
        }

        // 构建额外信息
        let additionalInfo = [];
        if (metarData.verticalVisibility) additionalInfo.push(metarData.verticalVisibility);
        if (metarData.seaLevelPressure) additionalInfo.push(metarData.seaLevelPressure);
        if (metarData.maxTemp) additionalInfo.push(metarData.maxTemp);
        if (metarData.minTemp) additionalInfo.push(metarData.minTemp);
        if (metarData.precipitation) additionalInfo.push(metarData.precipitation);
        if (metarData.snowDepth) additionalInfo.push(metarData.snowDepth);

        let locationInfo = [];
        if (metarData.latitude) locationInfo.push(metarData.latitude);
        if (metarData.longitude) locationInfo.push(metarData.longitude);
        if (metarData.elevation) locationInfo.push(metarData.elevation);

        container.innerHTML = `
            <div class="weather-header">
                <div class="weather-title">
                    <h4><i class="fas fa-plane"></i> ${metarData.icaoId} - ${metarData.airportName}</h4>
                    <span class="update-time">观测时间: ${metarData.reportTime}</span>
                    <span class="metar-type">${metarData.metarType}</span>
                </div>
                <div class="flight-category ${metarData.flightCategory.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}">
                    ${metarData.flightCategory}
                </div>
            </div>
            
            <div class="weather-grid">
                <div class="weather-item">
                    <span class="weather-label">温度:</span>
                    <span class="weather-value">${metarData.temperature}</span>
                </div>
                <div class="weather-item">
                    <span class="weather-label">露点:</span>
                    <span class="weather-value">${metarData.dewpoint}</span>
                </div>
                <div class="weather-item">
                    <span class="weather-label">风向:</span>
                    <span class="weather-value">${metarData.windDirection}</span>
                </div>
                <div class="weather-item">
                    <span class="weather-label">风速:</span>
                    <span class="weather-value">${metarData.windSpeed}</span>
                </div>
                <div class="weather-item">
                    <span class="weather-label">阵风:</span>
                    <span class="weather-value">${metarData.windGust}</span>
                </div>
                <div class="weather-item">
                    <span class="weather-label">能见度:</span>
                    <span class="weather-value">${metarData.visibility}</span>
                </div>
                <div class="weather-item">
                    <span class="weather-label">气压:</span>
                    <span class="weather-value">${metarData.pressure}</span>
                </div>
                <div class="weather-item">
                    <span class="weather-label">天气现象:</span>
                    <span class="weather-value">${metarData.weatherPhenomena}</span>
                </div>
                <div class="weather-item full-width">
                    <span class="weather-label">云层:</span>
                    <span class="weather-value">${metarData.clouds}</span>
                </div>
                ${additionalInfo.length > 0 ? `
                <div class="weather-item full-width">
                    <span class="weather-label">附加信息:</span>
                    <span class="weather-value">${additionalInfo.join(' | ')}</span>
                </div>
                ` : ''}
                ${locationInfo.length > 0 ? `
                <div class="weather-item full-width">
                    <span class="weather-label">位置信息:</span>
                    <span class="weather-value">${locationInfo.join(' | ')}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="raw-data">
                <details>
                    <summary>原始METAR数据</summary>
                    <code>${metarData.rawOb}</code>
                </details>
            </div>
        `;
    }

    // 更新TAF显示
    updateTAFDisplay(tafData, isError = false) {
        const container = document.getElementById('real-time-taf-content');
        if (!container) return;

        if (isError) {
            container.innerHTML = `
                <div class="weather-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>无法获取TAF数据，请稍后重试</p>
                    <p class="error-detail">请检查网络连接或稍后再试</p>
                </div>
            `;
            return;
        }

        if (!tafData) {
            container.innerHTML = `
                <div class="weather-no-data">
                    <i class="fas fa-info-circle"></i>
                    <p>暂无TAF数据</p>
                </div>
            `;
            return;
        }

        let forecastHTML = '';
        if (tafData.forecasts && tafData.forecasts.length > 0) {
            forecastHTML = tafData.forecasts.map((fcst, index) => {
                let forecastDetails = [];
                if (fcst.changeType) forecastDetails.push(fcst.changeType);
                if (fcst.probability) forecastDetails.push(fcst.probability);
                if (fcst.windShear) forecastDetails.push(fcst.windShear);
                if (fcst.verticalVisibility) forecastDetails.push(fcst.verticalVisibility);
                if (fcst.icingTurbulence) forecastDetails.push(fcst.icingTurbulence);
                if (fcst.temperatures) forecastDetails.push(fcst.temperatures);
                if (fcst.notDecoded) forecastDetails.push(fcst.notDecoded);

                return `
                <div class="forecast-period">
                    <h5>预报时段 ${index + 1}: ${fcst.timeFrom} - ${fcst.timeTo}</h5>
                    <div class="forecast-grid">
                        <div class="forecast-item">
                            <span class="weather-label">风向:</span>
                            <span class="weather-value">${fcst.windDirection}</span>
                        </div>
                        <div class="forecast-item">
                            <span class="weather-label">风速:</span>
                            <span class="weather-value">${fcst.windSpeed}</span>
                        </div>
                        <div class="forecast-item">
                            <span class="weather-label">阵风:</span>
                            <span class="weather-value">${fcst.windGust}</span>
                        </div>
                        <div class="forecast-item">
                            <span class="weather-label">能见度:</span>
                            <span class="weather-value">${fcst.visibility}</span>
                        </div>
                        <div class="forecast-item">
                            <span class="weather-label">天气现象:</span>
                            <span class="weather-value">${fcst.weatherPhenomena}</span>
                        </div>
                        <div class="forecast-item">
                            <span class="weather-label">云层:</span>
                            <span class="weather-value">${fcst.clouds}</span>
                        </div>
                        ${fcst.pressure !== '未知' ? `
                        <div class="forecast-item">
                            <span class="weather-label">气压:</span>
                            <span class="weather-value">${fcst.pressure}</span>
                        </div>
                        ` : ''}
                    </div>
                    ${forecastDetails.length > 0 ? `
                    <div class="forecast-details">
                        <strong>详细信息:</strong> ${forecastDetails.join(' | ')}
                    </div>
                    ` : ''}
                </div>
                `;
            }).join('');
        }

        let locationInfo = [];
        if (tafData.latitude) locationInfo.push(tafData.latitude);
        if (tafData.longitude) locationInfo.push(tafData.longitude);
        if (tafData.elevation) locationInfo.push(tafData.elevation);

        container.innerHTML = `
            <div class="weather-header">
                <div class="weather-title">
                    <h4><i class="fas fa-chart-line"></i> ${tafData.icaoId} - ${tafData.airportName}</h4>
                    <span class="update-time">发布时间: ${tafData.issueTime}</span>
                    <span class="taf-status">${tafData.mostRecent}</span>
                </div>
                <div class="valid-period">
                    有效期: ${tafData.validFrom} 至 ${tafData.validTo}
                </div>
            </div>
            
            ${locationInfo.length > 0 ? `
            <div class="airport-info">
                <strong>机场信息:</strong> ${locationInfo.join(' | ')}
                ${tafData.remarks ? ` | ${tafData.remarks}` : ''}
            </div>
            ` : ''}
            
            <div class="forecasts-container">
                ${forecastHTML}
            </div>
            
            <div class="raw-data">
                <details>
                    <summary>原始TAF数据</summary>
                    <code>${tafData.rawTAF}</code>
                </details>
            </div>
        `;
    }

    // 更新状态显示
    updateStatus(message, isError = false) {
        const statusElement = document.getElementById('weather-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = isError ? 'status-error' : 'status-normal';
        }
    }

    // 主更新函数
    async updateWeatherData() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        this.updateStatus('正在更新天气数据...');

        try {
            // 并行获取METAR和TAF数据
            const [metarData, tafData] = await Promise.all([
                this.fetchMETAR().catch(e => ({ error: e })),
                this.fetchTAF().catch(e => ({ error: e }))
            ]);

            // 处理METAR数据
            if (metarData.error) {
                console.error('METAR错误:', metarData.error);
                this.updateMETARDisplay(null, true);
            } else {
                const parsedMETAR = this.parseMETAR(metarData);
                this.updateMETARDisplay(parsedMETAR);
            }

            // 处理TAF数据
            if (tafData.error) {
                console.error('TAF错误:', tafData.error);
                this.updateTAFDisplay(null, true);
            } else {
                const parsedTAF = this.parseTAF(tafData);
                this.updateTAFDisplay(parsedTAF);
            }

            const now = new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            });
            this.updateStatus(`最后更新: ${now} UTC`);

        } catch (error) {
            console.error('更新天气数据失败:', error);
            this.updateStatus('天气数据更新失败', true);
            this.updateMETARDisplay(null, true);
            this.updateTAFDisplay(null, true);
        } finally {
            this.isUpdating = false;
        }
    }

    // 初始化
    init() {
        // 页面加载时立即更新一次
        this.updateWeatherData();
        
        // 设置定时更新
        setInterval(() => {
            this.updateWeatherData();
        }, this.updateInterval);

        // 绑定手动更新按钮
        const refreshBtn = document.getElementById('weather-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (!this.isUpdating) {
                    this.updateWeatherData();
                }
            });
        }

        // 绑定切换按钮
        this.bindToggleButtons();
    }

    // 绑定切换按钮事件
    bindToggleButtons() {
        const metarBtn = document.getElementById('toggle-metar');
        const tafBtn = document.getElementById('toggle-taf');
        const metarContent = document.getElementById('real-time-metar-content');
        const tafContent = document.getElementById('real-time-taf-content');

        if (metarBtn && tafBtn && metarContent && tafContent) {
            metarBtn.addEventListener('click', () => {
                metarContent.style.display = 'block';
                tafContent.style.display = 'none';
                metarBtn.classList.add('active');
                tafBtn.classList.remove('active');
            });

            tafBtn.addEventListener('click', () => {
                metarContent.style.display = 'none';
                tafContent.style.display = 'block';
                metarBtn.classList.remove('active');
                tafBtn.classList.add('active');
            });
        }
    }
}

// 初始化天气API
let weatherAPI;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    weatherAPI = new WeatherAPI();
    weatherAPI.init();
});
