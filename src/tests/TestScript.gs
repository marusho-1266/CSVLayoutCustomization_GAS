/**
 * CSVレイアウト変更ツール
 * テストスクリプト
 */

/**
 * テストの実行
 */
function runTests() {
  console.log('テストを開始します...');
  
  // 各テストの実行
  testReadCsvFromDrive();
  testProcessData();
  testSaveProfile();
  testGetProfiles();
  
  console.log('テストが完了しました');
}

/**
 * CSVファイル読み込みのテスト
 */
function testReadCsvFromDrive() {
  console.log('CSVファイル読み込みのテストを開始します');
  
  try {
    // テスト用のファイルIDを指定
    const fileId = 'YOUR_TEST_FILE_ID';
    const data = readCsvFromDrive(fileId);
    
    // テスト結果の検証
    if (data && data.length > 0) {
      console.log('✅ CSVファイル読み込みテスト: 成功');
      console.log('読み込んだデータ:', data);
    } else {
      console.log('❌ CSVファイル読み込みテスト: 失敗 - データが空です');
    }
  } catch (error) {
    console.log('❌ CSVファイル読み込みテスト: 失敗 - ' + error.message);
  }
}

/**
 * データ変換処理のテスト
 */
function testProcessData() {
  console.log('データ変換処理のテストを開始します');
  
  try {
    // テストデータ
    const testData = [
      ['名前', '住所', '電話番号'],
      ['山田太郎', '東京都新宿区', '03-1234-5678']
    ];
    
    // テスト設定
    const settings = {
      reorder: '住所,名前,電話番号',
      remove: '住所:東京都',
      add: '電話番号:前:Tel:'
    };
    
    const result = processData(testData, settings);
    
    // テスト結果の検証
    if (result && result.length > 0) {
      console.log('✅ データ変換処理テスト: 成功');
      console.log('変換後のデータ:', result);
    } else {
      console.log('❌ データ変換処理テスト: 失敗 - 結果が空です');
    }
  } catch (error) {
    console.log('❌ データ変換処理テスト: 失敗 - ' + error.message);
  }
}

/**
 * プロファイル保存のテスト
 */
function testSaveProfile() {
  console.log('プロファイル保存のテストを開始します');
  
  try {
    const name = 'テストプロファイル';
    const settings = {
      reorder: '住所,名前,電話番号',
      remove: '住所:東京都',
      add: '電話番号:前:Tel:'
    };
    
    saveProfile(name, settings);
    console.log('✅ プロファイル保存テスト: 成功');
  } catch (error) {
    console.log('❌ プロファイル保存テスト: 失敗 - ' + error.message);
  }
}

/**
 * プロファイル取得のテスト
 */
function testGetProfiles() {
  console.log('プロファイル取得のテストを開始します');
  
  try {
    const profiles = getProfiles();
    
    if (profiles) {
      console.log('✅ プロファイル取得テスト: 成功');
      console.log('取得したプロファイル:', profiles);
    } else {
      console.log('❌ プロファイル取得テスト: 失敗 - プロファイルが取得できませんでした');
    }
  } catch (error) {
    console.log('❌ プロファイル取得テスト: 失敗 - ' + error.message);
  }
} 