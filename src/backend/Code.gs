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
    const content = file.getBlob().getDataAsString();
    return Utilities.parseCsv(content);
  } catch (error) {
    console.error('CSVファイルの読み込みに失敗しました:', error);
    throw new Error('CSVファイルの読み込みに失敗しました');
  }
}

/**
 * 変換結果を保存する
 * @param {Array} data - 保存するデータ
 * @param {string} fileName - 保存するファイル名
 * @param {string} format - 保存形式（'csv'または'sheets'）
 * @param {string} folderId - 保存先フォルダID
 * @return {string} 保存したファイルのID
 */
function saveResultToDrive(data, fileName, format, folderId) {
  try {
    const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    let file;
    
    if (format === 'csv') {
      const csvContent = data.map(row => row.join(',')).join('\n');
      const blob = Utilities.newBlob(csvContent, 'text/csv', fileName);
      file = folder.createFile(blob);
    } else if (format === 'sheets') {
      const ss = SpreadsheetApp.create(fileName);
      const sheet = ss.getActiveSheet();
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
      file = DriveApp.getFileById(ss.getId());
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    }
    
    return file.getId();
  } catch (error) {
    console.error('ファイルの保存に失敗しました:', error);
    throw new Error('ファイルの保存に失敗しました');
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
    throw new Error('プロファイルの保存に失敗しました');
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
    throw new Error('プロファイルの取得に失敗しました');
  }
} 