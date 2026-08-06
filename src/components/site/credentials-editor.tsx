import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import {
  credentialsDefault,
  fetchCredentials,
  saveCredentials,
  type Achievement,
  type Certificate,
  type Credentials,
  type Profile,
} from "@/lib/credentials";
import { uploadImage } from "@/lib/firebase";
import { cn } from "@/lib/utils";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function Chip({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:border-chrome-1/60 hover:text-ink"
    >
      {children}
    </button>
  );
}

/** Image picker that uploads to Firebase Storage and stores the URL. */
function ImagePicker({
  value,
  onChange,
  label = "Certificate image",
}: {
  value?: string | undefined;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function pick(file: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file, "certificates"));
      toast.success("Image uploaded.");
    } catch {
      toast.error("Upload failed — check Storage rules.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink/12 bg-paper-tint">
        {value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-5 text-ink/30" strokeWidth={1.5} />
        )}
      </div>
      <div className="min-w-[12rem] flex-1">
        <span className="label">{label}</span>
        <p className="mt-1 text-[0.78rem] leading-snug text-ink-soft">
          Choose the file from your computer — it uploads to Firebase Storage automatically.
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => void pick(e.target.files?.[0] ?? null)}
          className="admin-field py-1.5 text-[0.8rem]"
        />
        {busy ? <p className="caption mt-2">Uploading…</p> : null}
        {value && !busy ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="caption mt-2 underline underline-offset-4"
          >
            Remove image
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Admin tab: certificates (with images + verify links), achievements and coding profile IDs. */
export function CredentialsManager() {
  const [data, setData] = useState<Credentials>(credentialsDefault);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"certificates" | "achievements" | "profiles">("certificates");

  const load = useCallback(async () => {
    setLoading(true);
    setData(await fetchCredentials());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchCert = (i: number, p: Partial<Certificate>) =>
    setData((d) => ({ ...d, certificates: d.certificates.map((c, x) => (x === i ? { ...c, ...p } : c)) }));
  const patchAch = (i: number, p: Partial<Achievement>) =>
    setData((d) => ({ ...d, achievements: d.achievements.map((c, x) => (x === i ? { ...c, ...p } : c)) }));
  const patchProfile = (i: number, p: Partial<Profile>) =>
    setData((d) => ({ ...d, profiles: d.profiles.map((c, x) => (x === i ? { ...c, ...p } : c)) }));

  async function save() {
    setBusy(true);
    try {
      await saveCredentials(data);
      toast.success("Credentials saved — live on /certificates.");
    } catch {
      toast.error("Save failed — check Firestore rules for “site”.");
    } finally {
      setBusy(false);
    }
  }

  const views = [
    { id: "certificates" as const, label: `Certificates (${data.certificates.length})` },
    { id: "achievements" as const, label: `Achievements (${data.achievements.length})` },
    { id: "profiles" as const, label: `Profile IDs (${data.profiles.length})` },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                "rounded-full border px-4 py-2 font-mono text-[0.64rem] uppercase tracking-[0.16em] transition-colors",
                view === v.id
                  ? "border-chrome-1/60 bg-chrome-1/12 text-ink"
                  : "border-ink/12 bg-paper text-ink-soft hover:text-ink",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip onClick={() => void load()} title="Reload">
            <RefreshCw className="size-3" strokeWidth={1.5} /> Reload
          </Chip>
          <button onClick={() => void save()} disabled={busy} className="press-btn disabled:opacity-50">
            <Upload className="size-3.5" strokeWidth={1.5} /> {busy ? "Saving…" : "Save all"}
          </button>
        </div>
      </div>

      {loading ? <p className="caption">Loading…</p> : null}

      {view === "certificates" ? (
        <div className="space-y-5">
          {data.certificates.map((c, i) => (
            <div key={i} className="plate p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <ImagePicker value={c.image} onChange={(url) => patchCert(i, { image: url })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Title">
                    <input value={c.title} onChange={(e) => patchCert(i, { title: e.target.value })} className="admin-field" />
                  </Field>
                  <Field label="Issuer">
                    <input value={c.issuer} onChange={(e) => patchCert(i, { issuer: e.target.value })} className="admin-field" />
                  </Field>
                  <Field label="Year">
                    <input value={c.year} onChange={(e) => patchCert(i, { year: e.target.value })} className="admin-field" />
                  </Field>
                  <Field label="Category">
                    <input
                      value={c.category}
                      onChange={(e) => patchCert(i, { category: e.target.value })}
                      className="admin-field"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Verify / credential link (optional)">
                      <input
                        value={c.link ?? ""}
                        onChange={(e) => patchCert(i, { link: e.target.value })}
                        placeholder="https://udemy.com/certificate/…"
                        className="admin-field font-mono text-[0.78rem]"
                      />
                    </Field>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Chip
                  onClick={() => setData((d) => ({ ...d, certificates: d.certificates.filter((_, x) => x !== i) }))}
                  title="Remove certificate"
                >
                  <Trash2 className="size-3" strokeWidth={1.5} /> Remove
                </Chip>
              </div>
            </div>
          ))}
          <Chip
            onClick={() =>
              setData((d) => ({
                ...d,
                certificates: [
                  { title: "", issuer: "", year: String(new Date().getFullYear()), category: "", link: "", image: "" },
                  ...d.certificates,
                ],
              }))
            }
          >
            <Plus className="size-3" strokeWidth={1.5} /> Add certificate
          </Chip>
        </div>
      ) : null}

      {view === "achievements" ? (
        <div className="space-y-5">
          {data.achievements.map((a, i) => (
            <div key={i} className="plate p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <ImagePicker
                  value={a.image}
                  label="Achievement certificate (optional)"
                  onChange={(url) => patchAch(i, { image: url })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Label">
                    <input value={a.label} onChange={(e) => patchAch(i, { label: e.target.value })} className="admin-field" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Value">
                      <input
                        type="number"
                        value={a.value}
                        onChange={(e) => patchAch(i, { value: Number(e.target.value) || 0 })}
                        className="admin-field"
                      />
                    </Field>
                    <Field label="Suffix">
                      <input
                        value={a.suffix ?? ""}
                        onChange={(e) => patchAch(i, { suffix: e.target.value })}
                        placeholder="+"
                        className="admin-field"
                      />
                    </Field>
                  </div>
                  <Field label="Note (optional)">
                    <input value={a.note ?? ""} onChange={(e) => patchAch(i, { note: e.target.value })} className="admin-field" />
                  </Field>
                  <Field label="Link (optional)">
                    <input
                      value={a.link ?? ""}
                      onChange={(e) => patchAch(i, { link: e.target.value })}
                      className="admin-field font-mono text-[0.78rem]"
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Chip onClick={() => setData((d) => ({ ...d, achievements: d.achievements.filter((_, x) => x !== i) }))}>
                  <Trash2 className="size-3" strokeWidth={1.5} /> Remove
                </Chip>
              </div>
            </div>
          ))}
          <Chip
            onClick={() =>
              setData((d) => ({
                ...d,
                achievements: [{ label: "", value: 0, suffix: "+", note: "", image: "", link: "" }, ...d.achievements],
              }))
            }
          >
            <Plus className="size-3" strokeWidth={1.5} /> Add achievement
          </Chip>
        </div>
      ) : null}

      {view === "profiles" ? (
        <div className="space-y-5">
          {data.profiles.map((p, i) => (
            <div key={i} className="plate grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Platform">
                <input
                  value={p.platform}
                  onChange={(e) => patchProfile(i, { platform: e.target.value })}
                  className="admin-field"
                />
              </Field>
              <Field label="Username / ID">
                <input
                  value={p.username}
                  onChange={(e) => patchProfile(i, { username: e.target.value })}
                  placeholder="@chetanprajapat07"
                  className="admin-field"
                />
              </Field>
              <Field label="Headline stat">
                <input value={p.stat} onChange={(e) => patchProfile(i, { stat: e.target.value })} className="admin-field" />
              </Field>
              <Field label="Meta (rating, repos…)">
                <input value={p.meta} onChange={(e) => patchProfile(i, { meta: e.target.value })} className="admin-field" />
              </Field>
              <Field label="Profile URL">
                <input
                  value={p.url}
                  onChange={(e) => patchProfile(i, { url: e.target.value })}
                  className="admin-field font-mono text-[0.78rem]"
                />
              </Field>
              <Field label="Badges — comma separated">
                <input
                  value={p.badges.join(", ")}
                  onChange={(e) =>
                    patchProfile(i, { badges: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                  }
                  className="admin-field"
                />
              </Field>
              <div className="flex justify-end sm:col-span-2">
                <Chip onClick={() => setData((d) => ({ ...d, profiles: d.profiles.filter((_, x) => x !== i) }))}>
                  <Trash2 className="size-3" strokeWidth={1.5} /> Remove
                </Chip>
              </div>
            </div>
          ))}
          <Chip
            onClick={() =>
              setData((d) => ({
                ...d,
                profiles: [{ platform: "", username: "", stat: "", meta: "", badges: [], url: "" }, ...d.profiles],
              }))
            }
          >
            <Plus className="size-3" strokeWidth={1.5} /> Add profile
          </Chip>
        </div>
      ) : null}
    </div>
  );
}
