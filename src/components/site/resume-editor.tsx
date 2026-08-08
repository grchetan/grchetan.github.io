import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ChevronDown,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  resumeDefault,
  type ResumeData,
  type ResumeSection,
} from '@/data/resume';
import { fetchResume, saveResume } from '@/lib/resume';
import { downloadResumePdf, openResumePdf } from '@/lib/resume-pdf';
import { ResumePdfPreview } from '@/components/site/resume-preview';
import { cn } from '@/lib/utils';

const input = 'admin-field';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function IconBtn({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:border-chrome-1/60 hover:text-ink"
    >
      {children}
    </button>
  );
}

/** Admin panel tab: rename, edit, add and remove every part of the resume. */
export function ResumeManager() {
  const [data, setData] = useState<ResumeData>(resumeDefault);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setData(await fetchResume());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const patch = (p: Partial<ResumeData>) => setData((d) => ({ ...d, ...p }));

  const patchSection = (idx: number, p: Partial<ResumeSection>) =>
    setData((d) => ({
      ...d,
      sections: d.sections.map((s, i) => (i === idx ? { ...s, ...p } : s)),
    }));

  const moveSection = (idx: number, dir: -1 | 1) =>
    setData((d) => {
      const next = [...d.sections];
      const to = idx + dir;
      if (to < 0 || to >= next.length) return d;
      const [row] = next.splice(idx, 1);
      next.splice(to, 0, row!);
      return { ...d, sections: next };
    });

  async function save() {
    setBusy(true);
    try {
      await saveResume(data);
      toast.success('Resume saved — live on /resume.');
    } catch {
      toast.error(
        'Save failed — check Firestore rules for the “site” collection.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="label">Resume editor</span>
          <div className="flex flex-wrap gap-2">
            <IconBtn onClick={() => void load()} title="Reload from Firebase">
              <RefreshCw className="size-3" strokeWidth={1.5} /> Reload
            </IconBtn>
            <IconBtn
              onClick={() => void openResumePdf(data)}
              title="Open full PDF in new tab"
            >
              <Eye className="size-3" strokeWidth={1.5} /> View PDF
            </IconBtn>
            <IconBtn
              onClick={() => void downloadResumePdf(data)}
              title="Download PDF file"
            >
              <Download className="size-3" strokeWidth={1.5} /> Download PDF
            </IconBtn>
            <IconBtn
              onClick={() => setData(resumeDefault)}
              title="Reset to built-in copy"
            >
              Reset
            </IconBtn>
            <button
              onClick={() => void save()}
              disabled={busy}
              className="press-btn disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save resume'}
            </button>
          </div>
        </div>

        {loading ? <p className="caption">Loading…</p> : null}

        {/* header */}
        <div className="plate p-6">
          <span className="label">Header</span>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={data.name}
                onChange={(e) => patch({ name: e.target.value })}
                className={input}
              />
            </Field>
            <Field label="Role / title">
              <input
                value={data.role}
                onChange={(e) => patch({ role: e.target.value })}
                className={input}
              />
            </Field>
            <Field label="Email">
              <input
                value={data.email}
                onChange={(e) => patch({ email: e.target.value })}
                className={input}
              />
            </Field>
            <Field label="Location">
              <input
                value={data.location}
                onChange={(e) => patch({ location: e.target.value })}
                className={input}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Links (one per line)">
              <textarea
                rows={3}
                value={data.links.join('\n')}
                onChange={(e) =>
                  patch({
                    links: e.target.value
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean),
                  })
                }
                className={cn(input, 'resize-none font-mono text-[0.8rem]')}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Summary">
              <textarea
                rows={4}
                value={data.summary}
                onChange={(e) => patch({ summary: e.target.value })}
                className={cn(input, 'resize-none')}
              />
            </Field>
          </div>
        </div>

        {/* sections */}
        {data.sections.map((section, si) => {
          const isOpen = open === section.id;
          return (
            <div key={section.id} className="plate p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : section.id)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 transition-transform',
                      isOpen ? 'rotate-180' : '',
                    )}
                    strokeWidth={1.5}
                  />
                  <span className="truncate text-[1.15rem] text-ink">
                    {section.heading}
                  </span>
                  <span className="caption shrink-0">
                    {section.kind === 'groups'
                      ? `${section.groups?.length ?? 0} rows`
                      : `${section.items?.length ?? 0} entries`}
                  </span>
                </button>
                <div className="flex flex-wrap gap-2">
                  <IconBtn onClick={() => moveSection(si, -1)} title="Move up">
                    ↑
                  </IconBtn>
                  <IconBtn onClick={() => moveSection(si, 1)} title="Move down">
                    ↓
                  </IconBtn>
                  <IconBtn
                    onClick={() =>
                      patch({
                        sections: data.sections.filter((_, i) => i !== si),
                      })
                    }
                    title="Delete section"
                  >
                    <Trash2 className="size-3" strokeWidth={1.5} /> Delete
                  </IconBtn>
                </div>
              </div>

              {isOpen ? (
                <div className="mt-6 space-y-5 border-t border-ink/10 pt-6">
                  <Field label="Section heading (rename)">
                    <input
                      value={section.heading}
                      onChange={(e) =>
                        patchSection(si, { heading: e.target.value })
                      }
                      className={input}
                    />
                  </Field>

                  {section.kind === 'groups'
                    ? (section.groups ?? []).map((g, gi) => (
                        <div
                          key={gi}
                          className="grid gap-3 rounded-lg border border-ink/10 p-4 sm:grid-cols-[1fr_2fr_auto]"
                        >
                          <input
                            value={g.label}
                            placeholder="Label"
                            onChange={(e) =>
                              patchSection(si, {
                                groups: (section.groups ?? []).map((x, i) =>
                                  i === gi
                                    ? { ...x, label: e.target.value }
                                    : x,
                                ),
                              })
                            }
                            className={input}
                          />
                          <input
                            value={g.value}
                            placeholder="Value"
                            onChange={(e) =>
                              patchSection(si, {
                                groups: (section.groups ?? []).map((x, i) =>
                                  i === gi
                                    ? { ...x, value: e.target.value }
                                    : x,
                                ),
                              })
                            }
                            className={input}
                          />
                          <div className="flex items-end">
                            <IconBtn
                              onClick={() =>
                                patchSection(si, {
                                  groups: (section.groups ?? []).filter(
                                    (_, i) => i !== gi,
                                  ),
                                })
                              }
                              title="Remove row"
                            >
                              <Trash2 className="size-3" strokeWidth={1.5} />
                            </IconBtn>
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              value={g.link ?? ''}
                              placeholder="Verify / credential link (optional)"
                              onChange={(e) =>
                                patchSection(si, {
                                  groups: (section.groups ?? []).map((x, i) =>
                                    i === gi
                                      ? { ...x, link: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                              className={cn(input, 'font-mono text-[0.75rem]')}
                            />
                          </div>
                        </div>
                      ))
                    : (section.items ?? []).map((item, ii) => (
                        <div
                          key={ii}
                          className="space-y-3 rounded-lg border border-ink/10 p-4"
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Title">
                              <input
                                value={item.title}
                                onChange={(e) =>
                                  patchSection(si, {
                                    items: (section.items ?? []).map((x, i) =>
                                      i === ii
                                        ? { ...x, title: e.target.value }
                                        : x,
                                    ),
                                  })
                                }
                                className={input}
                              />
                            </Field>
                            <Field label="Subtitle / company / link text">
                              <input
                                value={item.subtitle ?? ''}
                                onChange={(e) =>
                                  patchSection(si, {
                                    items: (section.items ?? []).map((x, i) =>
                                      i === ii
                                        ? { ...x, subtitle: e.target.value }
                                        : x,
                                    ),
                                  })
                                }
                                className={input}
                              />
                            </Field>
                            <Field label="Dates / meta">
                              <input
                                value={item.meta ?? ''}
                                onChange={(e) =>
                                  patchSection(si, {
                                    items: (section.items ?? []).map((x, i) =>
                                      i === ii
                                        ? { ...x, meta: e.target.value }
                                        : x,
                                    ),
                                  })
                                }
                                className={input}
                              />
                            </Field>
                            <Field label="URL (optional)">
                              <input
                                value={item.link ?? ''}
                                onChange={(e) =>
                                  patchSection(si, {
                                    items: (section.items ?? []).map((x, i) =>
                                      i === ii
                                        ? { ...x, link: e.target.value }
                                        : x,
                                    ),
                                  })
                                }
                                className={input}
                              />
                            </Field>
                          </div>
                          <Field label="Bullet points (one per line)">
                            <textarea
                              rows={3}
                              value={item.bullets.join('\n')}
                              onChange={(e) =>
                                patchSection(si, {
                                  items: (section.items ?? []).map((x, i) =>
                                    i === ii
                                      ? {
                                          ...x,
                                          bullets: e.target.value.split('\n'),
                                        }
                                      : x,
                                  ),
                                })
                              }
                              className={cn(input, 'resize-none')}
                            />
                          </Field>
                          <IconBtn
                            onClick={() =>
                              patchSection(si, {
                                items: (section.items ?? []).filter(
                                  (_, i) => i !== ii,
                                ),
                              })
                            }
                            title="Remove entry"
                          >
                            <Trash2 className="size-3" strokeWidth={1.5} />{' '}
                            Remove entry
                          </IconBtn>
                        </div>
                      ))}

                  <IconBtn
                    onClick={() =>
                      section.kind === 'groups'
                        ? patchSection(si, {
                            groups: [
                              ...(section.groups ?? []),
                              { label: '', value: '' },
                            ],
                          })
                        : patchSection(si, {
                            items: [
                              ...(section.items ?? []),
                              {
                                title: '',
                                subtitle: '',
                                meta: '',
                                bullets: [],
                              },
                            ],
                          })
                    }
                    title="Add row"
                  >
                    <Plus className="size-3" strokeWidth={1.5} /> Add{' '}
                    {section.kind === 'groups' ? 'row' : 'entry'}
                  </IconBtn>
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2">
          {(['items', 'groups'] as const).map((kind) => (
            <IconBtn
              key={kind}
              onClick={() =>
                patch({
                  sections: [
                    ...data.sections,
                    {
                      id: `section-${Date.now()}-${kind}`,
                      heading: kind === 'items' ? 'New section' : 'New list',
                      kind,
                      ...(kind === 'items' ? { items: [] } : { groups: [] }),
                    },
                  ],
                })
              }
              title="Add section"
            >
              <Plus className="size-3" strokeWidth={1.5} /> Add{' '}
              {kind === 'items' ? 'timeline section' : 'label/value section'}
            </IconBtn>
          ))}
        </div>
      </div>

      <aside className="xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)]">
        <div className="h-[36rem] xl:h-full">
          <ResumePdfPreview data={data} />
        </div>
      </aside>
    </div>
  );
}
