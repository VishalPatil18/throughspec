// Argv parsing for spec-init.
//
// Hand-rolled parser (no commander / yargs) - the surface is small enough
// that a ~50-line function is simpler than a dependency.

export const PERSONAS = ['vibe', 'student', 'engineer', 'team'] as const;
export type Persona = (typeof PERSONAS)[number];

export const INTEGRATIONS = ['graphify', 'obsidian', 'caveman', 'agentmemory', 'openwiki'] as const;
export type Integration = (typeof INTEGRATIONS)[number];

export const COMMANDS = ['init', 'customize', 'add-skill', 'upgrade', 'doctor'] as const;
export type Command = (typeof COMMANDS)[number];

export interface CliOptions {
  command: Command | null;
  positional: string[];
  persona: Persona | null;
  integrations: Integration[];
  addIntegration: Integration | null;
  removeIntegration: Integration | null;
  force: boolean;
  dryRun: boolean;
  help: boolean;
  version: boolean;
}

const EMPTY: CliOptions = {
  command: null,
  positional: [],
  persona: null,
  integrations: [],
  addIntegration: null,
  removeIntegration: null,
  force: false,
  dryRun: false,
  help: false,
  version: false,
};

/** Parse an argv slice into a typed CliOptions. Throws on unknown flags. */
export function parseArgs(argv: readonly string[]): CliOptions {
  const opts: CliOptions = { ...EMPTY, positional: [], integrations: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i] as string;
    if (token === '--help' || token === '-h') {
      opts.help = true;
    } else if (token === '--version' || token === '-v') {
      opts.version = true;
    } else if (token === '--force') {
      opts.force = true;
    } else if (token === '--dry-run') {
      opts.dryRun = true;
    } else if (token === '--persona') {
      opts.persona = takePersona(argv[++i], '--persona');
    } else if (token === '--integrations') {
      opts.integrations = takeIntegrationList(argv[++i], '--integrations');
    } else if (token === '--add') {
      opts.addIntegration = takeIntegration(argv[++i], '--add');
    } else if (token === '--remove') {
      opts.removeIntegration = takeIntegration(argv[++i], '--remove');
    } else if (token.startsWith('--')) {
      throw new UsageError(`unknown flag: ${token}`);
    } else if (opts.command === null) {
      opts.command = takeCommand(token);
    } else {
      opts.positional.push(token);
    }
  }
  return opts;
}

/** Thrown for user-facing usage errors. Main catches and prints the message. */
export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

function takeCommand(token: string): Command {
  if ((COMMANDS as readonly string[]).includes(token)) return token as Command;
  throw new UsageError(`unknown command: ${token} (try one of: ${COMMANDS.join(', ')})`);
}

function takePersona(value: string | undefined, flag: string): Persona {
  if (!value) throw new UsageError(`${flag} requires a value`);
  if (!(PERSONAS as readonly string[]).includes(value)) {
    throw new UsageError(`${flag}: unknown persona '${value}' (valid: ${PERSONAS.join(', ')})`);
  }
  return value as Persona;
}

function takeIntegration(value: string | undefined, flag: string): Integration {
  if (!value) throw new UsageError(`${flag} requires a value`);
  if (!(INTEGRATIONS as readonly string[]).includes(value)) {
    throw new UsageError(
      `${flag}: unknown integration '${value}' (valid: ${INTEGRATIONS.join(', ')})`,
    );
  }
  return value as Integration;
}

function takeIntegrationList(value: string | undefined, flag: string): Integration[] {
  if (!value) throw new UsageError(`${flag} requires a comma-separated list`);
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => takeIntegration(v, flag));
}

export const HELP_TEXT = `spec-init - scaffold a Throughspec project

USAGE
  spec-init <command> [flags]

COMMANDS
  init <name>         Scaffold a new project into <name>/
  customize           Toggle integrations or swap the persona for an existing project
  add-skill <name>    Copy a skill from the payload's skills/ catalog into the project
  upgrade             Merge a newer template payload into an existing project (three-way)
  doctor              Verify a scaffolded project's shape

FLAGS
  --persona <name>              vibe | student | engineer | team
  --integrations <a,b>          graphify,obsidian,caveman,agentmemory,openwiki (comma-separated, no spaces)
  --add <name>                  used with customize
  --remove <name>               used with customize
  --force                       overwrite existing files during init
  --dry-run                     print the plan; write nothing
  -h, --help                    show this text
  -v, --version                 print CLI version and exit

EXAMPLES
  spec-init init my-project --persona student
  spec-init init my-project --persona engineer --integrations graphify,obsidian
  spec-init init my-project --integrations caveman
  spec-init customize --add obsidian
  spec-init upgrade
  spec-init doctor
`;
