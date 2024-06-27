const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const currentDirectory = __dirname;

const readdir = promisify(fs.readdir);

(async () => {
  try {
    const files = await readdir(currentDirectory);
    const scriptPromises = [];

    files.forEach((file) => {
      const filePath = path.join(currentDirectory, file);
      if (
        file.endsWith('.js') &&
        file !== 'start_all.js' &&
        file !== 'webhook.js' &&
        file !== 'aave.js' &&
        file !== 'beefy.js' &&
        file !== 'renzo.js' &&
        file !== 'ethena.js' &&
        file !== 'lido.js'
      ) {
        console.log(`Exécution du fichier : ${filePath}`);
        const promise = new Promise((resolve, reject) => {
          try {
            require(filePath);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        scriptPromises.push(promise);
      }
    });

    await Promise.all(scriptPromises);
  } catch (err) {
    console.error(
      "Erreur lors de la lecture du répertoire ou de l'exécution des fichiers :",
      err
    );
  }
})();
