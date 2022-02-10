require('dotenv').config()

import * as fs from 'fs';
import * as path from 'path';
import * as kleur from 'kleur';
import * as child from 'child_process';

import { loadFile } from './helper';
import { InMemorySigner } from '@taquito/signer';
import { MichelsonMap, TezosToolkit } from '@taquito/taquito';

export async function compileContract(): Promise<void> {

    await new Promise<void>((resolve, reject) =>
        // Compile the contract
        child.exec(
            path.join(__dirname, "../ligo/exec_ligo compile contract " + path.join(__dirname,  "../ligo/src/fa2_multi_asset.mligo") + " -e multi_asset_main "),
            (err, stdout) => {
                if (err) {
                    console.log(kleur.red('Failed to compile the contract.'));
                    console.log(kleur.yellow().dim(err.toString()))
                    reject();
                } else {
                    console.log(kleur.green('Contract compiled succesfully at:'))
                    // Write json contract into json file
                    console.log('  ' + path.join(__dirname, '../ligo/compiled/fa2_multi_asset.tz'))
                    fs.writeFileSync(path.join(__dirname, '../ligo/compiled/fa2_multi_asset.tz'), stdout)
                    resolve();
                }
            }
        )
    );
}

export async function deployContract(): Promise<void> {
    const code = await loadFile(path.join(__dirname, '../ligo/compiled/fa2_multi_asset.tz'))

    const originateParam = {
        code: code,
        storage: {
            admin : {
                admin : process.env.ADMIN_ADDRESS,
                paused : false
            },
            assets: {
                ledger: MichelsonMap.fromLiteral({}),
                operators: MichelsonMap.fromLiteral({}),
                token_metadata: MichelsonMap.fromLiteral({}),
                token_total_supply: MichelsonMap.fromLiteral({})
            },
            metadata: MichelsonMap.fromLiteral({
                "": ""
            }
        )}
    }

    try {
        const toolkit = new TezosToolkit(process.env.NODE_URL!);

        toolkit.setProvider({ signer: await InMemorySigner.fromSecretKey(process.env.ORIGINATOR_PRIVATE_KEY!) });

        const originationOp = await toolkit.contract.originate(originateParam);

        await originationOp.confirmation();
        const { address } = await originationOp.contract()

        console.log('Contract deployed at: ', address)

    } catch (error) {
        const jsonError = JSON.stringify(error);
        console.log(kleur.red(`Multi asset (tez) origination error ${jsonError}`));
    }
}


