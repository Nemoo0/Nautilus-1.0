const fs = require('fs');
const path = require('path');

function sort(folderPath, rules) {
  const files = fs.readdirSync(folderPath);

  files.forEach(file => {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);

    // On ignore les dossiers
    if (!stat.isFile()) return;

    const fileExt = path.extname(file).toLowerCase();

    // Trouve la première règle correspondante
    const matchedRule = rules.find(rule => {
      const matchExt = rule.extensions?.some(ext => ext.toLowerCase() === fileExt);
      const matchKeyword = rule.keywords?.some(keyword => file.toLowerCase().includes(keyword.toLowerCase()));
      return matchExt || matchKeyword;
    });

    if (matchedRule) {
      const targetDir = path.join(folderPath, matchedRule.name);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
      }

      const newFilePath = path.join(targetDir, file);
      fs.renameSync(filePath, newFilePath);
    }
  });
}

module.exports = {
  sort
};
