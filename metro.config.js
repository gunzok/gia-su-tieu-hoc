// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bản ESM (.mjs) của @anthropic-ai/sdk có các module import vòng tròn
// (BetaToolRunner <-> beta/messages) mà Metro nạp sai, làm app sập lúc khởi động.
// Bản CommonJS của SDK không bị lỗi này nên ép Metro dùng bản đó.
const anthropicSdkCjs = require.resolve('@anthropic-ai/sdk');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@anthropic-ai/sdk') {
    return { type: 'sourceFile', filePath: anthropicSdkCjs };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
