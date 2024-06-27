'use server';

import { getConnection } from '../db/route';

async function fetchData() {
  try {
    const connection = await getConnection();
    const [rows, fields] = await connection.execute('SELECT * FROM protocols');
    console.log(rows);
    connection.release();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

fetchData();
