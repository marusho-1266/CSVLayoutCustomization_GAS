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
    // 入力データのコピーを作成
    let result = [...data];
    
    // デバッグログ
    console.log('処理開始:');
    console.log('- データ行数=', result.length);
    console.log('- ヘッダー設定=', settings.has_header ? 'あり' : 'なし');
    if (result.length > 0) {
      console.log('- 処理前の最初の行:', JSON.stringify(result[0]));
    }
    
    // ヘッダーなしCSVを処理するためのフラグ
    let originalHasNoHeader = false;
    
    // ヘッダーがない場合は、列番号をヘッダーとして追加
    if (settings.has_header === false) {
      originalHasNoHeader = true; // 元データにヘッダーがなかったことを記録
      
      // 1行目のデータから列数を取得
      if (result.length > 0) {
        const columnCount = result[0].length;
        const generatedHeader = Array.from({ length: columnCount }, (_, i) => `列${i + 1}`);
        
        // 生成したヘッダー行をデータの先頭に追加
        result.unshift(generatedHeader);
        
        console.log('仮想ヘッダー生成:');
        console.log('- 生成されたヘッダー:', JSON.stringify(generatedHeader));
        console.log('- ヘッダー追加後のデータ行数:', result.length);
        console.log('- ヘッダー追加後の最初の行（仮想ヘッダー）:', JSON.stringify(result[0]));
        console.log('- ヘッダー追加後の2行目（元の1行目）:', JSON.stringify(result[1]));
      }
    }
    
    // 各変換処理を順番に実行   
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

    if (settings.replace) {
      result = replaceStrings(result, settings.replace);
    }

    if (settings.get_pref_code && settings.get_pref_code.enabled) {
      result = getPrefectureCodes(result, settings.get_pref_code.source_column, settings.get_pref_code.new_column);
    }
    
    if (settings.remove_prefecture && settings.remove_prefecture.enabled) {
      result = removePrefectureNames(result, settings.remove_prefecture.column);
    }
    
    if (settings.reorder) {
      result = reorderColumns(result, settings.reorder);
    }
    
    // 最後にヘッダーがなかった場合のフラグを設定
    if (originalHasNoHeader) {
      // originalHasNoHeaderプロパティを結果オブジェクトに追加
      // このフラグでUIと保存処理に元データにヘッダーがなかったことを伝える
      result.originalHasNoHeader = true;
      console.log("originalHasNoHeaderフラグを設定しました");
    }
    
    // 処理結果を返す前に最終確認
    console.log('処理完了:');
    console.log('- 結果データ行数:', result.length);
    console.log('- originalHasNoHeader:', result.originalHasNoHeader);
    if (result.length > 0) {
      console.log('- 最初の行:', JSON.stringify(result[0]));
      if (result.length > 1) {
        console.log('- 2行目:', JSON.stringify(result[1]));
      }
    }
    
    return result;
  } catch (error) {
    console.error('データ変換処理に失敗しました:', error);
    throw new Error('データ変換処理に失敗しました: ' + error.message);
  }
}

/**
 * 列の並べ替え
 * @param {Array} data - 変換対象のデータ
 * @param {string} order - 並べ替え順序（カンマ区切り）
 * @return {Array} 並べ替え後のデータ
 */
function reorderColumns(data, order) {
  // カンマで区切りして新しいヘッダーを作成（空の要素を維持する）
  const orderParts = order.split(',').map(s => s.trim());
  
  // 連続したカンマ（,,）による空の要素を維持して新しいヘッダーを作成
  const newHeader = [];
  for (let i = 0; i < orderParts.length; i++) {
    newHeader.push(orderParts[i]);
  }
  
  const originalHeader = data[0];
  const result = [newHeader]; 
  
  // 元のヘッダーのインデックスを取得 (念のため空白を除去して比較)
  const headerIndexes = {};
  originalHeader.forEach((col, index) => {
    // ヘッダー無しCSV対応のために「列1」「列2」などの形式も検出できるようにする
    headerIndexes[col.trim()] = index;
    
    // 自動生成ヘッダーのパターンにも対応
    const columnPattern = /^列(\d+)$/;
    const match = col.trim().match(columnPattern);
    if (match) {
      // 「列1」→ 0、「列2」→ 1 のようにインデックスを取得
      const columnIndex = parseInt(match[1]) - 1;
      // 数値としての列指定にも対応
      headerIndexes[String(columnIndex + 1)] = index;
    }
  });
  
  console.log('ヘッダーインデックス:', headerIndexes); // デバッグ用
  
  // 新しい列順序でデータを再構築 (データ行のみ)
  for (let i = 1; i < data.length; i++) {
    const originalRow = data[i];
    const newRow = [];

    // 新しいヘッダーの順序でループ
    newHeader.forEach(colName => {
      // 空の要素の場合は空文字を挿入（連続したカンマの場合）
      if (colName === '') {
        newRow.push('');
        return;
      }
      
      // 「列X」形式の指定にも対応
      const columnPattern = /^列(\d+)$/;
      const match = colName.trim().match(columnPattern);
      let originalIndex;
      
      if (match) {
        // 「列1」形式が指定された場合、元データの適切な列を取得
        const columnNumber = match[1];
        originalIndex = headerIndexes[colName.trim()] !== undefined ? 
                         headerIndexes[colName.trim()] : 
                         headerIndexes[columnNumber];
      } else {
        // 通常の列名指定
        originalIndex = headerIndexes[colName.trim()];
      }
      
      if (originalIndex !== undefined && originalRow.length > originalIndex) {
        // 元の行にデータがあれば追加
        newRow.push(originalRow[originalIndex]);
      } else {
        // 元の列が存在しない、または元の行にデータがない場合は空文字を追加
        newRow.push('');
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
  // 0. 元データの準備と設定のパース
  const originalHeader = data[0];
  const originalData = data.slice(1);
  const resultHeader = [...originalHeader]; // 最終的なヘッダー (最初は元のコピー)
  const resultData = originalData.map(row => [...row]); // 最終的なデータ (最初は元のコピー)

  // ヘッダー名を列インデックスに変換するヘルパー関数
  function getColumnIndex(headers, columnName) {
    // 通常の列名検索
    const directIndex = headers.indexOf(columnName);
    if (directIndex !== -1) return directIndex;
    
    // 「列X」形式の場合の処理
    const columnPattern = /^列(\d+)$/;
    const match = columnName.match(columnPattern);
    if (match) {
      // 「列1」形式かどうかチェック
      const columnNameIndex = headers.indexOf(columnName);
      if (columnNameIndex !== -1) return columnNameIndex;
      
      // 数値でのインデックス（「列1」なら0）
      const columnNumber = parseInt(match[1]) - 1;
      if (columnNumber >= 0 && columnNumber < headers.length) {
        return columnNumber;
      }
    }
    
    // どの方法でも見つからない場合
    return -1;
  }

  // 元ヘッダーのインデックスを事前に作成 (空白除去)
  const originalHeaderIndexes = new Map();
  originalHeader.forEach((col, index) => {
    originalHeaderIndexes.set(col.trim(), index);
    
    // 「列X」形式も対応
    const columnPattern = /^列(\d+)$/;
    const match = col.trim().match(columnPattern);
    if (match) {
      // 数値インデックスも登録 (例: 「列1」→「1」)
      const columnNumber = match[1];
      originalHeaderIndexes.set(columnNumber, index);
    }
  });
  
  console.log('結合処理用ヘッダーインデックス:', Object.fromEntries(originalHeaderIndexes));
  
  // 設定をパースして、新しい列の情報と処理内容を保持
  const parsedSettings = mergeSettings
    .split('\n') // 1. 行に分割
    .filter(line => line.trim() !== '') // 2. 空白行を除去 (trim() でチェック)
    .map(rawLine => { // トリムされていない可能性のある行 (rawLine) を処理
      const parts = rawLine.split(':');
      // ':' が1つでない場合は不正
      if (parts.length !== 2) {
        console.warn(`不正な結合設定フォーマット（':'が1つでない）（スキップ）: ${rawLine}`);
        return null;
      }

      // 新列名はここでトリム
      const newColName = parts[0].trim();
      if (newColName === '') {
          console.warn(`不正な結合設定フォーマット（新列名が空）（スキップ）: ${rawLine}`);
          return null;
      }

      // 結合元列と区切り文字部分
      const sourcesAndDelimiterPart = parts[1];

      let sourceCols = [];
      let delimiter = '';
      let useFallback = false;

      const lastCommaIndex = sourcesAndDelimiterPart.lastIndexOf(',');

      if (lastCommaIndex === -1) {
        // カンマがない場合 -> 全体を単一列名として扱う（フォールバックと同じ）
        useFallback = true;
      } else {
        // カンマがある場合
        const sourceStr = sourcesAndDelimiterPart.substring(0, lastCommaIndex);
        const potentialDelimiter = sourcesAndDelimiterPart.substring(lastCommaIndex + 1);

        // カンマ前の部分を解析
        const potentialCols = sourceStr.split(',')
                                .map(s => s.trim())
                                .filter(s => s !== '');

        // カンマ前の部分が有効な列名リストかチェック
        const arePotentialColsValid = potentialCols.length > 0 && potentialCols.every(col => {
          // 通常のヘッダー名チェック
          if (originalHeaderIndexes.has(col)) return true;
          
          // 「列X」形式のチェック
          const columnPattern = /^列(\d+)$/;
          const match = col.match(columnPattern);
          if (match) {
            const columnNumber = match[1];
            // 数値インデックスまたは元のヘッダーに「列X」が含まれているか
            return originalHeaderIndexes.has(columnNumber) || originalHeader.indexOf(col) !== -1;
          }
          
          return false;
        });

        if (arePotentialColsValid) {
          // カンマ前の部分が有効な場合、区切り文字候補が列名でないかチェック
          const trimmedDelimiter = potentialDelimiter.trim();
          
          // 区切り文字候補が列名かどうかをチェック (「列X」形式も考慮)
          let isDelimiterColumn = originalHeaderIndexes.has(trimmedDelimiter);
          if (!isDelimiterColumn) {
            // 「列X」形式のチェック
            const columnPattern = /^列(\d+)$/;
            const match = trimmedDelimiter.match(columnPattern);
            if (match) {
              const columnNumber = match[1];
              isDelimiterColumn = originalHeaderIndexes.has(columnNumber) || originalHeader.indexOf(trimmedDelimiter) !== -1;
            }
          }
          
          // 区切り文字候補が空文字列でない、かつヘッダーに存在するか
          if (trimmedDelimiter !== '' && isDelimiterColumn) {
            // 区切り文字候補が有効な列名だった -> フォールバック（全体を列名として解釈）
            useFallback = true;
          } else {
            // 区切り文字候補が列名ではない -> この解析結果を採用
            sourceCols = potentialCols;
            delimiter = potentialDelimiter; // トリムしない元の区切り文字を採用
            useFallback = false;
          }
        } else {
          // カンマ前の部分が無効 -> フォールバック（全体を列名として解釈）
          useFallback = true;
        }
      }

      // フォールバック処理（全体を列名として解釈）
      if (useFallback) {
        const allPotentialCols = sourcesAndDelimiterPart.split(',')
                                  .map(s => s.trim())
                                  .filter(s => s !== '');
        
        // 「列X」形式も考慮した列名リストかチェック
        const areAllValid = allPotentialCols.length > 0 && allPotentialCols.every(col => {
          // 通常のヘッダー名チェック
          if (originalHeaderIndexes.has(col)) return true;
          
          // 「列X」形式のチェック
          const columnPattern = /^列(\d+)$/;
          const match = col.match(columnPattern);
          if (match) {
            const columnNumber = match[1];
            // 数値インデックスまたは元のヘッダーに「列X」が含まれているか
            return originalHeaderIndexes.has(columnNumber) || originalHeader.indexOf(col) !== -1;
          }
          
          return false;
        });
        
        if (areAllValid) {
          sourceCols = allPotentialCols;
          delimiter = ''; // 区切り文字なし
        } else {
          // フォールバックでも有効な列名リストが見つからない場合はエラー
          console.warn(`不正な結合設定: 有効な結合元列名が見つかりません（スキップ）: ${rawLine}`);
          return null;
        }
      }

      // 結合元列名が一つもない場合は不正 (上のロジックでチェック済みだが念のため)
      if (sourceCols.length === 0) {
          console.warn(`不正な結合設定フォーマット（結合元列なし）: ${rawLine}`);
          return null;
      }

      // ':' の右側が全体として空だった場合も不正とする (トリムしてチェック)
      if (sourcesAndDelimiterPart.trim() === '') {
          console.warn(`不正な結合設定フォーマット（結合元/区切り文字が空）（スキップ）: ${rawLine}`);
          return null;
      }

      return { newColName, sourceCols, delimiter };
    })
    .filter(setting => setting !== null);

  // 1. 新しい列をヘッダーに追加
  const newColsToAdd = [];
  parsedSettings.forEach(setting => {
    // 新しい列名が既存ヘッダーにも元のヘッダーにもない場合のみ追加
    if (!resultHeader.some(h => h.trim() === setting.newColName) && !originalHeaderIndexes.has(setting.newColName)) {
      newColsToAdd.push(setting.newColName);
    } else if (originalHeaderIndexes.has(setting.newColName)) {
      console.warn(`結合設定: 新しい列名 "${setting.newColName}" は元の列名と重複しています。元の列が上書きされます。`);
    } else {
       // resultHeader に既に存在する (他の設定で先に追加された) 場合は何もしない
    }
  });
  // 重複を排除して追加
  const uniqueNewCols = [...new Set(newColsToAdd)];
  resultHeader.push(...uniqueNewCols);
  if (uniqueNewCols.length > 0) {
    resultData.forEach(row => {
      for (let k = 0; k < uniqueNewCols.length; k++) {
        row.push(''); // 新しい列に対応する空のセルを追加
      }
    });
  }


  // 2. 新しいヘッダーでのインデックスを作成 (再作成)
  const resultHeaderIndexes = new Map();
  resultHeader.forEach((col, index) => {
    resultHeaderIndexes.set(col.trim(), index); // トリムして登録
  });

  // 3. 各データ行に対して結合処理を実行
  parsedSettings.forEach(setting => {
    const targetColIndex = resultHeaderIndexes.get(setting.newColName);
    // 対象列が結果ヘッダーに見つからない場合 (通常は起こらないはず)
    if (targetColIndex === undefined) {
        console.error(`内部エラー: 結合対象の列 "${setting.newColName}" が結果ヘッダーに見つかりません。`);
        return;
    }

    // 元データのインデックスを再確認 (大文字小文字を区別しない場合などはここで調整)
    const sourceIndexes = setting.sourceCols.map(sourceColName => {
        const trimmedName = sourceColName.trim();
        // 直接検索
        const directIndex = originalHeaderIndexes.get(trimmedName);
        if (directIndex !== undefined) {
          return directIndex;
        }
        
        // 「列X」形式のチェック
        const columnPattern = /^列(\d+)$/;
        const match = trimmedName.match(columnPattern);
        if (match) {
          // 列番号を取得して検索
          const columnNumber = match[1];
          const colByNumber = originalHeaderIndexes.get(columnNumber);
          if (colByNumber !== undefined) {
            return colByNumber;
          }
        }
        
        // インデックスで直接取得
        const headerIndex = originalHeader.indexOf(trimmedName);
        if (headerIndex !== -1) {
          return headerIndex;
        }
        
        console.warn(`結合元列 "${sourceColName}" が元のヘッダーに見つかりません。空文字として扱われます。`);
        return undefined;
    });


    resultData.forEach((row, rowIndex) => {
      // originalData から値を取得する方がより安全
      const originalRow = originalData[rowIndex];
      if (!originalRow) {
          console.error(`内部エラー: 元データに対応する行が見つかりません。行インデックス: ${rowIndex}`);
          return; // or row[targetColIndex] = '';
      }

      const valuesToJoin = sourceIndexes.map(originalIndex => {
        if (originalIndex !== undefined && originalRow.length > originalIndex) {
          // 値が null や undefined の場合も考慮して文字列に変換
          const val = originalRow[originalIndex];
          return (val === null || val === undefined) ? '' : String(val);
        }
        return ''; // 元の列が見つからない、または元の行にデータがない場合は空文字
      });
      // 結合した値を結果の行の対応する列インデックスに設定
      row[targetColIndex] = valuesToJoin.join(setting.delimiter);
    });
  });

  // 4. 最終結果を組み立てる (ヘッダー + データ)
  return [resultHeader, ...resultData];
}

/**
 * 文字列の抽出
 * @param {Array} data - 変換対象のデータ
 * @param {string} extractSettings - 抽出設定
 * @return {Array} 抽出後のデータ
 */
function extractStrings(data, extractSettings) {
  const settings = extractSettings.split('\n').filter(line => line.trim() !== '');
  let result = [...data];
  
  // 列名から列インデックスを取得するヘルパー関数
  function getColumnIndex(headers, columnName) {
    // 通常の列名検索
    const directIndex = headers.indexOf(columnName);
    if (directIndex !== -1) return directIndex;
    
    // 「列X」形式の場合の処理
    const columnPattern = /^列(\d+)$/;
    const match = columnName.match(columnPattern);
    if (match) {
      // 「列1」形式かどうかチェック
      const columnNameIndex = headers.indexOf(columnName);
      if (columnNameIndex !== -1) return columnNameIndex;
      
      // 数値でのインデックス（「列1」なら0）
      const columnNumber = parseInt(match[1]) - 1;
      if (columnNumber >= 0 && columnNumber < headers.length) {
        return columnNumber;
      }
    }
    
    // どの方法でも見つからない場合
    return -1;
  }
  
  settings.forEach(setting => {
    const parts = setting.split(':');
    if (parts.length !== 4) {
      console.warn(`不正な抽出設定フォーマット（スキップ）: ${setting}。期待される形式: "新項目名:抽出元項目:開始位置:文字数"`);
      return;
    }
    
    const [newCol, sourceCol, start, length] = parts.map(p => p.trim());
    const startPos = parseInt(start) - 1;
    const len = parseInt(length);
    
    // パラメータの検証
    if (isNaN(startPos) || isNaN(len) || startPos < 0 || len < 0) {
      console.warn(`不正な抽出設定パラメータ（スキップ）: ${setting}。開始位置は1以上、文字数は0以上の整数で指定してください。`);
      return;
    }
    
    // 抽出元列のインデックスを取得
    const sourceIndex = getColumnIndex(result[0], sourceCol);
    if (sourceIndex === -1) {
      console.warn(`抽出元列 "${sourceCol}" が見つかりません（抽出設定をスキップ）: ${setting}`);
      return;
    }
    
    // ヘッダーに新しい列を追加
    result[0].push(newCol);
    
    // 各行のデータを抽出
    for (let i = 1; i < result.length; i++) {
      if (sourceIndex >= result[i].length) {
        result[i].push(''); // 対象列が存在しない場合は空文字を追加
        continue;
      }
      
      const value = result[i][sourceIndex].toString();
      if (startPos >= value.length) {
        result[i].push(''); // 開始位置が文字列長を超える場合は空文字を追加
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
  
  // 列名から列インデックスを取得するヘルパー関数
  function getColumnIndex(headers, columnName) {
    // 通常の列名検索
    const directIndex = headers.indexOf(columnName);
    if (directIndex !== -1) return directIndex;
    
    // 「列X」形式の場合の処理
    const columnPattern = /^列(\d+)$/;
    const match = columnName.match(columnPattern);
    if (match) {
      // 「列1」形式かどうかチェック
      const columnNameIndex = headers.indexOf(columnName);
      if (columnNameIndex !== -1) return columnNameIndex;
      
      // 数値でのインデックス（「列1」なら0）
      const columnNumber = parseInt(match[1]) - 1;
      if (columnNumber >= 0 && columnNumber < headers.length) {
        return columnNumber;
      }
    }
    
    // どの方法でも見つからない場合
    return -1;
  }
  
  settings.forEach(setting => {
    const [col, chars] = setting.split(':');
    if (!col || !chars) {
      console.warn('不正な除去設定フォーマット（スキップ）:', setting);
      return;
    }
    
    const colIndex = getColumnIndex(result[0], col.trim());
    if (colIndex === -1) {
      console.warn(`列 "${col}" が見つかりません（除去設定をスキップ）`);
      return;
    }
    
    const characters = chars.split(',');
    for (let i = 1; i < result.length; i++) {
      let value = result[i][colIndex].toString();
      characters.forEach(char => {
        // 正規表現メタ文字をエスケープするヘルパー関数を使う
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
  
  // 列名から列インデックスを取得するヘルパー関数
  function getColumnIndex(headers, columnName) {
    // 通常の列名検索
    const directIndex = headers.indexOf(columnName);
    if (directIndex !== -1) return directIndex;
    
    // 「列X」形式の場合の処理
    const columnPattern = /^列(\d+)$/;
    const match = columnName.match(columnPattern);
    if (match) {
      // 「列1」形式かどうかチェック
      const columnNameIndex = headers.indexOf(columnName);
      if (columnNameIndex !== -1) return columnNameIndex;
      
      // 数値でのインデックス（「列1」なら0）
      const columnNumber = parseInt(match[1]) - 1;
      if (columnNumber >= 0 && columnNumber < headers.length) {
        return columnNumber;
      }
    }
    
    // どの方法でも見つからない場合
    return -1;
  }
  
  settings.forEach(setting => {
    const [col, position, text] = setting.split(':');
    if (!col || !position || text === undefined) {
      console.warn('不正な追加設定フォーマット（スキップ）:', setting);
      return;
    }
    
    const colIndex = getColumnIndex(result[0], col.trim());
    if (colIndex === -1) {
      console.warn(`列 "${col}" が見つかりません（追加設定をスキップ）`);
      return;
    }
    
    for (let i = 1; i < result.length; i++) {
      const value = result[i][colIndex].toString();
      result[i][colIndex] = position === '前' ? text + value : value + text;
    }
  });
  
  return result;
}

/**
 * 文字列の置換
 * 指定された列内の文字列を検索し、別の文字列に置換します。
 * @param {Array<Array<string>>} data - 変換対象のデータ (最初の行はヘッダー)
 * @param {string} replaceSettings - 置換設定。各行に "対象列名:検索文字列:置換後文字列" の形式で記述。
 *                                   例: "備考:（株）:(株式会社)\n住所:東京都:ＴＫ都"
 * @return {Array<Array<string>>} 置換後のデータ
 */
function replaceStrings(data, replaceSettings) {
  // 元データを変更しないようにディープコピーを作成
  let result = data.map(row => [...row]);
  const header = result[0];
  
  // 列名から列インデックスを取得するヘルパー関数
  function getColumnIndex(headers, columnName) {
    // 通常の列名検索
    const directIndex = headers.indexOf(columnName);
    if (directIndex !== -1) return directIndex;
    
    // 「列X」形式の場合の処理
    const columnPattern = /^列(\d+)$/;
    const match = columnName.match(columnPattern);
    if (match) {
      // 「列1」形式かどうかチェック
      const columnNameIndex = headers.indexOf(columnName);
      if (columnNameIndex !== -1) return columnNameIndex;
      
      // 数値でのインデックス（「列1」なら0）
      const columnNumber = parseInt(match[1]) - 1;
      if (columnNumber >= 0 && columnNumber < headers.length) {
        return columnNumber;
      }
    }
    
    // どの方法でも見つからない場合
    return -1;
  }

  // 設定を解析
  const settings = replaceSettings
    .split('\n') // 改行で各設定に分割
    .map(line => line.trim()) // 前後の空白を除去
    .filter(line => line !== ''); // 空行を除去

  settings.forEach(setting => {
    const parts = setting.split(':');
    // 設定は "対象列名:検索文字列:置換後文字列" の3つの部分で構成される
    if (parts.length !== 3) {
      console.warn(`不正な置換設定フォーマット（スキップ）: ${setting}。期待される形式: "列名:検索文字列:置換後文字列"`);
      return; // この不正な設定をスキップ
    }
    // 各部分の前後の空白を除去
    const [colName, searchString, replaceString] = parts.map(s => s.trim());

    // 列名や検索文字列が空の場合は無効な設定としてスキップ（置換後文字列は空でもOK）
    if (colName === '' || searchString === '') {
        console.warn(`不正な置換設定: 列名と検索文字列は空にできません（スキップ）: ${setting}`);
        return;
    }

    // 対象列のインデックスを取得
    const colIndex = getColumnIndex(header, colName);
    if (colIndex === -1) {
      console.warn(`置換対象の列 "${colName}" が見つかりません（設定をスキップ）: ${setting}`);
      return; // 列が見つからない場合はスキップ
    }

    // データ行を処理 (ヘッダー行を除くため i=1 から開始)
    for (let i = 1; i < result.length; i++) {
      // 行に対象列が存在するか確認
      if (result[i].length > colIndex) {
        let originalValue = result[i][colIndex];

        // 値が null や undefined の場合、空文字列として扱う
        if (originalValue === null || originalValue === undefined) {
            originalValue = '';
        } else {
            // 置換前に値を文字列に変換
            originalValue = originalValue.toString();
        }

        // String.prototype.replaceAll() を使用して、列内のすべての検索文字列を置換
        try {
            result[i][colIndex] = originalValue.replaceAll(searchString, replaceString);
        } catch (e) {
            // replaceAll でエラーが発生した場合 (例: searchString が空の場合など、ただし上のチェックで回避済みのはず)
            console.error(`置換処理中にエラーが発生しました。設定: "${setting}", 行: ${i+1}, 元の値: "${originalValue}", エラー: ${e.message}`);
        }
      }
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
  const targetColumns = columns.split(',').map(c => c.trim()).filter(c => c !== '');
  let result = [...data];
  
  // 列名から列インデックスを取得するヘルパー関数
  function getColumnIndex(headers, columnName) {
    // 通常の列名検索
    const directIndex = headers.indexOf(columnName);
    if (directIndex !== -1) return directIndex;
    
    // 「列X」形式の場合の処理
    const columnPattern = /^列(\d+)$/;
    const match = columnName.match(columnPattern);
    if (match) {
      // 「列1」形式かどうかチェック
      const columnNameIndex = headers.indexOf(columnName);
      if (columnNameIndex !== -1) return columnNameIndex;
      
      // 数値でのインデックス（「列1」なら0）
      const columnNumber = parseInt(match[1]) - 1;
      if (columnNumber >= 0 && columnNumber < headers.length) {
        return columnNumber;
      }
    }
    
    // どの方法でも見つからない場合
    return -1;
  }
  
  targetColumns.forEach(col => {
    if (!col) return;
    
    const colIndex = getColumnIndex(result[0], col);
    if (colIndex === -1) {
      console.warn(`列 "${col}" が見つかりません（都道府県名除去設定をスキップ）`);
      return;
    }
    
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
  
  // 列名から列インデックスを取得するヘルパー関数
  function getColumnIndex(headers, columnName) {
    // 通常の列名検索
    const directIndex = headers.indexOf(columnName);
    if (directIndex !== -1) return directIndex;
    
    // 「列X」形式の場合の処理
    const columnPattern = /^列(\d+)$/;
    const match = columnName.match(columnPattern);
    if (match) {
      // 「列1」形式かどうかチェック
      const columnNameIndex = headers.indexOf(columnName);
      if (columnNameIndex !== -1) return columnNameIndex;
      
      // 数値でのインデックス（「列1」なら0）
      const columnNumber = parseInt(match[1]) - 1;
      if (columnNumber >= 0 && columnNumber < headers.length) {
        return columnNumber;
      }
    }
    
    // どの方法でも見つからない場合
    return -1;
  }
  
  const sourceIndex = getColumnIndex(result[0], sourceColumn.trim());
  if (sourceIndex === -1) {
    console.warn(`都道府県名を含む列 "${sourceColumn}" が見つかりません（都道府県コード取得をスキップ）`);
    return result;
  }
  
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