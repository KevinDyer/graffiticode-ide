exports.buildGetLangAsset = ({ getBuffer }) => {
  return async function getLangAsset(lang, path, resume) {
    const isFn = (typeof resume === 'function');
    try {
      const data = await getBuffer(`/${lang}/${path}`);
      if (isFn) {
        resume(null, data);
      }
      return data;
    } catch(err) {
      if (isFn) {
        resume(err, null);
      } else {
        throw err;
      }
    }
  };
};
