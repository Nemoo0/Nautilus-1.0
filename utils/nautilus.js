const fs = require('fs');
const path = require('path');

function sort(folderPath, rules, onProgress = () => {}) {
  const files = fs.readdirSync(folderPath);
  let processed = 0;

  const total = files.filter(file => {
    const stat = fs.statSync(path.join(folderPath, file));
    return stat.isFile();
  }).length;

  files.forEach(file => {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) return;

    const fileExt = path.extname(file).toLowerCase();

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

    processed++;
    onProgress(Math.round((processed / total) * 100));
  });
}

module.exports = {
  sort
};
