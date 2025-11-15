// METAR解码功能
function decodeMETAR() {
    const metarText = document.getElementById('metar-input').value.trim();
    if (!metarText) {
        alert('请输入METAR代码');
        return;
    }

    let resultHTML = "<h4>METAR解码结果:</h4>";
    const parts = metarText.split(' ').filter(part => part !== '');

    // 机场代码
    const airportCodes = {
        'VHHH': '香港国际机场',
        'ZGGG': '广州白云国际机场',
        'ZBAA': '北京首都国际机场',
        'ZSSS': '上海虹桥国际机场',
        'ZSPD': '上海浦东国际机场',
        'WSSS': '新加坡樟宜机场',
    };

    // 天气现象代码映射
    const weatherCodes = {
        'RA': '降雨',
        'DZ': '毛毛雨',
        'SN': '降雪',
        'SG': '雪粒',
        'IC': '冰晶',
        'PL': '冰粒',
        'GR': '冰雹',
        'GS': '小冰雹',
        'UP': '未知降水',
        'FG': '雾',
        'BR': '轻雾',
        'HZ': '霾',
        'DU': '浮尘',
        'SA': '扬沙',
        'VA': '火山灰',
        'PY': '喷雾',
        'SQ': '飑',
        'FC': '漏斗云',
        'DS': '尘暴',
        'SS': '沙暴',
        'PO': '尘卷/沙卷',
        'TS': '雷暴',
        'SH': '阵性降水',
        'FZ': '冻结'
    };

    // 云量代码映射
    const cloudCodes = {
        'SKC': '碧空',
        'CLR': '无云',
        'NSC': '无显著云',
        'FEW': '少云',
        'SCT': '散云',
        'BKN': '裂云',
        'OVC': '阴天',
        'VV': '垂直能见度'
    };

    // 解析每个部分
    parts.forEach(part => {
        // 报告类型
        if (part === 'METAR' || part === 'SPECI') {
            resultHTML += `<div class="result-item"><strong>报告类型</strong>: ${part === 'METAR' ? '航空例行天气报告' : '特殊天气报告'}</div>`;
        }
        // 机场代码
        else if (part in airportCodes) {
            resultHTML += `<div class="result-item"><strong>机场</strong>: ${airportCodes[part]} (${part})</div>`;
        }
        // 时间组 (日/时分Z)
        else if (part.match(/^\d{6}Z$/)) {
            const day = part.substr(0, 2);
            const time = part.substr(2, 2) + ':' + part.substr(4, 2);
            resultHTML += `<div class="result-item"><strong>观测时间</strong>: 当月${day}日 ${time} UTC</div>`;
        }
        // 修正报告
        else if (part === 'COR') {
            resultHTML += `<div class="result-item"><strong>修正报告</strong>: 此报告为修正报告</div>`;
        }
        // 自动观测
        else if (part === 'AUTO') {
            resultHTML += `<div class="result-item"><strong>观测方式</strong>: 自动观测站报告</div>`;
        }
        // 风向风速 (常规)
        else if (part.match(/^\d{5}KT$/)) {
            const windDir = part.substr(0, 3);
            const windSpeed = part.substr(3, 2);
            resultHTML += `<div class="result-item"><strong>地面风</strong>: 风向 ${windDir}°, 风速 ${windSpeed}节</div>`;
        }
        // 风向风速 (带阵风)
        else if (part.match(/^\d{5}G\d{2,3}KT$/)) {
            const windDir = part.substr(0, 3);
            const baseSpeed = part.substring(3, part.indexOf('G'));
            const gustSpeed = part.substring(part.indexOf('G') + 1, part.indexOf('KT'));
            resultHTML += `<div class="result-item"><strong>地面风</strong>: 风向 ${windDir}°, 风速 ${baseSpeed}节, 阵风 ${gustSpeed}节</div>`;
        }
        // 风向变化范围
        else if (part.match(/^\d{3}V\d{3}$/)) {
            const directions = part.split('V');
            resultHTML += `<div class="result-item"><strong>风向变化</strong>: 从 ${directions[0]}° 到 ${directions[1]}° 之间变化</div>`;
        }
        // 能见度
        else if (part.match(/^\d{4}$/)) {
            const visibility = parseInt(part);
            resultHTML += `<div class="result-item"><strong>能见度</strong>: ${visibility} 米</div>`;
        }
        else if (part.match(/^\d{4}[NSEW]?$/)) {
            let direction = '';
            if (part.includes('N')) direction = '北';
            else if (part.includes('S')) direction = '南';
            else if (part.includes('E')) direction = '东';
            else if (part.includes('W')) direction = '西';

            const visibility = parseInt(part.match(/\d+/)[0]);
            resultHTML += `<div class="result-item"><strong>能见度</strong>: ${visibility} 米${direction ? ` (${direction}方向)` : ''}</div>`;
        }
        else if (part.match(/^[PM]?\d{1,2}\/\d{1,2}(SM|KM)$/)) {
            const partsVis = part.split('/');
            const wholePart = partsVis[0];
            let numerator = partsVis[1].replace('SM', '').replace('KM', '');
            let unit = part.includes('SM') ? '英里' : '公里';

            if (wholePart.includes('M')) {
                numerator = wholePart.replace('M', '');
                resultHTML += `<div class="result-item"><strong>能见度</strong>: 小于 ${numerator}/${numerator} ${unit}</div>`;
            } else if (wholePart.includes('P')) {
                numerator = wholePart.replace('P', '');
                resultHTML += `<div class="result-item"><strong>能见度</strong>: 大于 ${numerator}/${numerator} ${unit}</div>`;
            } else {
                resultHTML += `<div class="result-item"><strong>能见度</strong>: ${wholePart}/${numerator} ${unit}</div>`;
            }
        }
        // 天气现象
        else if (part in weatherCodes ||
            part.match(/^(\+|-|VC)?(TS|SH|FZ|BL|DR|MI|BC|PR|RA|DZ|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)$/)) {
            let intensity = '';
            let proximity = '';
            let descriptor = '';
            let precipitation = '';
            let obscuration = '';
            let other = '';

            if (part.startsWith('+')) {
                intensity = '强';
                part = part.substring(1);
            } else if (part.startsWith('-')) {
                intensity = '轻';
                part = part.substring(1);
            } else if (part.startsWith('VC')) {
                proximity = '附近';
                part = part.substring(2);
            }

            // 描述符
            const descriptors = ['MI', 'BC', 'PR', 'DR', 'BL', 'SH', 'TS', 'FZ'];
            for (const desc of descriptors) {
                if (part.startsWith(desc)) {
                    descriptor = desc;
                    part = part.substring(desc.length);
                    break;
                }
            }

            // 降水类型
            const precipitations = ['RA', 'DZ', 'SN', 'SG', 'IC', 'PL', 'GR', 'GS', 'UP'];
            for (const prec of precipitations) {
                if (part === prec) {
                    precipitation = prec;
                    break;
                }
            }

            // 视程障碍现象
            const obscurations = ['BR', 'FG', 'FU', 'VA', 'DU', 'SA', 'HZ', 'PY'];
            for (const obsc of obscurations) {
                if (part === obsc) {
                    obscuration = obsc;
                    break;
                }
            }

            // 其他现象
            const others = ['PO', 'SQ', 'FC', 'SS', 'DS'];
            for (const oth of others) {
                if (part === oth) {
                    other = oth;
                    break;
                }
            }

            let weatherDesc = intensity;

            if (descriptor) {
                const descriptorNames = {
                    'MI': '浅薄的', 'BC': '散片的', 'PR': '部分的',
                    'DR': '低吹的', 'BL': '高吹的', 'SH': '阵性的',
                    'TS': '雷暴', 'FZ': '冻结的'
                };
                weatherDesc += descriptorNames[descriptor] || descriptor;
            }

            if (precipitation) {
                weatherDesc += weatherCodes[precipitation] || precipitation;
            } else if (obscuration) {
                weatherDesc += weatherCodes[obscuration] || obscuration;
            } else if (other) {
                weatherDesc += weatherCodes[other] || other;
            }

            weatherDesc += proximity;

            resultHTML += `<div class="result-item"><strong>天气现象</strong>: ${weatherDesc}</div>`;
        }
        // 云层信息
        else if (part.match(/^(VV|FEW|SCT|BKN|OVC|SKC|NSC|CLR)\d{3}/) || part === 'SKC' || part === 'NSC' || part === 'CLR') {
            if (part === 'SKC' || part === 'NSC' || part === 'CLR') {
                resultHTML += `<div class="result-item"><strong>云量</strong>: ${cloudCodes[part]}</div>`;
            } else {
                const cloudType = part.substr(0, 3);
                const cloudHeight = parseInt(part.substr(3)) * 100;
                let cloudInfo = `${cloudCodes[cloudType] || cloudType} 高度 ${cloudHeight}英尺`;

                if (part.length > 6 && part.substr(4, 2) === 'CB') {
                    cloudInfo += ' (积雨云)';
                } else if (part.length > 6 && part.substr(4, 2) === 'TCU') {
                    cloudInfo += ' (浓积云)';
                }

                resultHTML += `<div class="result-item"><strong>云况</strong>: ${cloudInfo}</div>`;
            }
        }
        // 温度/露点
        else if (part.match(/^[M]?\d{2}\/[M]?\d{2}$/)) {
            let temp = part.split('/')[0];
            let dewpoint = part.split('/')[1];

            if (temp.startsWith('M')) {
                temp = '-' + temp.substring(1);
            }

            if (dewpoint.startsWith('M')) {
                dewpoint = '-' + dewpoint.substring(1);
            }

            resultHTML += `<div class="result-item"><strong>温度/露点</strong>: ${temp}°C / ${dewpoint}°C</div>`;
        }
        // 气压 (QNH)
        else if (part.match(/^Q\d{4}$/)) {
            const pressure = part.substr(1);
            resultHTML += `<div class="result-item"><strong>气压 (QNH)</strong>: ${pressure} hPa</div>`;
        }
        // 气压 (AXXX)
        else if (part.match(/^A\d{4}$/)) {
            const pressure = parseInt(part.substr(1)) / 100;
            resultHTML += `<div class="result-item"><strong>气压</strong>: ${pressure.toFixed(2)} 英寸汞柱</div>`;
        }
        // 趋势预报
        else if (part.match(/^(BECMG|TEMPO|NOSIG)$/)) {
            const trendNames = {
                'BECMG': '逐渐变为',
                'TEMPO': '短暂波动',
                'NOSIG': '无显著变化'
            };
            resultHTML += `<div class="result-item"><strong>趋势</strong>: ${trendNames[part]}</div>`;
        }
        // 跑道视程
        else if (part.match(/^R\d{2}[LCR]?\/[PM]?\d{4}(VP\d{4})?[UDN]?$/)) {
            const match = part.match(/^R(\d{2}[LCR]?)\/([PM]?)(\d{4})(VP(\d{4}))?([UDN])?/);
            const runway = match[1];
            let minVis = match[3];
            const tendency = match[6] || '';

            if (match[2] === 'P') {
                minVis = '大于' + minVis;
            } else if (match[2] === 'M') {
                minVis = '小于' + minVis;
            }

            let tendencyText = '';
            if (tendency === 'U') tendencyText = '上升';
            else if (tendency === 'D') tendencyText = '下降';
            else if (tendency === 'N') tendencyText = '无变化';

            resultHTML += `<div class="result-item"><strong>跑道视程</strong>: 跑道${runway} 视程 ${minVis} 米${tendencyText ? ` (${tendencyText})` : ''}</div>`;
        }
        // 最近天气
        else if (part.match(/^RE(\w{2,4})$/)) {
            const weather = part.substring(2);
            resultHTML += `<div class="result-item"><strong>最近天气</strong>: 近期有 ${weatherCodes[weather] || weather}</div>`;
        }
        // 风切变
        else if (part.match(/^WS\w{3}\//)) {
            resultHTML += `<div class="result-item"><strong>风切变警告</strong>: 存在风切变</div>`;
        }
        // 颜色代码
        else if (part.match(/^(BLACK|BLU|WHT|GRN|YLO|AMB|RED)$/)) {
            const colorCodes = {
                'BLACK': '黑色 - 危险天气条件',
                'BLU': '蓝色 - 目视飞行规则',
                'WHT': '白色 - 目视飞行规则',
                'GRN': '绿色 - 仪表飞行规则',
                'YLO': '黄色 - 低能见度/低云底',
                'AMB': '琥珀色 - 低能见度/低云底',
                'RED': '红色 - 危险天气条件'
            };
            resultHTML += `<div class="result-item"><strong>颜色状态</strong>: ${colorCodes[part] || part}</div>`;
        }
    });

    document.getElementById('metar-result').innerHTML = resultHTML;
}

// TAF解码功能
function decodeTAF() {
    const tafText = document.getElementById('taf-input').value.trim();
    if (!tafText) {
        alert('请输入TAF代码');
        return;
    }

    let resultHTML = "<h4>TAF解码结果:</h4>";
    const parts = tafText.split(' ').filter(part => part !== '');

    // 机场代码
    const airportCodes = {
        'VHHH': '香港国际机场',
        'ZGGG': '广州白云国际机场',
        'ZBAA': '北京首都国际机场',
        'ZSSS': '上海虹桥国际机场',
        'ZSPD': '上海浦东国际机场',
        'WSSS': '新加坡樟宜机场',
    };

    // 当前处理的时间段
    let currentPeriod = null;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        // TAF标识
        if (part === 'TAF') {
            resultHTML += `<div class="result-item"><strong>报告类型</strong>: 航站天气预报</div>`;
        }
        // 修正报
        else if (part === 'AMD' || part === 'COR') {
            resultHTML += `<div class="result-item"><strong>修正报</strong>: 此预报为修正预报</div>`;
        }
        // 机场代码
        else if (part in airportCodes) {
            resultHTML += `<div class="result-item"><strong>机场</strong>: ${airportCodes[part]} (${part})</div>`;
        }
        // 发布时间
        else if (part.match(/^\d{6}Z$/)) {
            const day = part.substr(0, 2);
            const time = part.substr(2, 2) + ':' + part.substr(4, 2);
            resultHTML += `<div class="result-item"><strong>发布时间</strong>: 当月${day}日 ${time} UTC</div>`;
        }
        // 有效期
        else if (part.match(/^\d{4}\/\d{4}$/)) {
            const from = part.substr(0, 2) + ':' + part.substr(2, 2);
            const to = part.substr(5, 2) + ':' + part.substr(7, 2);
            resultHTML += `<div class="result-item"><strong>有效期</strong>: ${from} UTC 至 ${to} UTC</div>`;
            currentPeriod = { from, to };
        }
        // 风速风向 (与METAR相同)
        else if (part.match(/^\d{5}KT$/) || part.match(/^\d{5}G\d{2,3}KT$/)) {
            let windInfo = '';
            if (part.match(/^\d{5}KT$/)) {
                const windDir = part.substr(0, 3);
                const windSpeed = part.substr(3, 2);
                windInfo = `风向 ${windDir}°, 风速 ${windSpeed}节`;
            } else {
                const windDir = part.substr(0, 3);
                const baseSpeed = part.substring(3, part.indexOf('G'));
                const gustSpeed = part.substring(part.indexOf('G') + 1, part.indexOf('KT'));
                windInfo = `风向 ${windDir}°, 风速 ${baseSpeed}节, 阵风 ${gustSpeed}节`;
            }

            if (currentPeriod) {
                resultHTML += `<div class="result-item"><strong>预报风况 (${currentPeriod.from}-${currentPeriod.to})</strong>: ${windInfo}</div>`;
            } else {
                resultHTML += `<div class="result-item"><strong>预报风况</strong>: ${windInfo}</div>`;
            }
        }
        // 能见度
        else if (part.match(/^\d{4}$/) || part.match(/^\d{4}[NSEW]?$/) || part.match(/^[PM]?\d{1,2}\/\d{1,2}(SM|KM)$/)) {
            let visibilityInfo = '';

            if (part.match(/^\d{4}$/)) {
                const visibility = parseInt(part);
                visibilityInfo = `${visibility} 米`;
            }
            else if (part.match(/^\d{4}[NSEW]?$/)) {
                let direction = '';
                if (part.includes('N')) direction = '北';
                else if (part.includes('S')) direction = '南';
                else if (part.includes('E')) direction = '东';
                else if (part.includes('W')) direction = '西';

                const visibility = parseInt(part.match(/\d+/)[0]);
                visibilityInfo = `${visibility} 米${direction ? ` (${direction}方向)` : ''}`;
            }
            else if (part.match(/^[PM]?\d{1,2}\/\d{1,2}(SM|KM)$/)) {
                const partsVis = part.split('/');
                const wholePart = partsVis[0];
                let numerator = partsVis[1].replace('SM', '').replace('KM', '');
                let unit = part.includes('SM') ? '英里' : '公里';

                if (wholePart.includes('M')) {
                    numerator = wholePart.replace('M', '');
                    visibilityInfo = `小于 ${numerator}/${numerator} ${unit}`;
                } else if (wholePart.includes('P')) {
                    numerator = wholePart.replace('P', '');
                    visibilityInfo = `大于 ${numerator}/${numerator} ${unit}`;
                } else {
                    visibilityInfo = `${wholePart}/${numerator} ${unit}`;
                }
            }

            if (currentPeriod) {
                resultHTML += `<div class="result-item"><strong>预报能见度 (${currentPeriod.from}-${currentPeriod.to})</strong>: ${visibilityInfo}</div>`;
            } else {
                resultHTML += `<div class="result-item"><strong>预报能见度</strong>: ${visibilityInfo}</div>`;
            }
        }
        // 天气现象
        else if (part.match(/^(\+|-|VC)?(TS|SH|FZ|BL|DR|MI|BC|PR|RA|DZ|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)$/)) {
            // 这里可以使用与METAR相同的天气解析逻辑
            // 简化处理，直接显示代码
            if (currentPeriod) {
                resultHTML += `<div class="result-item"><strong>预报天气现象 (${currentPeriod.from}-${currentPeriod.to})</strong>: ${part}</div>`;
            } else {
                resultHTML += `<div class="result-item"><strong>预报天气现象</strong>: ${part}</div>`;
            }
        }
        // 云量
        else if (part.match(/^(VV|FEW|SCT|BKN|OVC|SKC|NSC|CLR)\d{3}/) || part === 'SKC' || part === 'NSC' || part === 'CLR') {
            let cloudInfo = '';

            if (part === 'SKC' || part === 'NSC' || part === 'CLR') {
                cloudInfo = part;
            } else {
                const cloudType = part.substr(0, 3);
                const cloudHeight = parseInt(part.substr(3)) * 100;
                cloudInfo = `${cloudType} 高度 ${cloudHeight}英尺`;
            }

            if (currentPeriod) {
                resultHTML += `<div class="result-item"><strong>预报云量 (${currentPeriod.from}-${currentPeriod.to})</strong>: ${cloudInfo}</div>`;
            } else {
                resultHTML += `<div class="result-item"><strong>预报云量</strong>: ${cloudInfo}</div>`;
            }
        }
        // 变化指示符 (BECMG, TEMPO)
        else if (part === 'BECMG' || part === 'TEMPO') {
            const trendType = part === 'BECMG' ? '逐渐变为' : '短暂波动';

            // 获取时间段
            if (i + 1 < parts.length && parts[i + 1].match(/^\d{4}\/\d{4}$/)) {
                const periodPart = parts[i + 1];
                const from = periodPart.substr(0, 2) + ':' + periodPart.substr(2, 2);
                const to = periodPart.substr(5, 2) + ':' + periodPart.substr(7, 2);
                resultHTML += `<div class="result-item"><strong>变化预报</strong>: ${trendType} (${from}-${to})</div>`;
                currentPeriod = { from, to };
                i++; // 跳过下一个部分，因为我们已经处理了它
            } else {
                resultHTML += `<div class="result-item"><strong>变化预报</strong>: ${trendType}</div>`;
            }
        }
        // 概率预报
        else if (part.match(/^PROB\d{2}$/)) {
            const probability = part.replace('PROB', '');

            // 获取时间段
            if (i + 1 < parts.length && parts[i + 1].match(/^\d{4}\/\d{4}$/)) {
                const periodPart = parts[i + 1];
                const from = periodPart.substr(0, 2) + ':' + periodPart.substr(2, 2);
                const to = periodPart.substr(5, 2) + ':' + periodPart.substr(7, 2);
                resultHTML += `<div class="result-item"><strong>概率预报</strong>: ${probability}% 概率 (${from}-${to})</div>`;
                currentPeriod = { from, to };
                i++; // 跳过下一个部分，因为我们已经处理了它
            } else {
                resultHTML += `<div class="result-item"><strong>概率预报</strong>: ${probability}% 概率</div>`;
            }
        }
    }

    document.getElementById('taf-result').innerHTML = resultHTML;
}