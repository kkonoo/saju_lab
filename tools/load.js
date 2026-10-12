// node에서 js/*.js를 브라우저처럼 한 전역에 불러오기 (테스트용)
const fs = require('fs'), vm = require('vm'), path = require('path');
module.exports = function load(files) {
  const ctx = vm.createContext({ console, Intl, Date, Math, JSON });
  const root = path.join(__dirname, '..');
  const src = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n') + '\n;JEOLGI = ' + fs.readFileSync(path.join(root, 'data/jeolgi.json'), 'utf8') + ';';
  vm.runInContext(src.replace(/^'use strict';/gm, ''), ctx);
  return ctx;
};
