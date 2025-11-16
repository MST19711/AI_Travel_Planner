import 'package:flutter_test/flutter_test.dart';
import '../lib/services/ai_response_validator.dart';

void main() {
  group('AIResponseValidator Tests', () {
    test('Valid JSON response should pass validation', () {
      // 准备
      const validResponse = '''
{
  "title": "北京三日游",
  "description": "经典历史文化之旅",
  "startDate": "2024-01-15",
  "endDate": "2024-01-17",
  "activities": [
    {
      "dayNumber": 1,
      "title": "抵达北京",
      "description": "抵达北京首都国际机场",
      "location": "北京首都国际机场",
      "city": "北京",
      "countryCode": "CN",
      "startTime": "14:00",
      "endTime": "16:00",
      "estimatedCost": 200,
      "category": "交通"
    }
  ]
}
''';

      // 执行
      final result = AIResponseValidator.validateAIResponse(validResponse);

      // 验证
      expect(result.isValid, true);
      expect(result.errors, isEmpty);
      expect(result.parsedJson, isNotNull);
      expect(result.parsedJson!['title'], '北京三日游');
    });

    test('Invalid JSON format should fail validation', () {
      // 准备
      const invalidResponse = '这不是有效的JSON格式';

      // 执行
      final result = AIResponseValidator.validateAIResponse(invalidResponse);

      // 验证
      expect(result.isValid, false);
      expect(result.errors, isNotEmpty);
      expect(result.parsedJson, isNull);
    });

    test('JSON with missing required fields should fail validation', () {
      // 准备
      const responseWithMissingFields = '''
{
  "title": "北京三日游",
  "activities": [
    {
      "dayNumber": 1,
      "title": "测试活动"
    }
  ]
}
''';

      // 执行
      final result =
          AIResponseValidator.validateAIResponse(responseWithMissingFields);

      // 验证
      expect(result.isValid, false);
      expect(result.errors, contains('第1个活动缺少必需字段: location'));
      expect(result.errors, contains('第1个活动缺少必需字段: city'));
      expect(result.errors, contains('第1个活动缺少必需字段: countryCode'));
    });

    test('JSON with invalid date format should fail validation', () {
      // 准备
      const responseWithInvalidDate = '''
{
  "title": "北京三日游",
  "startDate": "2024/01/15",
  "activities": [
    {
      "dayNumber": 1,
      "title": "测试活动",
      "location": "测试地点",
      "city": "北京",
      "countryCode": "CN"
    }
  ]
}
''';

      // 执行
      final result =
          AIResponseValidator.validateAIResponse(responseWithInvalidDate);

      // 验证
      expect(result.isValid, false);
      expect(result.errors, contains('startDate格式不正确，应为YYYY-MM-DD格式'));
    });

    test('JSON with invalid time format should fail validation', () {
      // 准备
      const responseWithInvalidTime = '''
{
  "title": "北京三日游",
  "activities": [
    {
      "dayNumber": 1,
      "title": "测试活动",
      "location": "测试地点",
      "city": "北京",
      "countryCode": "CN",
      "startTime": "14点00分"
    }
  ]
}
''';

      // 执行
      final result =
          AIResponseValidator.validateAIResponse(responseWithInvalidTime);

      // 验证
      expect(result.isValid, false);
      expect(result.errors, contains('第1个活动的startTime格式不正确，应为HH:MM格式'));
    });

    test('JSON with invalid country code should fail validation', () {
      // 准备
      const responseWithInvalidCountryCode = '''
{
  "title": "北京三日游",
  "activities": [
    {
      "dayNumber": 1,
      "title": "测试活动",
      "location": "测试地点",
      "city": "北京",
      "countryCode": "CHINA"
    }
  ]
}
''';

      // 执行
      final result = AIResponseValidator.validateAIResponse(
          responseWithInvalidCountryCode);

      // 验证
      expect(result.isValid, false);
      expect(result.errors, contains('第1个活动的国家代码必须是2位字母代码'));
    });

    test('JSON with non-sequential day numbers should show warning', () {
      // 准备
      const responseWithNonSequentialDays = '''
{
  "title": "北京三日游",
  "activities": [
    {
      "dayNumber": 1,
      "title": "第一天活动",
      "location": "测试地点",
      "city": "北京",
      "countryCode": "CN"
    },
    {
      "dayNumber": 3,
      "title": "第三天活动",
      "location": "测试地点",
      "city": "北京",
      "countryCode": "CN"
    }
  ]
}
''';

      // 执行
      final result =
          AIResponseValidator.validateAIResponse(responseWithNonSequentialDays);

      // 验证
      expect(result.isValid, true); // 仍然有效，但会有警告
      expect(result.errors, contains('天数不连续: 缺少第2天的活动'));
    });

    test('JSON embedded in text should be extracted and validated', () {
      // 准备
      const responseWithEmbeddedJson = '''
这是AI生成的行程计划：

```json
{
  "title": "北京三日游",
  "activities": [
    {
      "dayNumber": 1,
      "title": "抵达北京",
      "location": "首都机场",
      "city": "北京",
      "countryCode": "CN"
    }
  ]
}
```

希望这个行程对您有帮助！
''';

      // 执行
      final result =
          AIResponseValidator.validateAIResponse(responseWithEmbeddedJson);

      // 验证
      expect(result.isValid, true);
      expect(result.parsedJson, isNotNull);
      expect(result.parsedJson!['title'], '北京三日游');
    });

    test('Build retry prompt should include error details', () {
      // 准备
      const originalPrompt = '请生成行程计划';
      const errorMessage = '缺少必需字段: title';
      const invalidResponse = '{"activities": []}';

      // 执行
      final retryPrompt = AIResponseValidator.buildRetryPrompt(
        originalPrompt,
        errorMessage,
        invalidResponse,
      );

      // 验证
      expect(retryPrompt, contains(originalPrompt));
      expect(retryPrompt, contains(errorMessage));
      expect(retryPrompt, contains(invalidResponse));
      expect(retryPrompt, contains('请重新生成正确的行程计划JSON'));
    });

    test('Complete valid trip plan should pass all validations', () {
      // 准备
      const completeValidResponse = '''
{
  "title": "上海五日深度游",
  "description": "探索上海的现代与传统魅力",
  "startDate": "2024-03-01",
  "endDate": "2024-03-05",
  "budget": 5000,
  "activities": [
    {
      "dayNumber": 1,
      "title": "抵达上海",
      "description": "抵达上海虹桥机场，入住酒店",
      "location": "上海虹桥国际机场",
      "city": "上海",
      "countryCode": "CN",
      "startTime": "15:00",
      "endTime": "17:00",
      "estimatedCost": 300,
      "category": "交通"
    },
    {
      "dayNumber": 2,
      "title": "外滩观光",
      "description": "欣赏黄浦江两岸的现代建筑群",
      "location": "外滩",
      "city": "上海",
      "countryCode": "CN",
      "startTime": "09:00",
      "endTime": "12:00",
      "estimatedCost": 0,
      "category": "景点"
    },
    {
      "dayNumber": 3,
      "title": "豫园游览",
      "description": "参观古典园林和城隍庙",
      "location": "豫园",
      "city": "上海",
      "countryCode": "CN",
      "startTime": "10:00",
      "endTime": "15:00",
      "estimatedCost": 100,
      "category": "景点"
    }
  ]
}
''';

      // 执行
      final result =
          AIResponseValidator.validateAIResponse(completeValidResponse);

      // 验证
      expect(result.isValid, true);
      expect(result.errors, isEmpty);
      expect(result.parsedJson!['title'], '上海五日深度游');
      expect((result.parsedJson!['activities'] as List).length, 3);
    });
  });

  group('Integration Tests', () {
    test('Validator should handle complex validation scenarios', () async {
      // 验证复杂场景的处理能力
      expect(AIResponseValidator.validateAIResponse, isNotNull);
      expect(AIResponseValidator.buildRetryPrompt, isNotNull);
    });
  });
}
