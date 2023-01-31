import { program as commander } from 'commander';
import path from 'path';
import fs from 'fs';
import {compareVersions} from 'compare-versions';
import { getPackageInfo } from 'node-build-tools';
import ps from 'child_process';

type DependencyList = { [packageName: string]: string };
type PackageJson = { [field: string]: DependencyList };

const readPackageJson = (dir: string) => {
    const file = dir.endsWith('package.json')
        ? dir
        : path.join(dir, 'package.json');
    const json = fs.readFileSync(file, { encoding: 'utf8' });
    return JSON.parse(json);
};

const REGEX_SEMVER = /^\d+\.\d+\.\d+$/;

const NPM_INFO = 'npm view --json';



export const shell = (
    cmd: string | string[],
    cwd?: string,
    options?: ps.ExecSyncOptions,
  ): string[] => {
    const settings: ps.ExecSyncOptions = {
      cwd: cwd || process.cwd(),
      windowsHide: true,
      ...(options || {}),
    };
  
    const commands = Array.isArray(cmd) ? cmd : [cmd];
    const outputs: string[] = [];
    for (const command of commands) {
      console.log(`\n${command}`);
      const output = ps.execSync(command, settings);
      outputs.push(`${output || ''}`);
    }
  
    return outputs;
  };

const getNewPackageVersion = (
    packageName: string,
    currentVersion: string,
) => {
    const { log } = console;
    (console as any).log = () => { };
    const cwd = process.cwd();
    // const allVersions = shell(
    //     `${NPM_INFO} ${packageName} versions`,
    //     cwd,
        
    //   );

    //   console.log("allVersions",allVersions);
      
    const allVersions = getPackageInfo(packageName, ['versions'], undefined, {
        stdio: 'pipe',
    }) as string[];

    
    (console as any).log = log;
    const reversedVersions = allVersions
    .filter((v) => REGEX_SEMVER.test(v))
    .sort((a, b) => -compareVersions(a, b));
    const prefix = currentVersion.replace(/[^\d.]/g, '').split('.', 1)[0] + '.';
    
    console.log("reversedVersions",reversedVersions);
    
    const currentVersionNoPrefix = currentVersion.replace(/^\D+/g, '');
    for (const version of reversedVersions) {
        
        if (
            // version.startsWith(prefix) &&
            compareVersions(version, currentVersionNoPrefix) > 0
            ) {
                return `^${version}`;
            }
            // console.log("compareVersions(version, currentVersionNoPrefix)",version,compareVersions(version, currentVersionNoPrefix));
        }
        
        // console.log("prefix",prefix);
    return currentVersion;
};

const upgrade = (packageJson: PackageJson, packageJsonField: string) => {
    const packages = packageJson[packageJsonField];
    const entries = packages ? Object.entries(packages) : [];
    if (entries.length === 0) {
        console.log(`There isn't any "${packageJsonField}".\n`);
        return;
    }

    console.log(`Upgrading "${packageJsonField}"...`);
    
    for (const [name, version] of entries) {
        process.stdout.write(`\t${name}...`);
        packages[name] = getNewPackageVersion(name, version);
        // console.log(packages[name]);
        console.log("name",name);
        console.log("packages[name]",packages[name]);
        // console.log("version",version);
    }
    console.log('Done.');
};

const packageJsonFile = (commander as any).path || process.cwd();
const packageJson = readPackageJson(packageJsonFile) as PackageJson;

['peerDependencies', 'devDependencies', 'dependencies'].forEach((field) =>
    upgrade(packageJson, field),
);


const writePackageJson = (dir: string, data: object) => {
    const file = dir.endsWith('package.json')
      ? dir
      : path.join(dir, 'package.json');
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(file, json + '\n', { encoding: 'utf8' });
  };
writePackageJson(packageJsonFile, packageJson);