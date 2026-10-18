// Tên app hiển thị trên điện thoại có dấu tiếng Việt, còn "name" trong app.json để không dấu
// (GiaSuTieuHoc) vì máy chủ build iOS của EAS đoán sai tên project khi tên có dấu.
// Plugin này đặt lại tên hiển thị cho Android (app_name) và iOS (CFBundleDisplayName).
const { withInfoPlist, withStringsXml, AndroidConfig } = require('expo/config-plugins');

module.exports = function withDisplayName(config, { displayName }) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.CFBundleDisplayName = displayName;
    return cfg;
  });
  config = withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: 'app_name' }, _: displayName }],
      cfg.modResults,
    );
    return cfg;
  });
  return config;
};
