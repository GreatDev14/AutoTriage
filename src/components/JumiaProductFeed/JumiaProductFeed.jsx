import React, { useState, useEffect } from 'react';

export const JumiaProductFeed = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const [storeConfig, setStoreConfig] = useState({ name: 'JUMIA ⭐', color: 'text-orange-500', bg: 'from-orange-600 to-orange-500', currency: '₦' });
  const [activeTab, setActiveTab] = useState('JUMIA');
  const [basePrice, setBasePrice] = useState(0);

  const NG_STORES = {
    JUMIA: { id: 'JUMIA', name: 'JUMIA ⭐', color: 'text-orange-500', bg: 'from-orange-600 to-orange-500', currency: '₦', mult: 1, action: 'Proceed to Payment' },
    KONGA: { id: 'KONGA', name: 'KONGA 🛍️', color: 'text-fuchsia-500', bg: 'from-fuchsia-600 to-fuchsia-500', currency: '₦', mult: 0.98, action: 'Buy on Konga' },
    ALIEXPRESS: { id: 'ALIEXPRESS', name: 'ALIEXPRESS 🌐', color: 'text-[#ff4747]', bg: 'from-[#ff4747] to-[#cc0000]', currency: '$', mult: 0.00065, action: 'Order from Global' },
    LOCAL: { id: 'LOCAL', name: 'LOCAL DEALER 🤝', color: 'text-emerald-500', bg: 'from-emerald-600 to-emerald-500', currency: '₦', mult: 0.95, action: 'Order via WhatsApp' }
  };

  useEffect(() => {
    // Universal Checkout Function exposed to Vanilla JS
    window.openAffiliateModal = (title, price, oemPrice, thumbnailUrl, linkUrl, storeType = 'JUMIA') => {
      
      setBasePrice(price);
      
      if (storeType === 'NG_MULTI') {
        setActiveTab('JUMIA');
        setStoreConfig(NG_STORES.JUMIA);
      } else {
        // Determine dynamic store UI theme for single store mode
        let config = { name: 'JUMIA ⭐', color: 'text-orange-500', bg: 'from-orange-600 to-orange-500', currency: '₦' };
        if (storeType === 'AMAZON') config = { name: 'AMAZON 📦', color: 'text-[#ff9900]', bg: 'from-[#ff9900] to-[#e47911]', currency: '$' };
        if (storeType === 'EBAY') config = { name: 'EBAY 🛒', color: 'text-[#e53238]', bg: 'from-[#e53238] to-[#0064d2]', currency: '£' };
        if (storeType === 'ALIEXPRESS') config = { name: 'ALIEXPRESS 🛍️', color: 'text-[#ff4747]', bg: 'from-[#ff4747] to-[#cc0000]', currency: '$' };
        if (storeType === 'GLOBAL') config = { name: 'GLOBAL STORE 🌐', color: 'text-purple-500', bg: 'from-purple-600 to-purple-500', currency: '$' };
        setStoreConfig(config);
        setActiveTab('SINGLE');
      }

      // Initialize the modal state immediately
      setSelectedProduct({
        title,
        price,
        oemPrice,
        thumbnailUrl: thumbnailUrl === 'FETCH_REAL_IMAGE' ? '' : thumbnailUrl,
        linkUrl,
        rating: 4.8,
        reviews: Math.floor(Math.random() * 500) + 120
      });
      
      // If requested, trigger the real backend scraper!
      // (The backend currently scrapes Jumia, but the image is a universal product image)
      if (thumbnailUrl === 'FETCH_REAL_IMAGE') {
        setIsFetchingImage(true);
        fetch(`/api/scrape-image?q=${encodeURIComponent(title)}`)
          .then(res => res.json())
          .then(data => {
            if (data.imageUrl) {
              setSelectedProduct(prev => prev ? { ...prev, thumbnailUrl: data.imageUrl } : null);
            } else {
              throw new Error('No image found');
            }
          })
          .catch(err => {
            console.error('Failed to scrape real image, falling back:', err);
            const fallbackPrompt = `isolated automotive auto part, high quality product photography, white background`;
            const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=600&height=400&nologo=true`;
            setSelectedProduct(prev => prev ? { ...prev, thumbnailUrl: fallbackUrl } : null);
          })
          .finally(() => {
            setIsFetchingImage(false);
          });
      }
    };

    return () => {
      delete window.openAffiliateModal;
    };
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const config = NG_STORES[tabId];
    setStoreConfig(config);
    if (selectedProduct && basePrice) {
      setSelectedProduct({
        ...selectedProduct,
        price: Math.round(basePrice * config.mult),
        oemPrice: Math.round(basePrice * 1.5 * config.mult)
      });
    }
  };

  const formatPrice = (val) => val ? val.toLocaleString() : '0';

  const closeModal = () => {
    setSelectedProduct(null);
  };

  // If nothing is selected, render absolutely nothing.
  if (!selectedProduct) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center"
      style={{ animation: 'fadeIn 0.2s ease-out', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Checkout Modal Sheet */}
      <div className="bg-[#0f1015] w-full max-w-md mx-auto rounded-t-[32px] rounded-b-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col h-[85vh] animate-slide-up relative">
        
        {/* Top Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 bg-[#14151a]">
          <div className="flex items-center gap-2">
            <h1 className={`${storeConfig.color} font-black text-2xl tracking-tighter`}>{storeConfig.name}</h1>
            <span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> SECURE CHECKOUT
            </span>
          </div>
          <button 
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Multi-Vendor Tabs */}
        {activeTab !== 'SINGLE' && (
          <div className="flex px-4 py-3 gap-2 overflow-x-auto no-scrollbar bg-[#14151a] border-b border-white/5 shrink-0 shadow-inner">
            {Object.keys(NG_STORES).map(key => {
              const store = NG_STORES[key];
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                    isActive ? `bg-white/10 ${store.color} border-white/20` : 'text-gray-500 bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  {store.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Mock Embedded Content */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          
          <div className="bg-gradient-to-br from-[#1a1c23] to-[#0a0a0a] rounded-3xl mb-6 border border-white/5 shadow-inner relative overflow-hidden h-56 w-full flex items-center justify-center">
            <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${storeConfig.color.replace('text-', 'from-')}/10 via-transparent to-transparent`}></div>
            
            {/* Background Loading Spinner */}
            {isFetchingImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-0 opacity-70">
                 <div className={`w-8 h-8 border-4 ${storeConfig.color.replace('text-', 'border-')}/20 ${storeConfig.color.replace('text-', 'border-t-')} rounded-full animate-spin mb-3`}></div>
                 <div className={`text-[10px] ${storeConfig.color} font-mono uppercase tracking-widest animate-pulse`}>Generating Image...</div>
              </div>
            )}

            {/* The Actual Image */}
            <img 
              src={selectedProduct.thumbnailUrl} 
              alt={selectedProduct.title} 
              className={`absolute inset-0 h-full w-full object-contain drop-shadow-2xl z-20 p-2 ${isFetchingImage ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}`}
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = document.getElementById('jumia-image-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />

            {/* Failsafe Fallback Container (Hidden initially) */}
            <div id="jumia-image-fallback" className="absolute inset-0 flex-col items-center justify-center z-30 hidden bg-gradient-to-br from-[#1a1c23] to-[#0a0a0a]">
              <div className="text-6xl mb-2 filter drop-shadow-xl">📦</div>
              <div className={`${storeConfig.color}/50 font-black text-2xl uppercase tracking-widest`}>AUTO PART</div>
            </div>
          </div>
          
          <h2 className="text-white text-2xl font-black leading-tight mb-3">
            {selectedProduct.title}
          </h2>
          
          <div className="flex items-end gap-3 mb-6 relative">
            <div className={`text-4xl font-black ${storeConfig.color} leading-none`}>
              {storeConfig.name.includes('AMAZON') ? '$' : storeConfig.name.includes('EBAY') ? '£' : '₦'}{selectedProduct.price.toLocaleString()}
            </div>
            {selectedProduct.oemPrice > selectedProduct.price && (
              <div className="text-base text-gray-500 font-medium line-through mb-1">
                {storeConfig.name.includes('AMAZON') ? '$' : storeConfig.name.includes('EBAY') ? '£' : '₦'}{selectedProduct.oemPrice.toLocaleString()}
              </div>
            )}
          </div>
          <div className="bg-[#141517] border border-white/10 rounded-3xl p-5 mb-6 shadow-lg">
            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-2xl shadow-inner border border-orange-500/20">🚚</div>
              <div>
                <div className="text-white text-[15px] font-bold">Doorstep Delivery</div>
                <div className="text-gray-400 text-[11px] mt-1 font-medium">Arrives in 2-4 business days</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl shadow-inner border border-blue-500/20">🛡️</div>
              <div>
                <div className="text-white text-[15px] font-bold">Jumia Return Policy</div>
                <div className="text-gray-400 text-[11px] mt-1 font-medium">Free return within 7 days</div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 font-mono break-all mb-8 bg-black/60 p-4 rounded-2xl border border-white/5 shadow-inner">
            <div className="text-orange-500 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              Tracking Link Active
            </div>
            <span className="opacity-70">{selectedProduct.affiliateTrackingUrl}</span>
          </div>

          <button 
            onClick={() => window.open(selectedProduct.linkUrl, '_blank')}
            className={`w-full bg-gradient-to-r ${storeConfig.bg} text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 text-lg uppercase tracking-wider`}
          >
            {storeConfig.action || 'Proceed to Payment'} <span className="text-xl">➔</span>
          </button>
          
          <div className="text-center mt-4 mb-2">
            <span className="text-[10px] text-gray-600 font-medium flex items-center justify-center gap-1">
              🔒 Safe & Secure Checkout via {storeConfig.name.replace(/[^A-Za-z ]/g, '').trim()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
