export function isBottom(v: any): boolean {
  // note: v here is checked for Javascripts' bottom values (null and undefined)
  //       because undefined coerces into null. It's safe because nothing
  //       else coerces into null (other than null itself).
  return v == null;
}

export function maybe<T, Res>(f: (x: T) => Res, x: T | undefined): Res | undefined {
  if (isBottom(x)) {
    return undefined;
  }

  return f(x!);
};
