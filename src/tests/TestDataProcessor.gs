/**
 * CSVレイアウト変更ツール
 * データ変換処理テストスクリプト
 */

/**
 * reorderColumns関数のテスト
 * 連続したカンマ（,,）で空の列が正しく挿入されることを確認します
 */
function testReorderColumnsWithEmptyColumns() {
  // テストデータの準備
  const testData = [
    ['名前', '年齢', '住所', '電話番号'],
    ['山田太郎', '30', '東京都新宿区', '03-1234-5678'],
    ['佐藤花子', '25', '大阪府大阪市', '06-8765-4321'],
    ['田中一郎', '45', '北海道札幌市', '011-123-4567'],
    ['鈴木次郎', '35', '愛知県名古屋市', '052-987-6543']
  ];
  
  // テスト1: 連続したカンマで空の列を挿入
  const orderWithEmptyColumns = '名前,,住所,,電話番号';
  const result1 = reorderColumns(testData, orderWithEmptyColumns);
  
  // 期待される結果
  const expected1 = [
    ['名前', '', '住所', '', '電話番号'],
    ['山田太郎', '', '東京都新宿区', '', '03-1234-5678'],
    ['佐藤花子', '', '大阪府大阪市', '', '06-8765-4321'],
    ['田中一郎', '', '北海道札幌市', '', '011-123-4567'],
    ['鈴木次郎', '', '愛知県名古屋市', '', '052-987-6543']
  ];
  
  // 結果の検証
  console.log('テスト1: 連続したカンマで空の列を挿入');
  verifyResults(result1, expected1);
  
  // テスト2: 先頭と末尾に空の列を挿入
  const orderWithEmptyAtEnds = ',名前,住所,電話番号,';
  const result2 = reorderColumns(testData, orderWithEmptyAtEnds);
  
  // 期待される結果
  const expected2 = [
    ['', '名前', '住所', '電話番号', ''],
    ['', '山田太郎', '東京都新宿区', '03-1234-5678', ''],
    ['', '佐藤花子', '大阪府大阪市', '06-8765-4321', ''],
    ['', '田中一郎', '北海道札幌市', '011-123-4567', ''],
    ['', '鈴木次郎', '愛知県名古屋市', '052-987-6543', '']
  ];
  
  // 結果の検証
  console.log('テスト2: 先頭と末尾に空の列を挿入');
  verifyResults(result2, expected2);
  
  // テスト3: 複数の連続したカンマ
  const orderWithMultipleEmptyColumns = '名前,,,住所,電話番号';
  const result3 = reorderColumns(testData, orderWithMultipleEmptyColumns);
  
  // 期待される結果
  const expected3 = [
    ['名前', '', '', '住所', '電話番号'],
    ['山田太郎', '', '', '東京都新宿区', '03-1234-5678'],
    ['佐藤花子', '', '', '大阪府大阪市', '06-8765-4321'],
    ['田中一郎', '', '', '北海道札幌市', '011-123-4567'],
    ['鈴木次郎', '', '', '愛知県名古屋市', '052-987-6543']
  ];
  
  // 結果の検証
  console.log('テスト3: 複数の連続したカンマ');
  verifyResults(result3, expected3);
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
function runAllTests() {
  testReorderColumnsWithEmptyColumns();
} 