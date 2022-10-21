export const isValidEmail = (email?: string) =>
  (email ?? '')
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    )
    ? true
    : false;

export const removeNullObjKeys = (obj: Record<any, any>) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === null) {
      delete obj[key];
    }
  });

  return obj;
};

export function clone(src: Array<any>) {
  return JSON.parse(JSON.stringify(src));
}
