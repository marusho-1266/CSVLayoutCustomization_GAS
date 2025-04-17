/**
 * CSVレイアウト変更ツール
 * テスト実行スクリプト
 */

/**
 * 全テストを実行する
 */
function runAllTests() {
  console.log('=== テスト実行開始 ===');
  
  // reorderColumns テスト
  try {
    console.log('\n--- reorderColumns テスト ---');
    testReorderColumnsWithEmptyColumns();
  } catch (error) {
    console.error('reorderColumns テストでエラーが発生しました:', error);
  }
  
  // mergeColumns テスト
  try {
    console.log('\n--- mergeColumns テスト ---');
    testMergeColumnsWithSpaceDelimiter();
  } catch (error) {
    console.error('mergeColumns テストでエラーが発生しました:', error);
  }
  
  console.log('\n=== テスト実行完了 ===');
} 