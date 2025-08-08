import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { generateCode, type StackOption } from "@/lib/generators";

const FREE_CREDITS = 10;

function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

const stacks: StackOption[] = [
  "React",
  "Node.js",
  "PHP",
  "Laravel",
  "CodeIgniter",
  "HTML",
  "Golang",
  "Custom",
];

const Index = () => {
  const [appName, setAppName] = useLocalStorage("app_name", "Proyek Baru");
  const [description, setDescription] = useLocalStorage(
    "app_desc",
    "Generator kode AI multi-bahasa"
  );
  const [stack, setStack] = useLocalStorage<StackOption>("stack", "React");
  const [customLang, setCustomLang] = useLocalStorage("custom_lang", "");
  const [credits, setCredits] = useLocalStorage<number>(
    "credits",
    FREE_CREDITS
  );
  const [ghToken, setGhToken] = useLocalStorage<string | null>(
    "gh_token",
    null
  );

  const [files, setFiles] = useState<Record<string, string> | null>(null);
  const [mainLanguage, setMainLanguage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  useEffect(() => {
    document.title = "AI Code Generator | Multi-bahasa";
  }, []);

  const disabled = useMemo(() => credits <= 0 || isGenerating, [credits, isGenerating]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--spot-x", `${x}px`);
    e.currentTarget.style.setProperty("--spot-y", `${y}px`);
  };

  const onGenerate = async () => {
    if (credits <= 0) {
      toast("Kredit habis", {
        description: "Hubungi admin untuk upgrade paket.",
      });
      return;
    }
    try {
      setIsGenerating(true);
      const result = generateCode({
        appName,
        description,
        stack,
        language: customLang,
      });
      setFiles(result.files);
      setMainLanguage(result.mainLanguage);
      setCredits((c) => c - 1);
      toast.success("Kode berhasil dibuat");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat kode");
    } finally {
      setIsGenerating(false);
    }
  };

  const connectGitHub = () => {
    const token = prompt(
      "Tempelkan GitHub Personal Access Token (repo scope). Ini akan disimpan di localStorage untuk sementara."
    );
    if (token) {
      setGhToken(token.trim());
      toast.success("GitHub terhubung");
    }
  };

  async function pushToGitHub() {
    if (!ghToken) {
      toast("Hubungkan GitHub dulu");
      return;
    }
    if (!files) {
      toast("Tidak ada file untuk dipush");
      return;
    }
    try {
      setIsPushing(true);
      // Dapatkan user
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${ghToken}` },
      });
      if (!userRes.ok) throw new Error("Gagal get user");
      const user = await userRes.json();

      const repoName = appName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

      // Buat repo private=false agar terlihat (bisa diganti sesuai kebutuhan)
      const repoRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ghToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: repoName, description, private: false }),
      });
      if (!repoRes.ok && repoRes.status !== 422) {
        // 422 artinya repo sudah ada
        throw new Error("Gagal membuat repo");
      }

      // Commit setiap file
      const owner = user.login as string;
      for (const [path, content] of Object.entries(files)) {
        const encoded = btoa(unescape(encodeURIComponent(content)));
        const put = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(
            path
          )}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${ghToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `add ${path}`,
              content: encoded,
            }),
          }
        );
        if (!put.ok) throw new Error(`Gagal commit ${path}`);
      }

      toast.success("Sukses push ke GitHub");
    } catch (e) {
      console.error(e);
      toast.error("Push ke GitHub gagal");
    } finally {
      setIsPushing(false);
    }
  }

  return (
    <div className="min-h-screen hero-surface" onMouseMove={handleMouseMove}>
      <header className="container mx-auto py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-muted-foreground animate-reveal">
            Beta • Gratis hingga {FREE_CREDITS} kredit
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight gradient-text">
            AI Code Generator
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Buat website & skrip dalam React, Node.js, PHP (Laravel/CodeIgniter), Golang,
            HTML, atau bahasa kustom. Export langsung ke GitHub.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="lg" onClick={onGenerate} disabled={disabled}>
              {isGenerating ? "Membuat..." : "Buat Kode"}
            </Button>
            <Button variant="secondary" size="lg" onClick={ghToken ? pushToGitHub : connectGitHub} disabled={!files || isPushing}>
              {ghToken ? (isPushing ? "Mendorong..." : "Push ke GitHub") : "Hubungkan GitHub"}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">Kredit tersisa: {credits}</div>
        </div>
      </header>

      <main className="container mx-auto pb-20">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-[var(--shadow-elevated)] animate-reveal">
            <CardHeader>
              <CardTitle>Detail Proyek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">Nama Aplikasi</label>
                <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Contoh: TokoKu" />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Deskripsi</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Apa yang ingin dibuat?" rows={4} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm">Stack / Bahasa</label>
                  <Select value={stack} onValueChange={(v) => setStack(v as StackOption)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih stack" />
                    </SelectTrigger>
                    <SelectContent>
                      {stacks.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Bahasa Kustom (opsional)</label>
                  <Input value={customLang} onChange={(e) => setCustomLang(e.target.value)} placeholder="Misal: Python, Rust" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-elevated)] animate-reveal">
            <CardHeader>
              <CardTitle>Integrasi & Batasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                • GitHub: gunakan Personal Access Token (scope repo) untuk push otomatis.
              </p>
              <p>• Kredit: setiap generate mengurangi 1 kredit. Saat habis, hubungi admin untuk upgrade.</p>
              <p>
                • Laravel/CodeIgniter: v1 menghasilkan panduan dan file dasar. Implementasi penuh dapat ditambahkan pada iterasi berikut.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="shadow-[var(--shadow-elevated)] animate-reveal">
            <CardHeader>
              <CardTitle>Hasil</CardTitle>
            </CardHeader>
            <CardContent>
              {!files ? (
                <p className="text-muted-foreground">Belum ada output. Isi detail dan klik "Buat Kode".</p>
              ) : (
                <Tabs defaultValue={Object.keys(files)[0] ?? ""}>
                  <TabsList className="flex flex-wrap">
                    {Object.keys(files).map((path) => (
                      <TabsTrigger key={path} value={path} className="text-xs md:text-sm">
                        {path}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Object.entries(files).map(([path, content]) => (
                    <TabsContent key={path} value={path} className="mt-4">
                      <pre className="overflow-auto rounded-md border border-border p-4 text-xs md:text-sm bg-card">
                        <code>{content}</code>
                      </pre>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Index;
