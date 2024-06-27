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

const updateDataInDatabase = async (symbol, lendingRate, TVL) => {
  try {
    const connection = await getConnection();
    const dateValue = getDateValue();
    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES ('${dateValue}', 'RAYDIUM', 'https://raydium.io/staking/', 'SOLANA', 'STACKING', '${symbol}', '${lendingRate}', NULL, NULL, NULL, '${TVL}');`;

    await connection.execute(query, [lendingRate]);

    connection.release();

    console.log(
      `RAYDIUM : La valeur de ${symbol} a été mise à jour avec succès : ${lendingRate}.`
    );
  } catch (error) {
    console.error(
      `Erreur lors de la mise à jour de la valeur pour ${symbol} :`,
      error
    );
  }
};

const fetchAndUpdateData = async (url, symbol) => {
  try {
    const response = await axios.get(url);
    const data = response.data.data.data;

    if (data.length > 0) {
      const firstRecord = data[0].apr;
      const lendingRate = (firstRecord * 100).toFixed(2);
      const TVL = data[0].tvl;
      await updateDataInDatabase(symbol, lendingRate, TVL);
    } else {
      console.log(`RAYDIUM : No data available for ${symbol}.`);
    }
  } catch (error) {
    console.error(`RAYDIUM : Error fetching data for ${symbol}:`);
  }
};

const urlRAY = 'https://api-v3.raydium.io/main/stake-pools';

fetchAndUpdateData(urlRAY, 'RAY');
