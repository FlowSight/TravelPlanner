/**
 * Seed script — loads places data from raw plans into MongoDB.
 * Run with:  cd backend && npm run seed
 */
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

// Use Google DNS to fix Node.js SRV/TXT lookup timeouts on some networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

const bangkokPlaces = [
  { name: 'Wat Phra Kaew (Temple of the Emerald Buddha)', country: 'Thailand', city: 'Bangkok', type: 'history', fee: '~500 THB (includes Grand Palace)', timing: 'Daytime (go early if possible)', timeToCover: '1.5-2 hours', highlight: "Thailand's most sacred Buddha image, golden spires, intricate mosaics", notes: 'Modest dress required. No revealing dress for women.' },
  { name: 'Wat Pho (Temple of the Reclining Buddha)', country: 'Thailand', city: 'Bangkok', type: 'history', fee: '~200 THB', timing: 'Daytime', timeToCover: '1-1.5 hours', highlight: '46m gold-plated Reclining Buddha, oldest & largest temple', notes: 'Thai massage school on site' },
  { name: 'Wat Arun (Temple of Dawn)', country: 'Thailand', city: 'Bangkok', type: 'history', fee: '~100 THB', timing: 'Late afternoon to sunset', timeToCover: '1-1.5 hours', highlight: 'Colorful porcelain spire, river views, climbable prang', notes: 'Best at sunset' },
  { name: 'The Grand Palace', country: 'Thailand', city: 'Bangkok', type: 'history', fee: 'Included with Wat Phra Kaew', timing: 'Morning', timeToCover: '1.5-2 hours', highlight: 'Former royal residence, elaborate Thai architecture', notes: 'Visit early morning' },
  { name: 'Jim Thompson House', country: 'Thailand', city: 'Bangkok', type: 'culture', fee: '~200 THB', timing: 'Daytime', timeToCover: '1-1.5 hours', highlight: 'Thai teak houses, silk & Asian art museum', notes: 'Named after silk industry reviver' },
  { name: 'Chatuchak Weekend Market', country: 'Thailand', city: 'Bangkok', type: 'shopping', fee: 'Free entry', timing: 'Sat-Sun, 9 AM - 6 PM', timeToCover: '3-5 hours', highlight: 'Outdoor market (15,000+ stalls)', notes: 'Clothing, antiques, pets, plants, food, art' },
  { name: 'Asiatique The Riverfront', country: 'Thailand', city: 'Bangkok', type: 'shopping', fee: 'Free entry', timing: 'Daily 4 PM - midnight', timeToCover: '2-3 hours', highlight: 'Night market by the river', notes: 'Shopping, dining, entertainment (free ferry)' },
  { name: 'MBK Center', country: 'Thailand', city: 'Bangkok', type: 'shopping', fee: 'Free entry', timing: 'Daily', timeToCover: '2-4 hours', highlight: 'Shopping mall (8 floors)', notes: 'Electronics, clothing, souvenirs, phone accessories' },
  { name: 'Siam Paragon / CentralWorld', country: 'Thailand', city: 'Bangkok', type: 'shopping', fee: 'Free entry', timing: 'Daily', timeToCover: '2-4 hours', highlight: 'Upscale shopping malls', notes: 'International brands, excellent food courts' },
  { name: 'Yaowarat (Chinatown)', country: 'Thailand', city: 'Bangkok', type: 'food', fee: 'No entry fee', timing: 'Night', timeToCover: '2-3 hours', highlight: 'Best street food in Bangkok', notes: 'Must-try: Pad Thai, roasted duck, mango sticky rice, dim sum' },
  { name: 'Khao San Road', country: 'Thailand', city: 'Bangkok', type: 'food', fee: 'No entry fee', timing: 'Evening/Night', timeToCover: '2-3 hours', highlight: 'Backpacker hub with budget eats', notes: 'Street snacks, bars, people-watching' },
  { name: 'Victory Monument', country: 'Thailand', city: 'Bangkok', type: 'food', fee: 'No entry fee', timing: 'Anytime', timeToCover: '1-2 hours', highlight: 'Local scene, famous for boat noodles', notes: 'Good for authentic Thai dishes' },
  { name: 'Lumpini Park', country: 'Thailand', city: 'Bangkok', type: 'nature', fee: 'Free', timing: 'Morning or late afternoon', timeToCover: '1-2 hours', highlight: "Bangkok's largest central park", notes: 'Walking, paddle boats, monitor lizards roam freely' },
  { name: 'Benjakitti Park', country: 'Thailand', city: 'Bangkok', type: 'nature', fee: 'Free', timing: 'Morning or evening', timeToCover: '1-2 hours', highlight: 'Modern park with wetlands', notes: 'Cycling and boardwalk walking; less crowded than Lumpini' },
  { name: 'Mahanakhon SkyWalk', country: 'Thailand', city: 'Bangkok', type: 'fun', fee: '~800-1000 THB', timing: 'Late afternoon to night', timeToCover: '1-2 hours', highlight: "Thailand's highest observation deck (314m)", notes: 'Glass floor, 360° city views' },
  { name: 'ICONSIAM', country: 'Thailand', city: 'Bangkok', type: 'shopping', fee: 'Free entry', timing: 'Daily', timeToCover: '2-4 hours', highlight: 'Luxury riverside mall', notes: 'Indoor floating market, stunning architecture' },
  { name: 'Sky Bar (Lebua)', country: 'Thailand', city: 'Bangkok', type: 'fun', fee: 'No entry fee (pay for drinks)', timing: 'Evening to late night', timeToCover: '1-2 hours', highlight: 'Famous rooftop bar from "The Hangover Part II"', notes: 'Located at Lebua Hotel' },
  { name: 'Vertigo & Moon Bar', country: 'Thailand', city: 'Bangkok', type: 'fun', fee: 'No entry fee (pay for drinks)', timing: 'Evening to late night', timeToCover: '1-2 hours', highlight: 'Stunning height and skyline views', notes: 'Banyan Tree, 61st floor' },
  { name: 'Octave Rooftop', country: 'Thailand', city: 'Bangkok', type: 'fun', fee: 'No entry fee (pay for drinks)', timing: 'Evening to late night', timeToCover: '1-2 hours', highlight: '360° panoramic views', notes: 'Marriott Sukhumvit' },
  { name: 'Ayutthaya', country: 'Thailand', city: 'Bangkok', type: 'history', fee: 'Varies by site', timing: 'Full-day trip (start early)', timeToCover: '6-10 hours', highlight: 'UNESCO ruins, Buddha heads in tree roots', notes: '1-2 hours north of Bangkok' },
  { name: 'Damnoen Saduak', country: 'Thailand', city: 'Bangkok', type: 'culture', fee: 'Free entry; boat rides extra', timing: 'Morning to early afternoon', timeToCover: '4-6 hours', highlight: 'Most famous floating market (touristy)', notes: '1.5 hours from Bangkok' },
  { name: 'Amphawa', country: 'Thailand', city: 'Bangkok', type: 'culture', fee: 'Free entry', timing: 'Weekend afternoon/evening', timeToCover: '4-6 hours', highlight: 'Authentic floating market', notes: '1.5 hours from Bangkok; weekends only' },
  { name: 'Taling Chan', country: 'Thailand', city: 'Bangkok', type: 'culture', fee: 'Free entry', timing: 'Daytime', timeToCover: '2-4 hours', highlight: 'Closest floating market with local vibe', notes: '30 minutes from central Bangkok' },
];

const pattayaPlaces = [
  { name: 'Pattaya Beach', country: 'Thailand', city: 'Pattaya', type: 'fun', fee: 'Free', timing: 'Morning to evening', timeToCover: '1-3 hours', highlight: 'Central beach with water activities and nightlife nearby', notes: 'Very busy, especially evenings' },
  { name: 'Jomtien Beach', country: 'Thailand', city: 'Pattaya', type: 'fun', fee: 'Free', timing: 'Morning to sunset', timeToCover: '2-4 hours', highlight: 'Quieter, family-friendly beach stretch', notes: 'Good for relaxed walks and cafés' },
  { name: 'Koh Larn (Coral Island)', country: 'Thailand', city: 'Pattaya', type: 'fun', fee: 'Ferry ~30-50 THB one way', timing: 'Daytime', timeToCover: 'Half day to full day', highlight: 'Clearer water, beach hopping, snorkeling', notes: 'Day trip from Bali Hai Pier' },
  { name: 'Pattaya Viewpoint (Khao Pattaya View Point)', country: 'Thailand', city: 'Pattaya', type: 'nature', fee: 'Free', timing: 'Sunset', timeToCover: '30-60 minutes', highlight: 'Panoramic city and bay views', notes: 'Great photo spot' },
  { name: 'Pratumnak Hill', country: 'Thailand', city: 'Pattaya', type: 'nature', fee: 'Free', timing: 'Late afternoon', timeToCover: '1-2 hours', highlight: 'Coastal roads, viewpoints, quieter vibe', notes: 'Combine with nearby cafés' },
  { name: 'Sanctuary of Truth', country: 'Thailand', city: 'Pattaya', type: 'culture', fee: '~500 THB', timing: 'Daytime', timeToCover: '1.5-2.5 hours', highlight: 'Massive hand-carved wooden temple-like structure', notes: 'Unique architecture and craftsmanship' },
  { name: 'Big Buddha Temple (Wat Phra Yai)', country: 'Thailand', city: 'Pattaya', type: 'history', fee: 'Free (donations)', timing: 'Morning or late afternoon', timeToCover: '45-90 minutes', highlight: 'Large golden Buddha and hilltop views', notes: 'Dress respectfully' },
  { name: 'Wat Yansangwararam', country: 'Thailand', city: 'Pattaya', type: 'history', fee: 'Free', timing: 'Daytime', timeToCover: '1-2 hours', highlight: 'Peaceful temple complex with gardens', notes: 'Good for a calm visit' },
  { name: 'Nong Nooch Tropical Garden', country: 'Thailand', city: 'Pattaya', type: 'nature', fee: '~500-600 THB', timing: 'Daytime', timeToCover: '4-8 hours', highlight: 'Cultural shows, themed gardens, dinosaur valley', notes: 'Large area; allow half/full day' },
  { name: 'Ramayana Water Park', country: 'Thailand', city: 'Pattaya', type: 'fun', fee: '~1,000+ THB (varies)', timing: 'Daytime', timeToCover: '4-6 hours', highlight: "One of Thailand's largest water parks", notes: 'Check promotions online' },
  { name: 'Underwater World Pattaya', country: 'Thailand', city: 'Pattaya', type: 'fun', fee: '~500 THB', timing: 'Daytime', timeToCover: '1-2 hours', highlight: 'Walk-through aquarium tunnel', notes: 'Family-friendly indoor option' },
  { name: 'Pattaya Floating Market', country: 'Thailand', city: 'Pattaya', type: 'shopping', fee: 'Entry varies', timing: 'Daytime', timeToCover: '2-3 hours', highlight: 'Cultural/shopping market', notes: 'Souvenirs, snacks, boat rides' },
  { name: 'Thepprasit Night Market', country: 'Thailand', city: 'Pattaya', type: 'shopping', fee: 'Free entry', timing: 'Fri-Sun evening', timeToCover: '2-3 hours', highlight: 'Weekend night market', notes: 'Street food, clothes, local items' },
  { name: 'Central Pattaya (Festival)', country: 'Thailand', city: 'Pattaya', type: 'shopping', fee: 'Free entry', timing: 'Anytime', timeToCover: '2-4 hours', highlight: 'Shopping mall', notes: 'Shopping, dining, cinema' },
  { name: 'Walking Street', country: 'Thailand', city: 'Pattaya', type: 'fun', fee: 'Free entry', timing: 'Night', timeToCover: '1-3 hours', highlight: 'Nightlife and entertainment hub', notes: 'Loud and crowded' },
  { name: 'Terminal 21 Pattaya', country: 'Thailand', city: 'Pattaya', type: 'shopping', fee: 'Free entry', timing: 'Evening', timeToCover: '1-3 hours', highlight: 'Themed mall with food court', notes: 'Good rainy-day option' },
  { name: 'Khao Chi Chan (Buddha Mountain)', country: 'Thailand', city: 'Pattaya', type: 'history', fee: 'Free', timing: 'Morning or late afternoon', timeToCover: '1-2 hours', highlight: 'Giant Buddha image on cliff', notes: 'About 30-40 min from Pattaya' },
  { name: 'Silverlake Vineyard area', country: 'Thailand', city: 'Pattaya', type: 'nature', fee: 'Varies by activity', timing: 'Daytime', timeToCover: '1-2 hours', highlight: 'Scenic countryside views', notes: 'Nearby Khao Chi Chan' },
];

async function seed() {
  let client;
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    console.log(`Connected to MongoDB: ${db.databaseName}`);

    const placesCol = db.collection('places');
    const usersCol = db.collection('users');

    // Seed places
    const allPlaces = [...bangkokPlaces, ...pattayaPlaces];
    console.log(`Seeding ${allPlaces.length} places...`);

    const now = new Date();
    for (const place of allPlaces) {
      const existing = await placesCol.findOne({ name: place.name, city: place.city });
      if (existing) {
        await placesCol.updateOne({ _id: existing._id }, { $set: { ...place, updatedAt: now } });
        console.log(`  Updated: ${place.name}`);
      } else {
        await placesCol.insertOne({ ...place, createdAt: now, updatedAt: now });
        console.log(`  Created: ${place.name}`);
      }
    }

    // Create default admin user if not exists
    const adminEmail = 'admin@travelplanner.com';
    const existingAdmin = await usersCol.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await usersCol.insertOne({
        name: 'Admin',
        email: adminEmail,
        phone: null,
        password: hashedPassword,
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      });
      console.log('Created admin user — email: admin@travelplanner.com, password: admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Create indexes
    await placesCol.createIndex({ name: 'text', country: 'text', city: 'text', notes: 'text' });
    await usersCol.createIndex({ email: 1 }, { unique: true, sparse: true });
    await usersCol.createIndex({ phone: 1 }, { unique: true, sparse: true });

    console.log('\nSeeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
