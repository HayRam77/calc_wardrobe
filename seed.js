require('dotenv').config();
const pool = require('./db');

const seedData = async () => {
  const client = await pool.connect();
  try {
    // clean catalog tables
    await client.query('DELETE FROM motors; DELETE FROM heaters; DELETE FROM breakers; DELETE FROM thermal_relays; DELETE FROM cables;');

    const motors = [
      [0.37,0.68,0.70,5.5], [0.55,0.72,0.71,5.5], [0.75,0.75,0.72,6.0],
      [1.1,0.77,0.74,6.5], [1.5,0.81,0.77,7.0], [2.2,0.83,0.80,7.0],
      [3.0,0.84,0.82,7.0], [4.0,0.85,0.83,7.0], [5.5,0.86,0.84,7.5],
      [7.5,0.87,0.85,7.5], [11,0.88,0.85,7.5], [15,0.89,0.85,7.5],
      [18.5,0.90,0.86,7.0], [22,0.91,0.86,7.0], [30,0.92,0.87,7.0],
      [37,0.92,0.87,7.0], [45,0.93,0.88,7.0], [55,0.93,0.88,7.0],
      [75,0.94,0.88,6.5], [90,0.94,0.89,6.5]
    ];
    for (const m of motors) {
      await client.query(
        'INSERT INTO motors (power_kw, efficiency, cos_phi, start_current_ratio) VALUES ($1,$2,$3,$4)',
        m
      );
    }

    const heaters = [0.5,1.0,1.5,2.0,3.0,4.0,5.0,6.0,9.0,12.0,15.0,18.0,21.0,24.0];
    for (const h of heaters) {
      await client.query('INSERT INTO heaters (power_kw) VALUES ($1)', [h]);
    }

    const breakers = [1,2,3,4,6,10,16,20,25,32,40,50,63,80,100,125];
    for (const b of breakers) {
      await client.query("INSERT INTO breakers (current_a, type, poles) VALUES ($1, 'C', 3)", [b]);
      await client.query("INSERT INTO breakers (current_a, type, poles) VALUES ($1, 'C', 1)", [b]);
    }

    const relays = [
      [1.6,2.5],[2.5,4],[4,6],[5.5,8],[7,10],[9,13],
      [12,18],[17,25],[23,32],[30,40],[37,50],[48,65],[55,70],[63,80]
    ];
    for (const r of relays) {
      await client.query('INSERT INTO thermal_relays (min_current_a, max_current_a) VALUES ($1,$2)', r);
    }

    const cables = [[1.5,16],[2.5,25],[4,32],[6,40],[10,63],[16,100],[25,125]];
    for (const c of cables) {
      await client.query('INSERT INTO cables (cross_section_mm2, max_current_a) VALUES ($1,$2)', c);
    }

    console.log('Seed data inserted successfully');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    client.release();
    pool.end();
  }
};

seedData();
