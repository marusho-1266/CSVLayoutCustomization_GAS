/**
 * CSVレイアウト変更ツール
 * データ変換処理スクリプト
 */

/**
 * データ変換処理のメイン関数
 * @param {Array} data - 変換対象のデータ
 * @param {Object} settings - 変換設定
 * @return {Array} 変換後のデータ
 */
function processData(data, settings) {
  try {
    let result = [...data];
    
    // 各変換処理を順番に実行
    if (settings.reorder) {
      result = reorderColumns(result, settings.reorder);
    }
    
    if (settings.merge) {
      result = mergeColumns(result, settings.merge);
    }
    
    if (settings.extract) {
      result = extractStrings(result, settings.extract);
    }
    
    if (settings.remove) {
      result = removeCharacters(result, settings.remove);
    }
    
    if (settings.add) {
      result = addCharacters(result, settings.add);
    }
    
    if (settings.remove_prefecture && settings.remove_prefecture.enabled) {
      result = removePrefectureNames(result, settings.remove_prefecture.column);
    }
    
    if (settings.get_pref_code && settings.get_pref_code.enabled) {
      result = getPrefectureCodes(result, settings.get_pref_code.source_column, settings.get_pref_code.new_column);
    }
    
    return result;
  } catch (error) {
    console.error('データ変換処理に失敗しました:', error);
    throw new Error('データ変換処理に失敗しました');
  }
}

/**
 * 列の並べ替え
 * @param {Array} data - 変換対象のデータ
 * @param {string} order - 並べ替え順序（カンマ区切り）
 * @return {Array} 並べ替え後のデータ
 */
function reorderColumns(data, order) {
  const columns = order.split(',');
  const header = data[0];
  const result = [header];
  
  // ヘッダーのインデックスを取得
  const headerIndexes = {};
  header.forEach((col, index) => {
    headerIndexes[col] = index;
  });
  
  // 新しい列順序でデータを再構築
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const newRow = [];
    
    columns.forEach(col => {
      if (col === '') {
        newRow.push(''); // 空の列
      } else if (headerIndexes[col] !== undefined) {
        newRow.push(row[headerIndexes[col]]);
      }
    });
    
    result.push(newRow);
  }
  
  return result;
}

/**
 * 列の結合
 * @param {Array} data - 変換対象のデータ
 * @param {string} mergeSettings - 結合設定
 * @return {Array} 結合後のデータ
 */
function mergeColumns(data, mergeSettings) {
  const settings = mergeSettings.split('\n');
  let result = [...data];
  
  settings.forEach(setting => {
    const [newCol, sources] = setting.split(':');
    const [cols, delimiter] = sources.split(' ');
    const sourceCols = cols.split(',');
    
    // ヘッダーに新しい列を追加
    result[0].push(newCol);
    
    // 各行のデータを結合
    for (let i = 1; i < result.length; i++) {
      const values = sourceCols.map(col => {
        const colIndex = result[0].indexOf(col);
        return colIndex !== -1 ? result[i][colIndex] : '';
      });
      result[i].push(values.join(delimiter || ''));
    }
  });
  
  return result;
}

/**
 * 文字列の抽出
 * @param {Array} data - 変換対象のデータ
 * @param {string} extractSettings - 抽出設定
 * @return {Array} 抽出後のデータ
 */
function extractStrings(data, extractSettings) {
  const settings = extractSettings.split('\n');
  let result = [...data];
  
  settings.forEach(setting => {
    const [newCol, sourceCol, start, length] = setting.split(':');
    const startPos = parseInt(start) - 1;
    const len = parseInt(length);
    
    // ヘッダーに新しい列を追加
    result[0].push(newCol);
    
    // 各行のデータを抽出
    for (let i = 1; i < result.length; i++) {
      const sourceIndex = result[0].indexOf(sourceCol);
      if (sourceIndex === -1) {
        result[i].push('');
        continue;
      }
      
      const value = result[i][sourceIndex].toString();
      if (startPos >= value.length) {
        result[i].push('');
      } else {
        result[i].push(value.substr(startPos, len));
      }
    }
  });
  
  return result;
}

/**
 * 文字の除去
 * @param {Array} data - 変換対象のデータ
 * @param {string} removeSettings - 除去設定
 * @return {Array} 除去後のデータ
 */
function removeCharacters(data, removeSettings) {
  const settings = removeSettings.split('\n');
  let result = [...data];
  
  settings.forEach(setting => {
    const [col, chars] = setting.split(':');
    const colIndex = result[0].indexOf(col);
    if (colIndex === -1) return;
    
    const characters = chars.split(',');
    for (let i = 1; i < result.length; i++) {
      let value = result[i][colIndex].toString();
      characters.forEach(char => {
        // 正規表現メタ文字をエスケープするヘルパー関数を使うか、
        // 単純な置換を繰り返す
        const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // メタ文字エスケープ例
        value = value.replace(new RegExp(escapedChar, 'g'), '');
      });
      result[i][colIndex] = value;
    }
  });
  
  return result;
}

/**
 * 文字の追加
 * @param {Array} data - 変換対象のデータ
 * @param {string} addSettings - 追加設定
 * @return {Array} 追加後のデータ
 */
function addCharacters(data, addSettings) {
  const settings = addSettings.split('\n');
  let result = [...data];
  
  settings.forEach(setting => {
    const [col, position, text] = setting.split(':');
    const colIndex = result[0].indexOf(col);
    if (colIndex === -1) return;
    
    for (let i = 1; i < result.length; i++) {
      const value = result[i][colIndex].toString();
      result[i][colIndex] = position === '前' ? text + value : value + text;
    }
  });
  
  return result;
}

/**
 * 都道府県名の除去
 * @param {Array} data - 変換対象のデータ
 * @param {string} columns - 対象列（カンマ区切り）
 * @return {Array} 除去後のデータ
 */
function removePrefectureNames(data, columns) {
  const targetColumns = columns.split(',');
  let result = [...data];
  
  targetColumns.forEach(col => {
    const colIndex = result[0].indexOf(col);
    if (colIndex === -1) return;
    
    for (let i = 1; i < result.length; i++) {
      const value = result[i][colIndex].toString();
      const prefecture = getPrefectureName(value);
      if (prefecture) {
        result[i][colIndex] = value.replace(prefecture, '').trim();
      }
    }
  });
  
  return result;
}

/**
 * 都道府県コードの取得
 * @param {Array} data - 変換対象のデータ
 * @param {string} sourceColumn - 都道府県名を含む列
 * @param {string} newColumn - 都道府県コードを格納する列
 * @return {Array} コード追加後のデータ
 */
function getPrefectureCodes(data, sourceColumn, newColumn) {
  let result = [...data];
  const sourceIndex = result[0].indexOf(sourceColumn);
  if (sourceIndex === -1) return result;
  
  // ヘッダーに新しい列を追加
  result[0].push(newColumn);
  
  // 各行のデータを処理
  for (let i = 1; i < result.length; i++) {
    const value = result[i][sourceIndex].toString();
    const prefecture = getPrefectureName(value);
    const code = prefecture ? getPrefectureCode(prefecture) : '';
    result[i].push(code);
  }
  
  return result;
}

/**
 * 文字列から都道府県名を抽出
 * @param {string} value - 対象文字列
 * @return {string|null} 都道府県名（見つからない場合はnull）
 */
function getPrefectureName(value) {
  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];
  
  for (const prefecture of prefectures) {
    if (value.startsWith(prefecture)) {
      return prefecture;
    }
  }
  
  return null;
}

/**
 * 都道府県名から都道府県コードを取得
 * @param {string} prefecture - 都道府県名
 * @return {string} 都道府県コード
 */
function getPrefectureCode(prefecture) {
  const codes = {
    '北海道': '01', '青森県': '02', '岩手県': '03', '宮城県': '04', '秋田県': '05',
    '山形県': '06', '福島県': '07', '茨城県': '08', '栃木県': '09', '群馬県': '10',
    '埼玉県': '11', '千葉県': '12', '東京都': '13', '神奈川県': '14', '新潟県': '15',
    '富山県': '16', '石川県': '17', '福井県': '18', '山梨県': '19', '長野県': '20',
    '岐阜県': '21', '静岡県': '22', '愛知県': '23', '三重県': '24', '滋賀県': '25',
    '京都府': '26', '大阪府': '27', '兵庫県': '28', '奈良県': '29', '和歌山県': '30',
    '鳥取県': '31', '島根県': '32', '岡山県': '33', '広島県': '34', '山口県': '35',
    '徳島県': '36', '香川県': '37', '愛媛県': '38', '高知県': '39', '福岡県': '40',
    '佐賀県': '41', '長崎県': '42', '熊本県': '43', '大分県': '44', '宮崎県': '45',
    '鹿児島県': '46', '沖縄県': '47'
  };
  
  return codes[prefecture] || '';
} 