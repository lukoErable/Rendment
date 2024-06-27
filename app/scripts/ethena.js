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

const updateDataInDatabase = async (symbol, value) => {
  try {
    const connection = await getConnection();
    const dateValue = getDateValue();

    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES ('${dateValue}', 'ETHENA', 'https://app.ethena.fi/stake', 'ETHERUM', 'STAKING', '${symbol}', '${value.toFixed(
      1
    )}', NULL, NULL, NULL, NULL);`;

    await connection.execute(query);

    connection.release();

    console.log(
      `ETHENA: La valeur de ${symbol} a été mise à jour avec succès.`
    );
  } catch (error) {
    console.error(
      `ETHENA : Erreur lors de la mise à jour de la valeur pour ${symbol} :`
    );
  }
};

axios
  .get('https://app.ethena.fi/api/yields/protocol-and-staking-yield')
  .then((response) => {
    updateDataInDatabase('USDC', response.data.stakingYield.value);
  })
  .catch((error) => {
    console.error('ETHENA : Error fetching data:');
  });
