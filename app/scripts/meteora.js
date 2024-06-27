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

const updateDataInDatabase = async (symbol, yieldValue, TVL) => {
  try {
    const connection = await getConnection();

    const dateValue = getDateValue();
    const query = `
      INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
      VALUES (?, 'METEORA', 'https://app.meteora.ag/vaults', 'SOLANA', 'FARMING', ?, ?, NULL, NULL, NULL, ?)
      ON DUPLICATE KEY UPDATE YIELD = VALUES(YIELD), TVL = VALUES(TVL);`;

    await connection.execute(query, [dateValue, symbol, yieldValue, TVL]);

    connection.release();

    console.log(
      `METEORA : La valeur de ${symbol} a été mise à jour : ${yieldValue}.`
    );
  } catch (error) {
    console.error(
      `Erreur lors de la mise à jour de la valeur pour ${symbol} :`,
      error
    );
  }
};

const fetchAndUpdateData = async (url) => {
  try {
    const response = await axios.get(url);
    const data = response.data;

    const tokensToProcess = ['USDC', 'USDT', 'SOL'];
    tokensToProcess.forEach((tokenSymbol) => {
      const tokenData = data.find((item) => item.symbol === tokenSymbol);
      if (tokenData) {
        const { closest_apy: yieldValue, token_amount: TVL } = tokenData;
        updateDataInDatabase(tokenSymbol, yieldValue, TVL);
      }
    });
  } catch (error) {
    console.error(`METEORA : Error fetching data from ${url}:`);
  }
};

const url = 'https://app.meteora.ag/vault/vault_info';

fetchAndUpdateData(url);
