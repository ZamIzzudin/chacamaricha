import { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { encryptChacha, decryptChacha } from "@/lib/crypto";
import { Lock, Unlock, Copy, Check, Eye, EyeOff } from "lucide-react";

function App() {
  const [secretKey, setSecretKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Encrypt state
  const [encryptInput, setEncryptInput] = useState(
    JSON.stringify({ text: "2026-07-02T02:09:01.036Z" }, null, 2)
  );
  const [encryptOutput, setEncryptOutput] = useState("");
  const [encryptError, setEncryptError] = useState("");

  // Decrypt state
  const [decryptInput, setDecryptInput] = useState("");
  const [decryptOutput, setDecryptOutput] = useState("");
  const [decryptError, setDecryptError] = useState("");

  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleEncrypt = useCallback(() => {
    setEncryptError("");
    setEncryptOutput("");

    if (!secretKey) {
      setEncryptError("Secret key is required");
      return;
    }

    if (secretKey.length !== 64) {
      setEncryptError("Secret key must be 64 hex characters (32 bytes)");
      return;
    }

    try {
      const payload = JSON.parse(encryptInput);
      const result = encryptChacha(JSON.stringify(payload), secretKey);
      setEncryptOutput(result);
    } catch (err) {
      setEncryptError(
        err instanceof Error ? err.message : "Encryption failed"
      );
    }
  }, [encryptInput, secretKey]);

  const handleDecrypt = useCallback(() => {
    setDecryptError("");
    setDecryptOutput("");

    if (!secretKey) {
      setDecryptError("Secret key is required");
      return;
    }

    if (secretKey.length !== 64) {
      setDecryptError("Secret key must be 64 hex characters (32 bytes)");
      return;
    }

    try {
      const result = decryptChacha(decryptInput.trim(), secretKey);
      const parsed = JSON.parse(result);
      setDecryptOutput(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setDecryptError(
        err instanceof Error ? err.message : "Decryption failed"
      );
    }
  }, [decryptInput, secretKey]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            ChaCha20-Poly1305
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Payload Encryptor
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Encrypt and decrypt timestamp payloads with ChaCha20-Poly1305
          </p>
        </div>

        {/* Secret Key */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <Label htmlFor="secret-key" className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
            Secret Key (64 hex chars)
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="secret-key"
                type={showKey ? "text" : "password"}
                placeholder="0123456789abcdef0123456789abcdef..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="pr-9 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const bytes = new Uint8Array(32);
                crypto.getRandomValues(bytes);
                setSecretKey(
                  Array.from(bytes)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join("")
                );
              }}
              className="shrink-0 text-xs"
            >
              Generate
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="encrypt">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="encrypt" className="flex-1 gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Encrypt
            </TabsTrigger>
            <TabsTrigger value="decrypt" className="flex-1 gap-1.5">
              <Unlock className="h-3.5 w-3.5" />
              Decrypt
            </TabsTrigger>
          </TabsList>

          {/* Encrypt Tab */}
          <TabsContent value="encrypt">
            <div className="flex gap-4">
              {/* Input Panel */}
              <div className="flex-1 space-y-3">
                <Label className="block text-xs uppercase tracking-wider text-muted-foreground">
                  Input (JSON Payload)
                </Label>
                <Textarea
                  placeholder='{"text": "2026-07-02T02:09:01.036Z"}'
                  value={encryptInput}
                  onChange={(e) => setEncryptInput(e.target.value)}
                  className="min-h-[160px] font-mono text-xs"
                />
                <Button onClick={handleEncrypt} className="w-full gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  Encrypt
                </Button>
                {encryptError && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-red-400">
                    {encryptError}
                  </div>
                )}
              </div>

              {/* Output Panel */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Encrypted Output (hex)
                  </Label>
                  {encryptOutput && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(encryptOutput, "encrypt")}
                      className="h-7 gap-1.5 text-xs"
                    >
                      {copied === "encrypt" ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="min-h-[160px] rounded-md border border-border bg-muted/50 p-3">
                  {encryptOutput ? (
                    <code className="block break-all font-mono text-xs text-green-400">
                      {encryptOutput}
                    </code>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">
                      Encrypted result will appear here...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Decrypt Tab */}
          <TabsContent value="decrypt">
            <div className="flex gap-4">
              {/* Input Panel */}
              <div className="flex-1 space-y-3">
                <Label className="block text-xs uppercase tracking-wider text-muted-foreground">
                  Input (Encrypted Hex)
                </Label>
                <Textarea
                  placeholder="Paste encrypted hex string here..."
                  value={decryptInput}
                  onChange={(e) => setDecryptInput(e.target.value)}
                  className="min-h-[160px] font-mono text-xs"
                />
                <Button onClick={handleDecrypt} className="w-full gap-2">
                  <Unlock className="h-3.5 w-3.5" />
                  Decrypt
                </Button>
                {decryptError && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-red-400">
                    {decryptError}
                  </div>
                )}
              </div>

              {/* Output Panel */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Decrypted Output (JSON)
                  </Label>
                  {decryptOutput && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(decryptOutput, "decrypt")}
                      className="h-7 gap-1.5 text-xs"
                    >
                      {copied === "decrypt" ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="min-h-[160px] rounded-md border border-border bg-muted/50 p-3">
                  {decryptOutput ? (
                    <pre className="whitespace-pre-wrap break-all font-mono text-xs text-green-400">
                      {decryptOutput}
                    </pre>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">
                      Decrypted result will appear here...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          No keys are stored. All encryption happens client-side.
        </p>
      </div>
    </div>
  );
}

export default App;
