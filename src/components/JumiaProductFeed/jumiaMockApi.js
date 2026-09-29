export const MOCK_JUMIA_PRODUCTS = [
  {
    id: 'jumia_auto_1',
    title: 'Ancel AD310 Classic Enhanced Universal OBD2 Scanner',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486262715619-673fa524376b?w=400&q=80',
    regularPrice: 35000,
    salePrice: 22500,
    discountPercentage: '-35%',
    stockLeft: 2,
    affiliateTrackingUrl: 'https://www.jumia.com.ng/catalog/?q=ancel+obd2+scanner&utm_source=autotriage'
  },
  {
    id: 'jumia_auto_2',
    title: '12V Digital Car Tire Inflator Air Compressor',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635398205461-9c60613a0787?w=400&q=80',
    regularPrice: 28500,
    salePrice: 18900,
    discountPercentage: '-33%',
    stockLeft: 5,
    affiliateTrackingUrl: 'https://www.jumia.com.ng/catalog/?q=digital+tire+inflator&utm_source=autotriage'
  },
  {
    id: 'jumia_auto_3',
    title: 'Heavy Duty 3 Ton Hydraulic Floor Jack',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633519109033-911bc933db6a?w=400&q=80',
    regularPrice: 65000,
    salePrice: 49500,
    discountPercentage: '-23%',
    stockLeft: 1,
    affiliateTrackingUrl: 'https://www.jumia.com.ng/catalog/?q=hydraulic+car+jack&utm_source=autotriage'
  },
  {
    id: 'jumia_auto_4',
    title: 'Premium Microfiber Towel Set (Pack of 6)',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80',
    regularPrice: 12000,
    salePrice: 8500,
    discountPercentage: '-29%',
    stockLeft: 12,
    affiliateTrackingUrl: 'https://www.jumia.com.ng/catalog/?q=microfiber+car+towel&utm_source=autotriage'
  },
  {
    id: 'jumia_auto_5',
    title: '1000A Portable Car Jump Starter Power Bank',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590480396590-449e7b40974b?w=400&q=80',
    regularPrice: 45000,
    salePrice: 38000,
    discountPercentage: '-15%',
    stockLeft: 3,
    affiliateTrackingUrl: 'https://www.jumia.com.ng/catalog/?q=portable+jump+starter&utm_source=autotriage'
  },
  {
    id: 'jumia_auto_6',
    title: 'Ceramic Coating Car Wax Polish Spray',
    thumbnailUrl: 'https://images.unsplash.com/photo-1606577884896-bc9829f79b6d?w=400&q=80',
    regularPrice: 15500,
    salePrice: 9900,
    discountPercentage: '-36%',
    stockLeft: 8,
    affiliateTrackingUrl: 'https://www.jumia.com.ng/catalog/?q=ceramic+car+coating&utm_source=autotriage'
  }
];

/**
 * Simulates fetching products from an external API (Route 3 Custom API Sync)
 * with a realistic network latency.
 */
export const fetchJumiaProducts = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_JUMIA_PRODUCTS);
    }, 1500); // 1.5 second loading timeout
  });
};
