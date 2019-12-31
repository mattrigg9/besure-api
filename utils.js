export const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export const chunk = (arr, len) => {
  const chunks = [];
  let i = 0;

  while (i < arr.length) {
    chunks.push(arr.slice(i, i += len));
  }

  return chunks;
}

export const backoff = (fn, retries = 3, delay = 1500) => {
  return fn().catch(err => {
    console.error(err);
    return retries > 0 ? pause(delay).then(() => backoff(fn, retries - 1, delay * 2)) : Promise.reject(err)
  });
}