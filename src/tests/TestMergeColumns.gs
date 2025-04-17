/**
 * CSVレイアウト変更ツール
 * 結合機能テストスクリプト
 */

/**
 * mergeColumns関数のテスト
 * 特に区切り文字としてスペースが正しく適用されることを確認します
 */
function testMergeColumnsWithSpaceDelimiter() {
  // テストデータの準備
  const testData = [
    ['姓', '名', '住所', '電話番号'],
    ['山田', '太郎', '東京都新宿区', '03-1234-5678'],
    ['佐藤', '花子', '大阪府大阪市', '06-8765-4321'],
    ['田中', '一郎', '北海道札幌市', '011-123-4567'],
    ['鈴木', '次郎', '愛知県名古屋市', '052-987-6543']
  ];
  
  // テスト1: スペース1つを区切り文字として使用
  const mergeSetting1 = "氏名:姓,名 ";  // 注: スペースが1つある
  const result1 = mergeColumns(testData, mergeSetting1);
  
  // 期待される結果
  const expected1 = [
    ['姓', '名', '住所', '電話番号', '氏名'],
    ['山田', '太郎', '東京都新宿区', '03-1234-5678', '山田 太郎'],
    ['佐藤', '花子', '大阪府大阪市', '06-8765-4321', '佐藤 花子'],
    ['田中', '一郎', '北海道札幌市', '011-123-4567', '田中 一郎'],
    ['鈴木', '次郎', '愛知県名古屋市', '052-987-6543', '鈴木 次郎']
  ];
  
  // 結果の検証
  console.log('テスト1: スペース1つを区切り文字として使用');
  verifyResults(result1, expected1);
  
  // テスト2: 複数のスペースを区切り文字として使用
  const mergeSetting2 = "氏名:姓,名    ";  // 注: スペースが複数ある
  const result2 = mergeColumns(testData, mergeSetting2);
  
  // 期待される結果 - スペース4つが区切り文字として機能するはず
  const expected2 = [
    ['姓', '名', '住所', '電話番号', '氏名'],
    ['山田', '太郎', '東京都新宿区', '03-1234-5678', '山田    太郎'],
    ['佐藤', '花子', '大阪府大阪市', '06-8765-4321', '佐藤    花子'],
    ['田中', '一郎', '北海道札幌市', '011-123-4567', '田中    一郎'],
    ['鈴木', '次郎', '愛知県名古屋市', '052-987-6543', '鈴木    次郎']
  ];
  
  // 結果の検証
  console.log('テスト2: 複数のスペースを区切り文字として使用');
  verifyResults(result2, expected2);
  
  // テスト3: 他の文字と組み合わせた区切り文字
  const mergeSetting3 = "氏名:姓,名 様";  // 注: "スペース+様" を区切り文字として使用
  const result3 = mergeColumns(testData, mergeSetting3);
  
  // 期待される結果
  const expected3 = [
    ['姓', '名', '住所', '電話番号', '氏名'],
    ['山田', '太郎', '東京都新宿区', '03-1234-5678', '山田 様太郎'],
    ['佐藤', '花子', '大阪府大阪市', '06-8765-4321', '佐藤 様花子'],
    ['田中', '一郎', '北海道札幌市', '011-123-4567', '田中 様一郎'],
    ['鈴木', '次郎', '愛知県名古屋市', '052-987-6543', '鈴木 様次郎']
  ];
  
  // 結果の検証
  console.log('テスト3: 他の文字と組み合わせた区切り文字');
  verifyResults(result3, expected3);
  
  // 結果をコンソールに出力する（問題の確認用）
  console.log('実際の区切り文字（テスト1）:', JSON.stringify(result1[1][4]));
  console.log('期待される区切り文字（テスト1）:', JSON.stringify(expected1[1][4]));
  console.log('区切り文字の長さ（実際）:', result1[1][4].length);
  console.log('区切り文字の長さ（期待）:', expected1[1][4].length);
  console.log('区切り文字のコード（実際）:', Array.from(result1[1][4]).map(c => c.charCodeAt(0)));
}

/**
 * 結果を検証するヘルパー関数
 * @param {Array} actual - 実際の結果
 * @param {Array} expected - 期待される結果
 */
function verifyResults(actual, expected) {
  // ヘッダーの検証
  if (JSON.stringify(actual[0]) !== JSON.stringify(expected[0])) {
    console.error('ヘッダーが一致しません');
    console.log('実際:', actual[0]);
    console.log('期待:', expected[0]);
    return false;
  }
  
  // データ行の検証
  let pass = true;
  for (let i = 1; i < expected.length; i++) {
    if (JSON.stringify(actual[i]) !== JSON.stringify(expected[i])) {
      console.error(`行 ${i} が一致しません`);
      console.log('実際:', actual[i]);
      console.log('期待:', expected[i]);
      pass = false;
    }
  }
  
  if (pass) {
    console.log('テスト成功！');
  }
  
  return pass;
}

/**
 * 全テストを実行
 */
function runMergeTests() {
  testMergeColumnsWithSpaceDelimiter();
} 