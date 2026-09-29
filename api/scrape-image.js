const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) {
      return res.status(400).json({ error: 'Query required' });
    }

    // Scrape Jumia directly for the exact auto part
    const searchUrl = `https://www.jumia.com.ng/catalog/?q=${encodeURIComponent(q)}`;
    
    // Use a desktop User-Agent to prevent Jumia from blocking the request
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      },
      timeout: 8000
    });

    const $ = cheerio.load(response.data);
    let imageUrl = '';
    
    // Extract the first product image from Jumia's catalog
    // Jumia usually stores the actual high-res image in data-src due to lazy-loading
    $('article.prd img.img').each((i, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src');
      if (src && src.startsWith('http') && !src.includes('data:image')) {
        imageUrl = src;
        return false; // Stop after first valid image
      }
    });

    if (imageUrl) {
      return res.status(200).json({ success: true, imageUrl });
    } else {
      return res.status(404).json({ success: false, error: 'No image found on Jumia' });
    }
    
  } catch (err) {
    console.error('Scrape API Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
