const axios = require('axios');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'rdmt.cd4yo8mao5nm.eu-north-1.rds.amazonaws.com',
  user: 'admin',
  password: 'rdmt_protocols667$$',
  database: 'rendment',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
};

function getDateValue() {
  const franceTime = new Date().toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const [day, month, year] = franceTime.split('/');
  return `${year}-${month}-${day}`;
}

const updateDataInDatabase = async (symbol, lendingRate) => {
  try {
    const connection = await getConnection();
    const dateValue = getDateValue();
    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES ('${dateValue}', 'MANGO', 'https://app.mango.markets/', 'SOLANA', 'LENDING', '${symbol}', '${lendingRate}', NULL, NULL, NULL, NULL);`;

    await connection.execute(query);

    connection.release();

    console.log(
      `MANGO : La valeur de ${symbol} a été mise à jour avec succès : ${lendingRate}.`
    );
  } catch (error) {
    console.error(
      `MANGO : Erreur lors de la mise à jour de la valeur pour ${symbol} :`,
      error
    );
  }
};

const fetchAndUpdateData = async (url, symbol, retries = 5, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url);
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        const firstRecord = data[0].deposit_apr;
        const lendingRate = (firstRecord * 100).toFixed(2);

        await updateDataInDatabase(symbol, lendingRate);
        return;
      } else {
        console.log(`MANGO : No data available for ${symbol}.`);
        return;
      }
    } catch (error) {
      console.error(
        `MANGO : Error fetching data for ${symbol} (attempt ${attempt}):`
      );

      if (attempt < retries) {
        console.log(`MANGO : Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(
          `MANGO : Failed to fetch data for ${symbol} after ${retries} attempts.`
        );
      }
    }
  }
};

const urls = {
  USDC: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  SOL: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=So11111111111111111111111111111111111111112',
  JUP: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  ETH: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  USDT: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  RAY: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  WIF: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  BONK: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  RNDR: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
};

const fetchAllData = async () => {
  for (const [symbol, url] of Object.entries(urls)) {
    await fetchAndUpdateData(url, symbol);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

fetchAllData();
