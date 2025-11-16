import 'package:flutter_test/flutter_test.dart';
import 'package:ai_travel_planner/utils/crypto_utils.dart';

void main() {
  group('CryptoUtils 加密解密测试', () {
    test('密码hash生成测试', () {
      final password = 'test123';
      final hash = CryptoUtils.generatePasswordHash(password);

      expect(hash.isNotEmpty, true);
      print('密码: $password');
      print('Hash: $hash');
    });

    test('加密解密往返测试', () {
      final password = 'test123';
      final testData = 'sk-test-api-key-12345';

      final passwordHash = CryptoUtils.generatePasswordHash(password);
      final encrypted = CryptoUtils.encryptData(testData, passwordHash);
      final decrypted = CryptoUtils.decryptData(encrypted, passwordHash);

      print('\n测试数据: $testData');
      print('加密结果: ${encrypted.substring(0, 30)}...');
      print('解密结果: $decrypted');

      expect(encrypted.isNotEmpty, true);
      expect(decrypted, testData);
    });

    test('空字符串处理测试', () {
      final password = 'test123';
      final passwordHash = CryptoUtils.generatePasswordHash(password);

      final encrypted = CryptoUtils.encryptData('', passwordHash);
      final decrypted = CryptoUtils.decryptData('', passwordHash);

      expect(encrypted, '');
      expect(decrypted, '');
    });

    test('多个API密钥加密解密测试', () {
      final password = 'test123';
      final passwordHash = CryptoUtils.generatePasswordHash(password);

      final apiKeys = {
        'openaiApiKey': 'sk-openai-test-key',
        'amapApiKey': 'amap-test-key',
        'glmApiKey': 'glm-test-key',
      };

      final encryptedKeys = CryptoUtils.encryptApiKeys(apiKeys, passwordHash);
      final decryptedKeys =
          CryptoUtils.decryptApiKeys(encryptedKeys, passwordHash);

      print('\n原始API密钥:');
      apiKeys.forEach((key, value) => print('  $key: $value'));

      print('\n加密后的API密钥:');
      encryptedKeys.forEach((key, value) => print(
          '  $key: ${value.isNotEmpty ? value.substring(0, 20) + '...' : '空'}'));

      print('\n解密后的API密钥:');
      decryptedKeys.forEach((key, value) => print('  $key: $value'));

      expect(decryptedKeys['openaiApiKey'], apiKeys['openaiApiKey']);
      expect(decryptedKeys['amapApiKey'], apiKeys['amapApiKey']);
      expect(decryptedKeys['glmApiKey'], apiKeys['glmApiKey']);
    });

    test('错误密码解密测试', () {
      final correctPassword = 'correct123';
      final wrongPassword = 'wrong123';
      final testData = 'sk-test-api-key';

      final correctHash = CryptoUtils.generatePasswordHash(correctPassword);
      final wrongHash = CryptoUtils.generatePasswordHash(wrongPassword);

      final encrypted = CryptoUtils.encryptData(testData, correctHash);
      final decrypted = CryptoUtils.decryptData(encrypted, wrongHash);

      print('\n使用错误密码解密:');
      print('原始数据: $testData');
      print('解密结果: $decrypted');

      // 使用错误密码应该解密失败（返回空字符串）
      expect(decrypted, '');
    });
  });
}
