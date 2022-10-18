const { override } = require('customize-cra');
const path = require('path');

const overridePath = (webpackConfig) => {
  const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
  if (oneOfRule) {
    const newIncludePaths = [
      path.resolve(__dirname, '../dds'),
      path.resolve(__dirname, '../dds/src'),
    ];

    const tsxRule = oneOfRule.oneOf.find(
      (rule) => rule.test && rule.test.toString().includes('tsx')
    );

    if (tsxRule) {
      if (Array.isArray(tsxRule.include)) {
        tsxRule.include = [...tsxRule.include, ...newIncludePaths];
      } else {
        tsxRule.include = [tsxRule.include, ...newIncludePaths];
      }
    }
  }
  return webpackConfig;
};

module.exports = override(overridePath);