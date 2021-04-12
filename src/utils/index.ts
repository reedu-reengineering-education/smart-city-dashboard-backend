// https://stackoverflow.com/a/6021027/5660646
export const updateQueryStringParameter = (uri, key, value) => {
  var re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
  var separator = uri.indexOf('?') !== -1 ? '&' : '?';
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + '=' + value + '$2');
  } else {
    return uri + separator + key + '=' + value;
  }
};

export const isValidDate = (d: any) => {
  return d instanceof Date && !isNaN(d.valueOf());
};
