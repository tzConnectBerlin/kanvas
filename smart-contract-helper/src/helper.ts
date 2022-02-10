import * as fs from 'fs';

export async function loadFile(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (!fs.existsSync(filePath)) reject(`file ${filePath} does not exist`);
      else
        fs.readFile(filePath, (err, buff) =>
          err ? reject(err) : resolve(buff.toString())
        );
    });
 } 