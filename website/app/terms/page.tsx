import Link from 'next/link';

export const metadata = { title: 'Terms' };

const SECTIONS = [
  {
    id: 'license',
    title: '1. License',
    paras: [
      'Throughspec is licensed under the MIT License. You may use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, subject to including the copyright and permission notice.',
      'The full license text is included in the package and in the repository’s LICENSE file, which governs in case of any conflict with this summary.',
    ],
  },
  {
    id: 'use',
    title: '2. Acceptable use',
    paras: [
      'You are responsible for the code the Kit helps you produce and for complying with the terms of any AI provider, package registry, or integration you use alongside it.',
      'You may not use the software to violate applicable law or the rights of others.',
    ],
  },
  {
    id: 'thirdparty',
    title: '3. Third-party services',
    paras: [
      'Throughspec composes on top of Claude Code and may reference optional integrations such as Graphify and Obsidian. Your use of those services is governed by their own terms, not ours.',
      'We do not host, run, or warrant any third-party service.',
    ],
  },
  {
    id: 'warranty',
    title: '4. No warranty',
    paras: [
      'The software is provided "as is", without warranty of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.',
      'You assume all risk arising from use of the software, including any code it generates or scaffolds.',
    ],
  },
  {
    id: 'liability',
    title: '5. Limitation of liability',
    paras: [
      'In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from or in connection with the software or its use.',
    ],
  },
  {
    id: 'changes',
    title: '6. Changes to these terms',
    paras: [
      'We may update these terms as the project evolves. Material changes will be reflected in the repository and dated at the top of this page. Continued use after an update constitutes acceptance.',
    ],
  },
  {
    id: 'contact',
    title: '7. Contact',
    paras: [
      'Questions, security reports, or license inquiries can be directed to the maintainers through the repository’s SECURITY.md and CONTRIBUTING.md files.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="bg-warm font-serif text-ink">
      <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-12 px-8 pb-20 pt-16 md:grid-cols-[240px_1fr]">
        <aside className="sticky top-6 self-start">
          <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.06em] text-dim">Contents</div>
          <div className="flex flex-col gap-[11px]">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="border-l border-black/15 pl-3 text-[13px] leading-[1.4] tracking-tighter2 text-muted no-underline"
              >
                {s.title}
              </a>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 text-xs uppercase tracking-[0.06em] text-dim">Legal</div>
          <h1 className="mb-3 text-[46px] font-normal leading-[1.08] tracking-tighter2">Terms of Service</h1>
          <p className="mb-[14px] text-[13px] text-dim">Last updated 12 June 2026</p>
          <div className="mb-10 max-w-[640px] rounded-2xl bg-cloud px-[22px] py-5">
            <p className="text-sm leading-[1.6] tracking-tighter2 text-[#3d3d3d]">
              Throughspec is free, open-source software distributed under the MIT License. By installing or using it,
              you agree to these terms and to the MIT License text shipped with the package.
            </p>
          </div>

          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="mb-9 scroll-mt-6">
              <h2 className="mb-[14px] text-[25px] font-normal tracking-tighter2">{s.title}</h2>
              {s.paras.map((p, i) => (
                <p
                  key={i}
                  className="mb-[14px] max-w-[660px] text-[14.5px] leading-[1.7] tracking-tighter2 text-[#3d3d3d]"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}

          <div className="mt-2 border-t border-black/10 pt-6">
            <p className="text-[13.5px] leading-[1.6] tracking-tighter2 text-muted">
              See also our <Link href="/privacy/" className="text-ink underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
