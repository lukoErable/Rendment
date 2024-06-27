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

const updateDataInDatabase = async (symbol, totalApy) => {
  try {
    const connection = await getConnection();
    const dateValue = getDateValue();

    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES ('${dateValue}', 'BEEFY', 'https://app.beefy.com/vault/${symbol}', 'ETHERUM', 'FARMING', '${symbol}', '${(
      totalApy * 100
    ).toFixed(2)}', NULL, NULL, NULL, NULL);`;

    const url = `https://app.beefy.com/vault/${symbol}`;

    await connection.execute(query, [(totalApy * 100).toFixed(2), url]);

    connection.release();

    console.log(
      `BEEFY : La valeur de ${symbol} a été mise à jour avec succès.`
    );
  } catch (error) {
    console.error(
      `BEEFY : Erreur lors de la mise à jour de la valeur pour ${symbol} :`
    );
  }
};

axios
  .get('https://api.beefy.finance/apy/breakdown?_=1716377340000')
  .then((response) => {
    updateDataInDatabase('conic-eth', response.data['conic-eth'].totalApy);
    updateDataInDatabase('conic-usdc', response.data['conic-usdc'].totalApy);
    updateDataInDatabase(
      'compound-mainnet-eth',
      response.data['compound-mainnet-eth'].totalApy
    );
  })
  .catch((error) => {
    console.error('BEEFY : Erreur lors de la récupération des données :');
  });
