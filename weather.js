// APIAPI
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, station = 'VHHH' } = req.query;

  try {
    let apiUrl;
    
    if (type === 'metar') {
      apiUrl = `https://aviationweather.gov/api/data/metar?ids=${station}&format=raw`;
    } else if (type === 'taf') {
      apiUrl = `https://aviationweather.gov/api/data/taf?ids=${station}&format=raw`;
    } else {
      return res.status(400).json({ error: 'Invalid type parameter' });
    }

    console.log('Fetching weather data from:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    
    console.log('Weather data received');
    
    // 返回原始文本数据
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(data);
    
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
};
