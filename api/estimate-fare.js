const geocode = require('./geocode');
const uberApi = require('./uber-api');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { providerId, pickupLocation, destination, advancedOptions } = req.body;

    if (!providerId || !pickupLocation || !destination) {
      return res.status(400).json({ error: 'Missing required parameters: providerId, pickupLocation, destination' });
    }

    console.log(`[FARE API] Resolving addresses: Pickup: "${pickupLocation}", Destination: "${destination}"`);
    
    // Resolve coordinates
    const pickupCoords = await geocode(pickupLocation);
    const destCoords = await geocode(destination);

    let vehicles = [];
    let isRealEstimation = false;
    let errorDetail = null;

    if (providerId === 'uber' && uberApi.getAccessToken()) {
      try {
        console.log(`[FARE API] Requesting active products from Uber API for lat: ${pickupCoords.latitude}, lng: ${pickupCoords.longitude}...`);
        const productResponse = await uberApi.getProducts(pickupCoords.latitude, pickupCoords.longitude);
        
        if (productResponse && productResponse.products && productResponse.products.length > 0) {
          console.log(`[FARE API] Found ${productResponse.products.length} products. Fetching estimates...`);
          
          // Get estimates for the top products in parallel
          const estimatePromises = productResponse.products.slice(0, 3).map(async (prod) => {
            try {
              const est = await uberApi.getEstimate(
                prod.product_id,
                pickupCoords.latitude,
                pickupCoords.longitude,
                destCoords.latitude,
                destCoords.longitude
              );
              return {
                id: prod.product_id,
                name: prod.display_name || 'Uber',
                price: est.fare?.display || est.estimate?.display || '$25.00',
                eta: est.pickup_estimate || 5,
                capacity: prod.capacity || 4,
                desc: prod.description || 'Uber Ride Services',
                fareId: est.fare_id
              };
            } catch (estErr) {
              console.warn(`[FARE API] Could not get estimate for product ${prod.display_name}:`, estErr.message || estErr);
              return null;
            }
          });

          const resolvedEstimates = await Promise.all(estimatePromises);
          vehicles = resolvedEstimates.filter(v => v !== null);
          
          if (vehicles.length > 0) {
            isRealEstimation = true;
          }
        }
      } catch (uberErr) {
        errorDetail = uberErr.message || JSON.stringify(uberErr);
        console.warn('[FARE API] Uber API call failed, falling back to simulated telemetry:', errorDetail);
      }
    }

    // Fallback if not Uber, no token, or API failed/empty
    if (!isRealEstimation) {
      console.log(`[FARE API] Using high-fidelity simulated telemetry for ${providerId}...`);
      
      // Simulate real-world network delay for fetching fares
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate simulated vehicles based on the provider
      if (providerId === 'uber') {
        vehicles = [
          { id: 'uber_x', name: 'UberX', price: '$14.50', eta: 3, capacity: 4, desc: 'Affordable, everyday rides (Simulated)' },
          { id: 'uber_comfort', name: 'Comfort', price: '$19.20', eta: 5, capacity: 4, desc: 'Newer cars with extra legroom (Simulated)' },
          { id: 'uber_black', name: 'Black VIP', price: '$38.00', eta: 2, capacity: 4, desc: 'Premium rides in luxury cars (Simulated)' },
          { id: 'uber_xl', name: 'UberXL', price: '$24.50', eta: 6, capacity: 6, desc: 'Affordable rides for groups up to 6 (Simulated)' }
        ];
      } else if (providerId === 'lyft') {
        vehicles = [
          { id: 'lyft_standard', name: 'Lyft', price: '$13.80', eta: 4, capacity: 4, desc: 'Standard rides (Simulated)' },
          { id: 'lyft_preferred', name: 'Preferred', price: '$18.50', eta: 6, capacity: 4, desc: 'Top-rated drivers, newer cars (Simulated)' },
          { id: 'lyft_lux', name: 'Lyft Lux', price: '$35.00', eta: 3, capacity: 4, desc: 'High-end sedans with top drivers (Simulated)' }
        ];
      } else if (providerId === 'bolt') {
        vehicles = [
          { id: 'bolt_base', name: 'Bolt', price: '$11.00', eta: 2, capacity: 4, desc: 'Fast and affordable (Simulated)' },
          { id: 'bolt_comfort', name: 'Comfort', price: '$15.50', eta: 5, capacity: 4, desc: 'Spacious and comfortable (Simulated)' },
          { id: 'bolt_premium', name: 'Premium', price: '$25.00', eta: 4, capacity: 4, desc: 'High-quality cars (Simulated)' }
        ];
      } else if (providerId === 'didi') {
        vehicles = [
          { id: 'didi_express', name: 'DiDi Express', price: '$10.50', eta: 3, capacity: 4, desc: 'Affordable every day rides (Simulated)' },
          { id: 'didi_comfort', name: 'DiDi Comfort', price: '$14.00', eta: 5, capacity: 4, desc: 'Newer cars with top-rated drivers (Simulated)' }
        ];
      } else if (providerId === 'grab') {
        vehicles = [
          { id: 'grab_share', name: 'GrabShare', price: '$8.50', eta: 6, capacity: 4, desc: 'Shared ride for savings (Simulated)' },
          { id: 'grab_car', name: 'GrabCar', price: '$12.00', eta: 4, capacity: 4, desc: 'Everyday private car (Simulated)' },
          { id: 'grab_premium', name: 'GrabPremium', price: '$22.00', eta: 3, capacity: 4, desc: 'Premium vehicles with top-rated drivers (Simulated)' }
        ];
      } else if (providerId === 'indrive') {
        vehicles = [
          { id: 'indrive_moto', name: 'inDrive Moto', price: '$5.00', eta: 2, capacity: 1, desc: 'Fast motorcycle transport (Simulated)' },
          { id: 'indrive_comfort', name: 'inDrive Comfort', price: '$13.50', eta: 7, capacity: 4, desc: 'Your offer, driver\'s choice - comfort (Simulated)' },
          { id: 'indrive_cargo', name: 'inDrive Cargo', price: '$30.00', eta: 15, capacity: 2, desc: 'Moving and delivery services (Simulated)' }
        ];
      } else {
        vehicles = [
          { id: 'standard', name: 'Standard', price: '$15.00', eta: 5, capacity: 4, desc: 'Standard ride (Simulated)' }
        ];
      }
    }

    // Apply some multipliers if advanced options exist (simulating surge or premium requests)
    if (advancedOptions && advancedOptions.schedule) {
      vehicles.forEach(v => {
        v.price = '$' + (parseFloat(v.price.replace('$', '')) * 1.2).toFixed(2);
        v.desc += ' (Scheduled Fare)';
      });
    }

    return res.status(200).json({
      success: true,
      provider: providerId,
      currency: 'USD',
      realTime: isRealEstimation,
      vehicles: vehicles,
      errorDetail: errorDetail
    });
  } catch (err) {
    console.error('[FARE API] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
