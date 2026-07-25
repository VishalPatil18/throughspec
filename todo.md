ToDo:

1. Open code review for throughspec for code review once a feature is build, works with spec-review skill which calls the code review api from "https://github.com/alibaba/open-code-review":

4. 
5. use this knowledge for research and try to include those in the skills and methodology in throughspec:
   """

Six weeks after you ship, something breaks in production.
Nobody remembers writing the code that broke it.

Half the debug session goes toward figuring out what the system was even supposed to do.

Missing constraints caused it.
The right ones prevent it.

Here are seven constraints that actually matter:

1. Treat specs as permanent and code as temporary.

↳ Your spec (APIs, schemas, data structures) is your real engineering output and not the code
↳ A solid spec means you can scrap all the generated code and rewrite it without losing any real progress

2. Replace vague prompts with requirements that define failure.

↳ Every requirement follows: starting conditions → the action → expected outcome
↳ This forces you to specify edge cases before anyone writes a single line

3. Separate your context into three tiers and never mix them.

↳ Workspace configs hold your non-negotiable rules: security baselines and strict typing
↳ `/specs` holds the blueprints your system reads from. Chat handles live orchestration only.

4. Require a proposal before any code gets generated.

↳ The system outputs the folder structure, data models, and how everything connects
↳ A human reviews and approves that plan. Then code generation begins.

5. Debug with evidence, not guesses.

↳ Sending "it's hanging" triggers sweeping, unpredictable changes. Send raw logs instead
↳ The system writes a failing unit test that pins down the exact bug before proposing any fix

6. Focus human review on architecture, not line counts.

↳ Every PR includes an AI-generated summary: what changed, what broke, where security risks appeared
↳ CI passes, security checks clear, linters clean → it merges automatically

7. One communication protocol for all your tools.

↳ A single standardized layer replaces the tangle of custom scripts per agent
↳ Every connection to databases and APIs runs zero-trust with no credentials hardcoded in prompts

Engineers who thrive with automated systems design the constraints that make the code predictable.

"""

7. use thisf or more inspiration and insights: "https://github.com/github/spec-kit"
8. check this out for skills: https://github.com/sickn33/agentic-awesome-skills/tree/main/skills
9. terminal ui for the application like claude that starts with spec-init command to setup the library in a project
10. for already existing projects, add a spec-reinit command that checks for existing spec files and prompts the user to either use them or create new ones.
11. a spec.config.js file in the users project that contains all the configuration for the throughspec library, including the skills to be used, the workflow to be followed, and any other relevant settings. This file should be easy to read and modify, allowing users to customize their experience with throughspec.
12. UI Updates:
    - changelog notes should me markdown styled, bold, code block, italics etc.
    - copy to clipboard button should show a "copy" tooltip on hover and change to "copied" on click for better UX. Remove the current "copied to clipboard" message that appears on click.
13. comments cleanup in this codebase, remove unnecessary comments and add meaningful comments where needed for better code readability and maintainability. Every comment should only be 1 liner and max 15 words long. Remove any commented-out code/dead code which is not commented and never being invoked.
14. Benchmarks in throughspec for research paper as well as for proving how this is better than normal claude or direct competitors of throughspec for Spec Driven Development.
