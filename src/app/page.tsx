"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { encryptKey, decryptKey } from "@/lib/crypto";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Key, Video, Play, Mail, Loader2, LogOut } from "lucide-react";

type AnalysisResult = {
  url: string;
  summary: string;
  sentiment: { pro: number; neutral: number; con: number };
  metric: "High" | "Medium" | "Low";
  error?: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [urls, setUrls] = useState<string[]>(Array(5).fill(""));
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  useEffect(() => {
    const auth = localStorage.getItem("yt_auth_token");
    if (!auth) {
      router.push("/login");
    }

    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
      setApiKey(decryptKey(savedKey));
      setIsKeySaved(true);
    }
  }, [router]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("gemini_api_key", encryptKey(apiKey));
      setIsKeySaved(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("yt_auth_token");
    router.push("/login");
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleStartAnalysis = async () => {
    if (!apiKey) return alert("Please enter and save your Gemini API Key first.");
    
    const validUrls = urls.filter(u => u.trim() !== "");
    if (validUrls.length === 0) return alert("Please enter at least one YouTube URL.");

    setIsAnalyzing(true);
    setResults([]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ urls: validUrls }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setResults(data.results);
      } else {
        alert("Analysis failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      alert("Network error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email) return alert("Please enter an email address.");
    if (results.length === 0) return alert("No results to send. Please run analysis first.");

    setIsSending(true);
    setEmailStatus("");

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, results }),
      });

      if (response.ok) {
        setEmailStatus("Email sent successfully!");
      } else {
        const data = await response.json();
        setEmailStatus("Failed to send email: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      setEmailStatus("Network error occurred while sending email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Video className="text-indigo-500 h-8 w-8" />
            YouTube Intelligence
          </h1>
          <p className="text-slate-400 mt-1">Analyze videos and comments using Gemini API</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Key className="text-slate-400 h-4 w-4" />
            <Input
              type="password"
              placeholder="Gemini API Key"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setIsKeySaved(false);
              }}
              className="w-64"
            />
            <Button onClick={handleSaveKey} variant="default" className={isKeySaved ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
              {isKeySaved ? "Saved" : "Save Key"}
            </Button>
          </div>
          <Button onClick={handleLogout} variant="outline" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Target URLs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {urls.map((url, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder={`https://www.youtube.com/watch?v=... (${i + 1})`}
                  value={url}
                  onChange={(e) => handleUrlChange(i, e.target.value)}
                />
              </div>
            </div>
          ))}
          <div className="pt-4 flex justify-end">
            <Button 
              onClick={handleStartAnalysis} 
              disabled={isAnalyzing}
              className="w-48 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/20"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isAnalyzing ? "Analyzing..." : "Start Analysis"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-semibold text-white">Analysis Results</h2>
          <div className="grid gap-6">
            {results.map((result, i) => (
              <Card key={i} className="overflow-hidden border-t-4 border-t-indigo-500">
                <CardHeader className="bg-slate-900/80 border-b border-slate-800 pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-indigo-300 truncate max-w-2xl" title={result.url}>
                      {result.url}
                    </CardTitle>
                    {result.error ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant={result.metric === "High" ? "success" : result.metric === "Medium" ? "warning" : "destructive"}>
                        {result.metric} Metric ({result.sentiment.pro}%)
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6 grid md:grid-cols-3 gap-6">
                  {result.error ? (
                    <div className="col-span-3 text-red-400">{result.error}</div>
                  ) : (
                    <>
                      <div className="md:col-span-2 space-y-2">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Video Summary</h4>
                        <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">{result.summary}</p>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Comment Sentiment</h4>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-emerald-400">Pro (Agree)</span>
                              <span className="text-slate-300">{result.sentiment.pro}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${result.sentiment.pro}%` }} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Neutral</span>
                              <span className="text-slate-300">{result.sentiment.neutral}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-500 rounded-full" style={{ width: `${result.sentiment.neutral}%` }} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-red-400">Con (Disagree)</span>
                              <span className="text-slate-300">{result.sentiment.con}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${result.sentiment.con}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Email Section */}
          <Card className="mt-8 border-indigo-500/20 bg-indigo-950/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 max-w-2xl mx-auto">
                <Mail className="text-slate-400 h-5 w-5" />
                <Input
                  type="email"
                  placeholder="Enter email to receive report"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendEmail} 
                  disabled={isSending}
                  className="bg-slate-100 text-slate-900 hover:bg-white"
                >
                  {isSending ? "Sending..." : "Send to Mail"}
                </Button>
              </div>
              {emailStatus && (
                <p className={`text-center mt-4 text-sm ${emailStatus.includes("success") ? "text-emerald-400" : "text-red-400"}`}>
                  {emailStatus}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
