/**
 * CSVレイアウト変更ツール
 * メインスクリプトファイル
 */

/**
 * ウェブアプリケーションのエントリーポイント
 * @return {HtmlOutput} レンダリングされたHTML
 */
function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('CSVレイアウト変更ツール')
    .setFaviconUrl('https://www.google.com/favicon.ico');
}

/**
 * HTMLファイルのインクルード処理
 * @param {string} filename - インクルードするファイル名
 * @return {string} ファイルの内容
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * CSVファイルを読み込む
 * @param {string} fileId - Google DriveのファイルID
 * @return {Array} CSVデータの二次元配列
 */
function readCsvFromDrive(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    // ▼▼▼ Shift-JIS読み込み対応
    let content;
    try {
        // まずUTF-8で試す
        content = file.getBlob().getDataAsString('UTF-8');
    } catch (e) {
        // UTF-8で失敗したらShift-JISで試す
        try {
            content = file.getBlob().getDataAsString('Shift_JIS');
        } catch (e2) {
            console.error('UTF-8およびShift_JISでのCSV読み込みに失敗:', e, e2);
            throw new Error('サポートされていない文字コードか、ファイルが破損しています。');
        }
    }
    return Utilities.parseCsv(content);
  } catch (error) {
    console.error('CSVファイルの読み込みに失敗しました:', error);
    throw new Error('CSVファイルの読み込みに失敗しました: ' + error.message);
  }
}

/**
 * 変換結果を保存する
 * @param {Array} data - 保存するデータ
 * @param {string} fileName - 保存するファイル名
 * @param {string} format - 保存形式（'csv'または'sheets'）
 * @param {boolean} removeHeader - ヘッダー行を除去するかどうか
 * @return {string} 保存したファイルのID
 */
function saveResultToDrive(data, fileName, format, removeHeader) {
  try {
    const folder = DriveApp.getRootFolder(); // 保存先はルートフォルダ固定
    let file;
    let fileId;

    if (format === 'csv') {
      // ヘッダー除去の設定に応じてデータを処理
      const dataToSave = removeHeader ? data.slice(1) : data;
      const csvContent = dataToSave.map(row => row.join(',')).join('\n');
      // ▼▼▼ 文字コードは UTF-8 に固定 ▼▼▼
      const charset = 'UTF-8';
      const blob = Utilities.newBlob(csvContent, 'text/csv; charset=' + charset, fileName);
      // ▲▲▲ ここまで修正 ▲▲▲
      file = folder.createFile(blob);
      fileId = file.getId();
    } else if (format === 'sheets') {
      const ss = SpreadsheetApp.create(fileName);
      const sheet = ss.getActiveSheet();
      // データがない場合のヘッダー行のみの書き込みに対応
      if (data.length > 0 && data[0].length > 0) {
        // ヘッダー除去の設定に応じてデータを処理
        const dataToSave = removeHeader ? data.slice(1) : data;
        sheet.getRange(1, 1, dataToSave.length, dataToSave[0].length).setValues(dataToSave);
      } else if (data.length > 0) { // ヘッダー行のみの場合
        sheet.getRange(1, 1, 1, data[0].length).setValues([data[0]]);
      }
      fileId = ss.getId();
    } else {
      throw new Error('無効な保存形式です');
    }

    return fileId;
  } catch (error) {
    console.error('ファイルの保存に失敗しました:', error);
    throw new Error('ファイルの保存に失敗しました: ' + error.message);
  }
}

/**
 * プロファイルを保存する
 * @param {string} name - プロファイル名
 * @param {Object} settings - プロファイル設定
 */
function saveProfile(name, settings) {
  try {
    const userProperties = PropertiesService.getUserProperties();
    const profiles = JSON.parse(userProperties.getProperty('profiles') || '{}');
    profiles[name] = settings;
    userProperties.setProperty('profiles', JSON.stringify(profiles));
  } catch (error) {
    console.error('プロファイルの保存に失敗しました:', error);
    throw new Error('プロファイルの保存に失敗しました: ' + error.message);
  }
}

/**
 * プロファイル一覧を取得する
 * @return {Object} プロファイル一覧
 */
function getProfiles() {
  try {
    const userProperties = PropertiesService.getUserProperties();
    return JSON.parse(userProperties.getProperty('profiles') || '{}');
  } catch (error) {
    console.error('プロファイルの取得に失敗しました:', error);
    throw new Error('プロファイルの取得に失敗しました: ' + error.message);
  }
}

/**
 * 指定されたプロファイルを取得する
 * @param {string} name - プロファイル名
 * @return {Object} プロファイル設定
 */
function getProfile(name) {
  try {
    const profiles = getProfiles(); // 既存の getProfiles を利用
    if (profiles && profiles[name]) {
      return profiles[name];
    } else {
      // プロファイルが見つからない場合は空の設定を返すか、エラーを投げる
      // ここでは空の設定を返すようにしてみる（フロントエンドでハンドリングしやすいように）
      // throw new Error('指定されたプロファイルが見つかりません: ' + name);
      return {}; // 空のオブジェクトを返す
    }
  } catch (error) {
    console.error('プロファイルの取得に失敗しました:', error);
    throw new Error('プロファイルの取得に失敗しました: ' + error.message);
  }
}

/**
 * ファイルの内容を処理する (フロントエンドから呼び出される)
 * @param {string} content - CSVファイルの内容 (フロントエンドでデコード済み)
 * @return {Array} CSVデータの二次元配列
 */
function processFileContent(content) {
  try {
    // Utilities.parseCsv はUTF-8として解釈するため、
    // フロントエンドで正しくデコードされた文字列を渡すことが重要
    return Utilities.parseCsv(content);
  } catch (error) {
    console.error('CSVファイルの解析に失敗しました:', error);
    throw new Error('CSVファイルの解析に失敗しました: ' + error.message);
  }
}

/**
 * プロファイルを削除する
 * @param {string} name - 削除するプロファイル名
 */
function deleteProfile(name) {
  try {
    const userProperties = PropertiesService.getUserProperties();
    const profiles = JSON.parse(userProperties.getProperty('profiles') || '{}');
    if (profiles[name]) {
      delete profiles[name];
      userProperties.setProperty('profiles', JSON.stringify(profiles));
    } else {
      console.warn('削除対象のプロファイルが見つかりません:', name);
      // 削除対象がなくてもエラーとはしない
    }
  } catch (error) {
    console.error('プロファイルの削除に失敗しました:', error);
    throw new Error('プロファイルの削除に失敗しました: ' + error.message);
  }
}
