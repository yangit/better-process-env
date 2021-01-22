import fp from 'lodash/fp';
import fs from 'fs';

const textToHash = (fileString: string): Record<string, ConfigVariable> =>
    fp.flow([
        fp.map((string: string): string => string.trim()),
        fp.map((string: string): string => string.split('#')[0]),
        fp.filter((string: string): boolean => string.includes('=')),
        fp.map((string: string): { key: string; value: ConfigVariable } => {
            const [key, value] = string.split('=');

            return { key, value };
        }),
        fp.reduce((sum, { key, value }) => {
            return { ...sum, [key]: value };
        }, {}),
    ])(fileString.split('\n'));

const example = textToHash(fs.readFileSync('.env.example').toString('utf8'));

type ConfigVariable = string | number | null | {} | any;

const transform = (value: string): ConfigVariable => {
    let parsedValue;

    try {
        parsedValue = JSON.parse(value);
    } catch (e) {
        if (typeof value === 'string' && /^true|false$/i.test(value)) {
            parsedValue = Boolean(value);
        } else {
            parsedValue = value;
        }
    }

    return parsedValue;
};
const mergedEnv = {
    // ...textToHash(fs.readFileSync('.env').toString('utf8')),
    ...process.env,
};

const transformed = fp.flow([fp.mapValues(transform), fp.pick(Object.keys(example))])(mergedEnv);

if (!process.env.SKIP_CONFIG_CHECK) {
    const presentInExampleButNotEnv = Object.keys(example)
        .map((key: string): string | boolean => {
            if (typeof transformed[key] === 'undefined') {
                return key;
            }
            return false;
        })
        .filter(<T>(value: T): T => value);

    const presentInEnvButNotExample = Object.keys(transformed)
        .map((key: string): string | boolean => {
            if (typeof example[key] === 'undefined') {
                return key;
            }
            return false;
        })
        .filter(<T>(value: T): T => value);
    if (presentInExampleButNotEnv.length > 0) {
        throw new Error(
            `Some variable defined in .env.example but not on process.env or vice versa\n${JSON.stringify({
                presentInEnvButNotExample,
                presentInExampleButNotEnv,
            })}`,
        );
    }
}

export default {
    get: (path: string): ConfigVariable => {
        if (typeof transformed[path] === 'undefined') {
            throw new Error(`'${path}' variable not defined in ENV`);
        }

        return transformed[path];
    },

    getObject: (): Record<string, any> => transformed,
};
