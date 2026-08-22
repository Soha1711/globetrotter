import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GlobeTrotter database seeding...');

  // Clear existing data (in reverse dependency order)
  await prisma.stopActivity.deleteMany({});
  await prisma.stop.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database records.');

  // 1. Create Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const demoUser = await prisma.user.create({
    data: {
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'demo@globetrotter.com',
      passwordHash: passwordHash,
      phoneNumber: '+1-555-019-2834',
      city: 'San Francisco',
      country: 'United States',
      additionalInfo: 'Passionate travel enthusiast exploring culinary & cultural destinations worldwide.',
      profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      role: 'USER',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      firstName: 'GlobeTrotter',
      lastName: 'Admin',
      email: 'admin@globetrotter.com',
      passwordHash: passwordHash,
      phoneNumber: '+1-555-000-0000',
      city: 'London',
      country: 'United Kingdom',
      role: 'ADMIN',
    },
  });

  console.log(`👤 Created Demo User (${demoUser.email}) and Admin User (${adminUser.email}).`);

  // 2. Create Cities & Activities
  const citiesData = [
    {
      name: 'Paris',
      country: 'France',
      costIndex: 4,
      popularity: 98,
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      activities: [
        {
          name: 'Eiffel Tower Sunset Tour',
          description: 'Ascend to the summit of the Eiffel Tower for panoramic evening views over the Seine.',
          category: 'SIGHTSEEING',
          cost: 35.00,
          durationHours: 2.5,
          imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f',
        },
        {
          name: 'Louvre Museum Masterpieces Walk',
          description: 'Explore world-renowned art including the Mona Lisa and Venus de Milo with an expert guide.',
          category: 'CULTURE',
          cost: 45.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a',
        },
        {
          name: 'Montmartre Bakery & Pastry Crawl',
          description: 'Taste fresh croissants, macarons, and artisanal baguettes through historic Montmartre.',
          category: 'FOOD',
          cost: 50.00,
          durationHours: 2.0,
          imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
        },
        {
          name: 'Seine River Evening Dinner Cruise',
          description: 'Glide past illuminated Parisian landmarks while dining on gourmet 3-course French cuisine.',
          category: 'RELAXATION',
          cost: 95.00,
          durationHours: 2.5,
          imageUrl: 'https://images.unsplash.com/photo-1549144511-f099e773c147',
        },
        {
          name: 'Catacombs Underground Exploration',
          description: 'Descend into the subterranean labyrinth holding the history of Paris.',
          category: 'ADVENTURE',
          cost: 29.00,
          durationHours: 1.5,
          imageUrl: 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b',
        },
      ],
    },
    {
      name: 'Tokyo',
      country: 'Japan',
      costIndex: 4,
      popularity: 96,
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
      activities: [
        {
          name: 'Shibuya Crossing & Harajuku Culture Walking Tour',
          description: 'Experience the world busiest intersection and youth fashion district.',
          category: 'SIGHTSEEING',
          cost: 20.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989',
        },
        {
          name: 'Tsukiji Outer Market Food Tasting',
          description: 'Sample fresh sashimi, tamagoyaki, and wagyu skewers at Tokyo famed market.',
          category: 'FOOD',
          cost: 65.00,
          durationHours: 2.5,
          imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb',
        },
        {
          name: 'Senso-ji Temple & Asakusa Heritage Walk',
          description: 'Visit Tokyo oldest Buddhist temple and shop along Nakamise-dori.',
          category: 'CULTURE',
          cost: 15.00,
          durationHours: 2.0,
          imageUrl: 'https://images.unsplash.com/photo-1578637387939-43c525550085',
        },
        {
          name: 'Mount Fuji Day Excursion & Onsen Bath',
          description: 'Day trip to 5th Station of Mt. Fuji ending with relaxing hot spring soak.',
          category: 'ADVENTURE',
          cost: 120.00,
          durationHours: 8.0,
          imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
        },
        {
          name: 'Traditional Tea Ceremony Experience',
          description: 'Learn the meditative art of matcha preparation from a licensed tea master.',
          category: 'RELAXATION',
          cost: 40.00,
          durationHours: 1.5,
          imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3',
        },
      ],
    },
    {
      name: 'Rome',
      country: 'Italy',
      costIndex: 3,
      popularity: 95,
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
      activities: [
        {
          name: 'Colosseum & Roman Forum Priority Tour',
          description: 'Step into gladiatorial history with fast-track access to the arena floor.',
          category: 'SIGHTSEEING',
          cost: 48.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
        },
        {
          name: 'Vatican Museums & Sistine Chapel Tour',
          description: 'Marvel at Michelangelo frescoes and papal art collections.',
          category: 'CULTURE',
          cost: 55.00,
          durationHours: 3.5,
          imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7',
        },
        {
          name: 'Trastevere Pasta & Gelato Masterclass',
          description: 'Handcraft fresh fettuccine and tiramisu guided by a Roman chef.',
          category: 'FOOD',
          cost: 75.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141',
        },
        {
          name: 'Trevi Fountain & Spanish Steps Evening Stroll',
          description: 'Discover the romantic squares and fountains under starlight.',
          category: 'RELAXATION',
          cost: 0.00,
          durationHours: 2.0,
          imageUrl: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140',
        },
        {
          name: 'Appian Way Electric Bike Adventure',
          description: 'Cycle along ancient Roman roads, catacombs, and aqueduct parks.',
          category: 'ADVENTURE',
          cost: 40.00,
          durationHours: 3.5,
          imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963',
        },
      ],
    },
    {
      name: 'Kyoto',
      country: 'Japan',
      costIndex: 3,
      popularity: 92,
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
      activities: [
        {
          name: 'Fushimi Inari Shrine Thousand Torii Walk',
          description: 'Hike through vibrant vermilion shrine gates up Mount Inari.',
          category: 'SIGHTSEEING',
          cost: 0.00,
          durationHours: 2.5,
          imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
        },
        {
          name: 'Arashiyama Bamboo Grove & Monkey Park Hike',
          description: 'Stroll beneath towering bamboo stalks and meet wild macaques.',
          category: 'ADVENTURE',
          cost: 10.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
        },
        {
          name: 'Gion Geisha District Evening Architecture Tour',
          description: 'Walk through preserved wooden machiya townhouses in search of maiko.',
          category: 'CULTURE',
          cost: 25.00,
          durationHours: 2.0,
          imageUrl: 'https://images.unsplash.com/photo-1578637387939-43c525550085',
        },
        {
          name: 'Nishiki Market Kaiseki Food Walk',
          description: 'Sample over 10 traditional Kyoto specialties along the narrow covered market.',
          category: 'FOOD',
          cost: 55.00,
          durationHours: 2.5,
          imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb',
        },
        {
          name: 'Zen Garden Meditation at Ryoan-ji',
          description: 'Contemplate the famous rock garden for peace of mind.',
          category: 'RELAXATION',
          cost: 8.00,
          durationHours: 1.5,
          imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3',
        },
      ],
    },
    {
      name: 'Barcelona',
      country: 'Spain',
      costIndex: 3,
      popularity: 94,
      imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4',
      activities: [
        {
          name: 'Sagrada Familia Architectural Masterclass',
          description: 'Marvel at Antoni Gaudi masterpiece with audio-guided interior access.',
          category: 'CULTURE',
          cost: 36.00,
          durationHours: 2.0,
          imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4',
        },
        {
          name: 'Park Guell Monumental Zone Ticket',
          description: 'Wander amidst colorful mosaic salamanders and panoramic city views.',
          category: 'SIGHTSEEING',
          cost: 15.00,
          durationHours: 2.0,
          imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded',
        },
        {
          name: 'Gothic Quarter Tapas & Wine Tasting Trail',
          description: 'Visit 4 authentic bodega taverns for patatas bravas, jamón, and sangria.',
          category: 'FOOD',
          cost: 60.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b',
        },
        {
          name: 'Barceloneta Beach Stand-Up Paddleboarding',
          description: 'Catch sunrise waves off the Mediterranean coast.',
          category: 'ADVENTURE',
          cost: 30.00,
          durationHours: 2.0,
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        },
        {
          name: 'Sunset Sailing Yacht along Coastline',
          description: 'Relax with complimentary cava on a luxury catamaran.',
          category: 'RELAXATION',
          cost: 55.00,
          durationHours: 2.5,
          imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        },
      ],
    },
    {
      name: 'New York',
      country: 'United States',
      costIndex: 5,
      popularity: 97,
      imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
      activities: [
        {
          name: 'Statue of Liberty & Ellis Island Ferry',
          description: 'Visit America symbol of freedom and immigration history.',
          category: 'SIGHTSEEING',
          cost: 30.00,
          durationHours: 4.0,
          imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
        },
        {
          name: 'Broadway Musical Ticket',
          description: 'Experience world-class live theater in the heart of Times Square.',
          category: 'CULTURE',
          cost: 135.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814',
        },
        {
          name: 'Greenwich Village Food & Pizza Safari',
          description: 'Bite into famous NY dollar slices, cannoli, and bagels.',
          category: 'FOOD',
          cost: 70.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
        },
        {
          name: 'Central Park Bicycle Rental & Picnic',
          description: 'Ride through Bethesda Terrace, Strawberry Fields, and Belvedere Castle.',
          category: 'RELAXATION',
          cost: 25.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f',
        },
        {
          name: 'Helicopter Skyline Flight over Manhattan',
          description: 'Thrilling aerial views over Brooklyn Bridge, Central Park, and Hudson River.',
          category: 'ADVENTURE',
          cost: 220.00,
          durationHours: 0.5,
          imageUrl: 'https://images.unsplash.com/photo-1506966953377-3f925a26e07b',
        },
      ],
    },
    {
      name: 'Sydney',
      country: 'Australia',
      costIndex: 4,
      popularity: 91,
      imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9',
      activities: [
        {
          name: 'Sydney Opera House Behind-the-Scenes Tour',
          description: 'Explore the architectural masterpiece and concert halls.',
          category: 'CULTURE',
          cost: 42.00,
          durationHours: 2.0,
          imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9',
        },
        {
          name: 'Sydney Harbour BridgeClimb',
          description: 'Scale the iconic steel arch bridge for 360-degree harbor panoramas.',
          category: 'ADVENTURE',
          cost: 260.00,
          durationHours: 3.5,
          imageUrl: 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a',
        },
        {
          name: 'Bondi to Coogee Coastal Walk',
          description: 'Scenic cliffside walking trail passing golden beaches and ocean pools.',
          category: 'RELAXATION',
          cost: 0.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        },
        {
          name: 'Surry Hills Craft Beer & Dining Safari',
          description: 'Discover trendy microbreweries and modern Aussie gastropubs.',
          category: 'FOOD',
          cost: 65.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
        },
        {
          name: 'Taronga Zoo Ferry & Wildlife Encounter',
          description: 'Meet kangaroos and koalas with unbeatable harbor views.',
          category: 'SIGHTSEEING',
          cost: 49.00,
          durationHours: 4.0,
          imageUrl: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0',
        },
      ],
    },
    {
      name: 'Cairo',
      country: 'Egypt',
      costIndex: 2,
      popularity: 89,
      imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368',
      activities: [
        {
          name: 'Giza Pyramids & Great Sphinx Guided Tour',
          description: 'Stand before the ancient Wonders of the Ancient World.',
          category: 'SIGHTSEEING',
          cost: 35.00,
          durationHours: 4.0,
          imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368',
        },
        {
          name: 'Grand Egyptian Museum Artifact Experience',
          description: 'View King Tutankhamun golden treasures and pharaonic mummies.',
          category: 'CULTURE',
          cost: 25.00,
          durationHours: 3.5,
          imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7',
        },
        {
          name: 'Khan el-Khalili Bazaar Spice & Souk Tour',
          description: 'Haggle for brass lamps, papyrus art, and exotic spices.',
          category: 'FOOD',
          cost: 20.00,
          durationHours: 2.5,
          imageUrl: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b',
        },
        {
          name: 'Sunset Felucca Sail on the River Nile',
          description: 'Relax aboard a traditional wooden sailboat while the sun sets over Cairo.',
          category: 'RELAXATION',
          cost: 18.00,
          durationHours: 2.0,
          imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        },
        {
          name: 'Quad Bike Safari around Desert Pyramids',
          description: 'Ride ATV dunes surrounding the ancient pyramid complex.',
          category: 'ADVENTURE',
          cost: 45.00,
          durationHours: 2.0,
          imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9',
        },
      ],
    },
    {
      name: 'Rio de Janeiro',
      country: 'Brazil',
      costIndex: 2,
      popularity: 90,
      imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325',
      activities: [
        {
          name: 'Christ the Redeemer & Corcovado Train',
          description: 'Ascend through Tijuca Forest to the iconic statue overlooking Guanabara Bay.',
          category: 'SIGHTSEEING',
          cost: 30.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325',
        },
        {
          name: 'Sugarloaf Mountain Cable Car Ride',
          description: 'Glide high above Rio beaches for spectacular sunset panoramic views.',
          category: 'SIGHTSEEING',
          cost: 32.00,
          durationHours: 2.5,
          imageUrl: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f',
        },
        {
          name: 'Copacabana & Ipanema Beach Lounge',
          description: 'Sip fresh caipirinhas and play beach volleyball.',
          category: 'RELAXATION',
          cost: 15.00,
          durationHours: 3.0,
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        },
        {
          name: 'Lapa Steps & Samba Live Music Night',
          description: 'Experience authentic Brazilian samba rhythms in historic Lapa.',
          category: 'CULTURE',
          cost: 25.00,
          durationHours: 4.0,
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
        },
        {
          name: 'Tijuca Rainforest Jeep Adventure',
          description: 'Explore the world largest urban rainforest filled with waterfalls and toucans.',
          category: 'ADVENTURE',
          cost: 50.00,
          durationHours: 4.0,
          imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
        },
      ],
    },
  ];

  const createdCities = [];
  for (const c of citiesData) {
    const { activities, ...cityInfo } = c;
    const city = await prisma.city.create({
      data: {
        ...cityInfo,
        activities: {
          create: activities,
        },
      },
      include: {
        activities: true,
      },
    });
    createdCities.push(city);
    console.log(`🏙️ Created City: ${city.name}, ${city.country} with ${city.activities.length} activities.`);
  }

  // 3. Create Sample Multi-City Trip for Demo User
  const parisCity = createdCities.find((c) => c.name === 'Paris')!;
  const romeCity = createdCities.find((c) => c.name === 'Rome')!;

  const sampleTrip = await prisma.trip.create({
    data: {
      userId: demoUser.id,
      name: 'Grand European Odyssey: Paris & Rome',
      description: 'An immersive 10-day multi-city journey exploring culinary delights, ancient landmarks, and cultural highlights across Paris and Rome.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      startDate: new Date('2026-09-15T00:00:00Z'),
      endDate: new Date('2026-09-25T00:00:00Z'),
      isPublic: true,
      stops: {
        create: [
          {
            cityId: parisCity.id,
            orderIndex: 0,
            startDate: new Date('2026-09-15T00:00:00Z'),
            endDate: new Date('2026-09-20T00:00:00Z'),
            stopActivities: {
              create: [
                {
                  activityId: parisCity.activities[0].id,
                  scheduledDate: new Date('2026-09-16T00:00:00Z'),
                  scheduledTime: '06:30 PM',
                },
                {
                  activityId: parisCity.activities[1].id,
                  scheduledDate: new Date('2026-09-17T00:00:00Z'),
                  scheduledTime: '10:00 AM',
                },
                {
                  activityId: parisCity.activities[2].id,
                  scheduledDate: new Date('2026-09-18T00:00:00Z'),
                  scheduledTime: '02:00 PM',
                },
              ],
            },
          },
          {
            cityId: romeCity.id,
            orderIndex: 1,
            startDate: new Date('2026-09-20T00:00:00Z'),
            endDate: new Date('2026-09-25T00:00:00Z'),
            stopActivities: {
              create: [
                {
                  activityId: romeCity.activities[0].id,
                  scheduledDate: new Date('2026-09-21T00:00:00Z'),
                  scheduledTime: '09:00 AM',
                },
                {
                  activityId: romeCity.activities[2].id,
                  scheduledDate: new Date('2026-09-22T00:00:00Z'),
                  scheduledTime: '05:00 PM',
                },
              ],
            },
          },
        ],
      },
      budget: {
        create: {
          transportCost: 650.00,
          stayCost: 1200.00,
          activitiesCost: 350.00,
          mealsCost: 500.00,
        },
      },
    },
    include: {
      stops: {
        include: {
          city: true,
          stopActivities: {
            include: {
              activity: true,
            },
          },
        },
      },
      budget: true,
    },
  });

  console.log(`✈️ Created Sample Trip: "${sampleTrip.name}" (ID: ${sampleTrip.id}) with ${sampleTrip.stops.length} stops.`);

  // Ongoing Trip (current dates around August 2026)
  const tokyoCity = createdCities.find((c) => c.name === 'Tokyo')!;
  const ongoingTrip = await prisma.trip.create({
    data: {
      userId: demoUser.id,
      name: 'Tokyo Modern & Tradition Tour',
      description: 'Currently exploring Tokyo Shibuya and Asakusa districts.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
      startDate: new Date('2026-08-20T00:00:00Z'),
      endDate: new Date('2026-08-30T00:00:00Z'),
      isPublic: true,
      stops: {
        create: [
          {
            cityId: tokyoCity.id,
            orderIndex: 0,
            startDate: new Date('2026-08-20T00:00:00Z'),
            endDate: new Date('2026-08-30T00:00:00Z'),
          }
        ]
      },
      budget: {
        create: {
          transportCost: 800.00,
          stayCost: 1500.00,
          activitiesCost: 200.00,
          mealsCost: 600.00,
        }
      }
    }
  });
  console.log(`✈️ Created Ongoing Trip: "${ongoingTrip.name}" (ID: ${ongoingTrip.id}).`);

  // Past / Completed Trip
  const barcelonaCity = createdCities.find((c) => c.name === 'Barcelona')!;
  const completedTrip = await prisma.trip.create({
    data: {
      userId: demoUser.id,
      name: 'Summer in Barcelona',
      description: 'Relaxing beach getaway and Gaudi architecture walk.',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4',
      startDate: new Date('2026-07-01T00:00:00Z'),
      endDate: new Date('2026-07-10T00:00:00Z'),
      isPublic: false,
      stops: {
        create: [
          {
            cityId: barcelonaCity.id,
            orderIndex: 0,
            startDate: new Date('2026-07-01T00:00:00Z'),
            endDate: new Date('2026-07-10T00:00:00Z'),
          }
        ]
      },
      budget: {
        create: {
          transportCost: 400.00,
          stayCost: 900.00,
          activitiesCost: 150.00,
          mealsCost: 450.00,
        }
      }
    }
  });
  console.log(`✈️ Created Completed Trip: "${completedTrip.name}" (ID: ${completedTrip.id}).`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
