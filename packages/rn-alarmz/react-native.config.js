module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        packageImportPath: 'import com.rnalarmz.RnAlarmzPackage;',
        packageInstance: 'new RnAlarmzPackage()',
      },
    },
  },
};
