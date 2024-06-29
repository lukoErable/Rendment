import axios from 'axios';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Charger les variables d'environnement
dotenv.config();

// Types
interface DatabaseRow {
  PROTOCOL: string;
  ASSET: string;
  YIELD: number;
}

interface DiscordEmbed {
  title: string;
  color: number;
  description: string;
  fields: {
    name: string;
    value: string;
    inline: boolean;
  }[];
  thumbnail: {
    url: string;
  };
}

// Configuration de la base de données
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const query = `
  SELECT PROTOCOL, 
        CASE 
            WHEN ASSET IN ('JPSOL', 'INF', 'HSOL', 'BONKSOL', 'JITOSOL', 'MSOL') THEN 'SOL'
            ELSE ASSET
        END AS ASSET,
        YIELD
  FROM (
      SELECT p.PROTOCOL, 
            CASE 
                WHEN p.ASSET IN ('JPSOL', 'INF', 'HSOL', 'BONKSOL', 'JITOSOL', 'MSOL') THEN 'SOL'
                ELSE p.ASSET
            END AS ASSET,
            p.YIELD,
            ROW_NUMBER() OVER(PARTITION BY 
                              CASE WHEN p.ASSET IN ('JPSOL', 'INF', 'HSOL', 'BONKSOL', 'JITOSOL', 'MSOL') THEN 'SOL' ELSE p.ASSET END
                              ORDER BY p.YIELD DESC) AS rn
      FROM protocols p
      WHERE p.DATE = CURDATE()
  ) ranked
  WHERE rn = 1
  ORDER BY YIELD DESC;
`;

// Fonction pour récupérer les données de la base de données
const getDataFromDatabase = async (): Promise<DatabaseRow[]> => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(query);
    return rows as DatabaseRow[];
  } catch (error) {
    console.error('Error fetching data from database:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Fonction pour envoyer un message à Discord
const sendToDiscord = async (embed: DiscordEmbed): Promise<void> => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('Discord webhook URL is not defined');
  }
  try {
    await axios.post(webhookUrl, { embeds: [embed] });
    console.log('Message sent to Discord successfully.');
  } catch (error) {
    console.error('Error sending message to Discord:', error);
    throw error;
  }
};

// Fonction pour obtenir la date actuelle au format YYYY-MM-DD
function getDateValue(): string {
  return new Date()
    .toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .split('/')
    .reverse()
    .join('-');
}

// Fonction principale
const main = async (): Promise<void> => {
  try {
    const data = await getDataFromDatabase();
    const dateValue = getDateValue();
    if (data.length === 0) {
      console.log('No data available for today.');
      return;
    }

    const fields = data.map((row) => ({
      name: `${row.ASSET}\n${row.PROTOCOL}`,
      value: `APY: ${row.YIELD.toFixed(2)}%`,
      inline: true,
    }));

    const embed: DiscordEmbed = {
      title: 'Max Yields of the day',
      color: Math.floor(Math.random() * 16777215),
      description: dateValue,
      fields: fields,
      thumbnail: {
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXJpOGhudmYzZnFhOWFlMTZiMWJzZHRnczB2ZG1vMm43OThiMGp0diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VRKheDy4DkBMrQm66p/giphy.gif',
      },
    };

    await sendToDiscord(embed);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Exécuter le script
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main };
