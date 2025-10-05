const API_URL = 'http://localhost:5000/api';

async function loginAndCreateEvents() {
  try {
    console.log('Logging in...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: 'demo@onemore.app', password: 'demo1234'})
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Logged in successfully!\n');

    const events = [
      {
        title: 'Polish Pierogi Cooking Workshop',
        description: 'Learn to make traditional Polish pierogi with experienced chefs in a historic 13th-century cellar. All ingredients and recipes included!',
        category: 'workshops',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        time: '18:00',
        latitude: '50.0614',
        longitude: '19.9366',
        address: 'ul. Grodzka 35, 31-014 Kraków, Poland',
        priceAmount: '45',
        priceCurrencyCode: 'PLN',
        capacity: 20,
        isRecurring: false,
        recurrenceEndDate: null
      },
      {
        title: 'Contemporary Art Workshop in Kazimierz',
        description: 'Mixed-media art workshop in the heart of the Jewish Quarter. Create your own modern art piece with guidance from local artists.',
        category: 'arts',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        time: '15:00',
        latitude: '50.0520',
        longitude: '19.9467',
        address: 'Plac Nowy 1, Kazimierz, Kraków, Poland',
        priceAmount: '60',
        priceCurrencyCode: 'PLN',
        capacity: 15,
        isRecurring: false,
        recurrenceEndDate: null
      },
      {
        title: 'Middle Eastern Food Tasting Evening',
        description: 'Experience authentic Israeli and Middle Eastern cuisine. Sample mezze, shakshuka, fresh hummus and warm pita bread.',
        category: 'community',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '19:30',
        latitude: '50.0519',
        longitude: '19.9459',
        address: 'ul. Szeroka 2, Kazimierz, Kraków, Poland',
        priceAmount: '80',
        priceCurrencyCode: 'PLN',
        capacity: 30,
        isRecurring: false,
        recurrenceEndDate: null
      },
      {
        title: 'Outdoor Tennis Tournament',
        description: 'Join our friendly tennis tournament in Kraków. All skill levels welcome. Equipment provided.',
        category: 'sports',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00',
        latitude: '50.0647',
        longitude: '19.9450',
        address: 'Park Jordana, Kraków, Poland',
        priceAmount: '25',
        priceCurrencyCode: 'PLN',
        capacity: 16,
        isRecurring: false,
        recurrenceEndDate: null
      },
      {
        title: 'Traditional Polish Folk Music Night',
        description: 'Live folk music performance with traditional highland dishes from the Tatra Mountains. An authentic cultural experience!',
        category: 'culture',
        date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        time: '20:00',
        latitude: '50.0616',
        longitude: '19.9373',
        address: 'Plac Szczepański 8, 31-011 Kraków, Poland',
        priceAmount: '70',
        priceCurrencyCode: 'PLN',
        capacity: 50,
        isRecurring: false,
        recurrenceEndDate: null
      },
      {
        title: 'Creative Arts Workshop at Rotondes',
        description: 'Explore visual arts and participatory projects in Luxembourg\'s premier cultural hub. Materials and guidance provided for all skill levels.',
        category: 'arts',
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:00',
        latitude: '49.6002',
        longitude: '6.1336',
        address: 'Place des Rotondes, L-2448 Luxembourg',
        priceAmount: '35',
        priceCurrencyCode: 'EUR',
        capacity: 25,
        isRecurring: false,
        recurrenceEndDate: null
      },
      {
        title: 'Painting & Candle Making Studio',
        description: 'Join us for a relaxing afternoon of painting and candle making. All materials provided. Perfect for beginners and experienced artists alike!',
        category: 'workshops',
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        time: '16:00',
        latitude: '49.6116',
        longitude: '6.1453',
        address: '421 rue de Neudorf, LU-2220 Luxembourg',
        priceAmount: '40',
        priceCurrencyCode: 'EUR',
        capacity: 12,
        isRecurring: false,
        recurrenceEndDate: null
      },
      {
        title: 'Tennis Club Stade Open Play',
        description: 'Open tennis session at Luxembourg\'s premier tennis club. Professional courts, coaching available. Equipment rental on-site.',
        category: 'sports',
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        time: '09:00',
        latitude: '49.6116',
        longitude: '6.1167',
        address: 'Boulevard Napoléon 1er, L-2210 Luxembourg',
        priceAmount: '20',
        priceCurrencyCode: 'EUR',
        capacity: 40,
        isRecurring: false,
        recurrenceEndDate: null
      },
      {
        title: 'Contemporary Art Exhibition Opening',
        description: 'Exclusive opening night of our new contemporary art exhibition. Meet the artists, enjoy wine and canapés, experience cutting-edge visual art.',
        category: 'arts',
        date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        time: '18:30',
        latitude: '49.6161',
        longitude: '6.1328',
        address: '41 rue Notre-Dame, L-2240 Luxembourg',
        priceAmount: '15',
        priceCurrencyCode: 'EUR',
        capacity: 100,
        isRecurring: false,
        recurrenceEndDate: null
      },
      {
        title: 'Gourmet Food & Wine Pairing',
        description: 'An elegant evening of fine dining with expertly paired Luxembourg wines. Experience local cuisine with a modern twist.',
        category: 'community',
        date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
        time: '19:00',
        latitude: '49.6116',
        longitude: '6.1319',
        address: 'Place d\'Armes, L-1136 Luxembourg',
        priceAmount: '85',
        priceCurrencyCode: 'EUR',
        capacity: 30,
        isRecurring: false,
        recurrenceEndDate: null
      }
    ];

    console.log(`Creating ${events.length} events...\n`);

    let successCount = 0;
    for (const event of events) {
      try {
        const response = await fetch(`${API_URL}/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        });

        if (response.ok) {
          console.log(`✓ ${event.title}`);
          successCount++;
        } else {
          const errorData = await response.json();
          console.error(`✗ ${event.title}: ${errorData.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`✗ ${event.title}: ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully created ${successCount} out of ${events.length} events!`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

loginAndCreateEvents();
