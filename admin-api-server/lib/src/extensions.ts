export function testFunction(input: any) {
  console.log(`called with: ${input}`);
}

export function assertt(nft: any, field: string, f: any): boolean {
  console.log('test..');
  console.log(`f(field), f=${JSON.stringify(f)}, field=${field}`);
  return f(nft[field]);
}
