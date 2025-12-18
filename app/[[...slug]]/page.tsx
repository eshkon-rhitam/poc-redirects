/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  addMapping,
  deleteMapping,
  RedirectType,
  updateMapping,
  upsertMany,
} from "@/lib/features/routeSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { domainToHost } from "@/lib/constants";
import { buildExportData, downloadJson } from "@/lib/exportFunction";
import { buildRedirectsFile } from "@/lib/buildReditectsFile";

export default function CatchAllPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const mappings = useAppSelector((state) => state.routes.mappings);

  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editFrom, setEditFrom] = useState("");
  const [editTo, setEditTo] = useState("");
  const [editType, setEditType] = useState<RedirectType>("Temporary");

  const [activeDomain, setActiveDomain] = useState(
    domainToHost[Object.keys(domainToHost)[0]]
  );
  const [redirectType, setRedirectType] = useState<RedirectType>("Permanent");
  const [loading, setLoading] = useState(false);
  const [savingToGit, setSavingToGit] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportData, setExportData] = useState<any[]>([]);

  useEffect(() => {
    if (pathname === "/") return;
    if (!Array.isArray(mappings)) return;

    const redirectMapping = mappings.find((m) => m.from === pathname);
    if (redirectMapping) {
      router.push(redirectMapping.to);
    }
  }, [pathname, mappings, router]);

  const handleAddRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromPath && !toPath) {
      alert("From or To path is required");
      return;
    }
    if (!Array.isArray(mappings)) return;
    const formRoute = fromPath ? `/${fromPath.replace(/^\/+/, "")}` : "";
    const toRoute = toPath ? `/${toPath.replace(/^\/+/, "")}` : "";
    if (formRoute === toRoute) {
      alert("Domains must differ");
      return;
    }
    const normalizedFrom = `${activeDomain}${formRoute}`;
    const normalizedTo = `${activeDomain}${toRoute}`;

    const existing = mappings.find((m) => m.from === normalizedFrom);
    if (existing) {
      alert("Route exists");
      return;
    }

    dispatch(
      addMapping({
        from: normalizedFrom,
        to: normalizedTo,
        type: redirectType,
      })
    );
    setFromPath("");
    setToPath("");
  };

  const startEdit = (m: { from: string; to: string; type: RedirectType }) => {
    setEditingId(m.from);
    setEditFrom(m.from.replace(/^\//, ""));
    setEditTo(m.to.replace(/^\//, ""));
    setEditType(m.type ?? "Permanent");
  };

  const saveEdit = () => {
    if (!editingId) return;
    dispatch(
      updateMapping({
        from: `${editFrom}`,
        to: `${editTo}`,
        type: editType,
      })
    );
    setEditingId(null);
  };
  const handleDelete = (m: { from: string; to: string }) => {
    dispatch(deleteMapping({ from: m.from }));
    setEditingId(null);
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    const [, ...rows] = lines;
    const isRedirectType = (value: string): value is RedirectType =>
      value === "Permanent" || value === "Temporary";
    const parsed = rows
      .map((line) => line.split(","))
      .filter((cols) => cols.length >= 3)
      .map((cols) => {
        const fromRaw = cols[1].trim();
        const toRaw = cols[2].trim();
        const rawType = cols[3]?.trim();
        const type: RedirectType =
          rawType && isRedirectType(rawType) ? rawType : "Temporary";

        return {
          from: fromRaw,
          to: toRaw,
          type,
        };
      });

    if (parsed.length === 0) return;

    dispatch(upsertMany(parsed));
    e.target.value = "";
  };
  // const handleExport = () => {
  //   const exportData = buildExportData(mappings);
  //   if (!exportData.length) {
  //     alert("No mappings to export");
  //     return;
  //   }
  //   downloadJson(exportData, "next-redirects.json");
  // };
  const handleGetEntities = async () => {
    setLoading(true);
    const completeDomain =
      fromPath === "" ? activeDomain : activeDomain + "/" + fromPath;
    try {
      const response = await fetch(
        `/api/entities?canonical=${encodeURIComponent(completeDomain)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Entities fetched:", result.items);
    } catch (error) {
      console.error("Failed to fetch entities:", error);
      alert("Failed to fetch entities");
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateEntities = async () => {
    setLoading(true);
    const completeDomain =
      fromPath === "" ? activeDomain : activeDomain + "/" + fromPath;
    const newCanonical =
      toPath === "" ? activeDomain : activeDomain + "/" + toPath;
    if (newCanonical === completeDomain) {
      alert("Rewrite only possible for different domains");
      return;
    }
    try {
      const response = await fetch(
        `/api/entities?canonical=${encodeURIComponent(
          completeDomain
        )}&changeCanonical=${encodeURIComponent(newCanonical)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.updated > 0) {
        alert(`Successfully updated ${result.updated} entities!`);
        await handleGetEntities();
      } else {
        alert("No entities found to update");
      }
    } catch (error) {
      console.error("Failed to update entities:", error);
      alert("Failed to update entities");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRedirectsToGit = async () => {
    if (!Array.isArray(mappings) || mappings.length === 0) {
      alert("No mappings to save");
      return;
    }
    setSavingToGit(true);
    try {
      const redirectsText = buildRedirectsFile(mappings as any);
      const res = await fetch("/api/save-redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirectsText }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      console.log("Git commit:", data.commitSha);
      alert("Redirects saved to GitHub. Vercel will redeploy on push.");
    } catch (e) {
      console.error(e);
      alert("Failed to save redirects to GitHub");
    } finally {
      setSavingToGit(false);
    }
  };

  const handleExport = () => {
    const data = buildExportData(mappings);
    if (!data.length) {
      alert("No mappings to export");
      return;
    }
    setExportData(data);
    setShowExportDialog(true);
  };

  const handleDownload = () => {
    downloadJson(exportData, "next-redirects.json");
    setShowExportDialog(false);
  };

  const handleSaveToContentful = async () => {
    setSavingToGit(true); // Reuse loading state or add new one
    try {
      const response = await fetch("/api/save-contentful", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirects: exportData }),
      });

      if (!response.ok) throw new Error("Failed to save to Contentful");

      const result = await response.json();
      alert(
        `Successfully saved ${
          result.saved || exportData.length
        } mappings to Contentful!`
      );
    } catch (error) {
      console.error("Contentful save failed:", error);
      alert("Failed to save to Contentful. Proceeding with download...");
      handleDownload();
    } finally {
      setSavingToGit(false);
      setShowExportDialog(false);
    }
  };
  return (
    <div className="p-8 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Route Manager</h1>
      <div className="mb-6 space-y-2">
        <label className="block text-sm font-medium">
          Import redirects (CSV)
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
        <p className="text-xs text-gray-500">
          Expected columns: Domain, Current URL, Target redirect URL, Redirect
          Type (Permanent/Temporary)
        </p>
      </div>

      <div className="w-full mb-8 space-y-2 text-black">
        <h2 className="font-semibold text-white">Current mappings</h2>
        <Dialog
          open={showExportDialog}
          onOpenChange={showExportDialog ? setShowExportDialog : handleExport}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              className="px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
            >
              Export
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Redirects</DialogTitle>
              <DialogDescription>
                Choose how you want to export your {exportData.length} redirect
                mappings:
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Download JSON file
              </Button>
              <Button
                onClick={handleSaveToContentful}
                className="flex items-center gap-2"
                disabled={savingToGit}
              >
                <Upload className="h-4 w-4" />
                Save to Contentful
                {savingToGit && "…"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <button
          type="button"
          onClick={handleSaveRedirectsToGit}
          disabled={savingToGit}
          className="px-3 py-2 ml-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {savingToGit ? "Saving to Git…" : "Save redirects to Git"}
        </button>
        {Array.isArray(mappings) && mappings.length > 0 ? (
          mappings.map((m) => (
            <div
              key={m.from}
              className="w-full flex items-center justify-between gap-2 bg-gray-50 p-2 rounded"
            >
              {editingId === m.from ? (
                <>
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    value={editFrom}
                    onChange={(e) => setEditFrom(e.target.value)}
                  />
                  <span>→</span>
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    value={editTo}
                    onChange={(e) => setEditTo(e.target.value)}
                  />
                  <select
                    className="border rounded px-2 py-1"
                    value={editType}
                    onChange={(e) =>
                      setEditType(e.target.value as RedirectType)
                    }
                  >
                    <option value="Temporary">Temporary (307)</option>
                    <option value="Permanent">Permanent (308)</option>
                  </select>
                  <button
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const response = await fetch(
                          `/api/entities?canonical=${editFrom}&changeCanonical=${editTo}`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                          }
                        );

                        if (!response.ok) {
                          throw new Error(
                            `HTTP error! status: ${response.status}`
                          );
                        }

                        const result = await response.json();
                        console.log("Update result:", result);

                        if (result.updated > 0) {
                          alert(
                            `Successfully updated ${result.updated} entities!`
                          );
                        } else {
                          alert("No entities found to update");
                        }
                      } catch (error) {
                        console.error("Failed to update entities:", error);
                        alert("Failed to update entities");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Rewriting..." : "Rewrite"}
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-green-600 text-white rounded"
                    onClick={saveEdit}
                  >
                    Save
                  </button>
                  <button
                    className="px-2 py-1 text-sm"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-red-600 text-white rounded"
                    onClick={() => handleDelete(m)}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <span className="font-mono w-max">{m.from}</span>
                  <span className="flex-1 h-px bg-black" />
                  <span className="font-mono ml-auto">{m.to}</span>
                  <span className="font-mono ml-auto p-2 rounded-lg">
                    {m.type}
                  </span>
                  <button
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
                    onClick={() => startEdit(m)}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No mappings yet.</p>
        )}
      </div>

      <form onSubmit={handleAddRedirect} className="space-y-4">
        <select
          value={activeDomain}
          onChange={(e) => setActiveDomain(e.target.value)}
          className="dark:text-white dark:bg-background"
        >
          {Object.entries(domainToHost).map(([domain, host]) => (
            <option key={domain} value={host}>
              {domain}
            </option>
          ))}
        </select>
        <div>
          <label className="block text-sm font-medium mb-1">From path</label>

          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 rounded-l-lg bg-gray-100 text-sm text-gray-600">
              {activeDomain}/
            </span>

            <input
              type="text"
              value={fromPath}
              onChange={(e) => setFromPath(e.target.value)}
              placeholder="old-slug"
              className="w-full p-3 border rounded-r-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">To path</label>

          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 rounded-l-lg bg-gray-100 text-sm text-gray-600">
              {activeDomain}/
            </span>

            <input
              type="text"
              value={toPath}
              onChange={(e) => setToPath(e.target.value)}
              placeholder="new-slug"
              className="w-full p-3 border rounded-r-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Redirect type
          </label>
          <select
            value={redirectType}
            onChange={(e) => setRedirectType(e.target.value as RedirectType)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white dark:bg-background"
          >
            <option value="permanent">Permanent (301)</option>
            <option value="temporary">Temporary (302)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium"
        >
          Add route mapping
        </button>
      </form>
      <button
        onClick={handleUpdateEntities}
        className="mt-3 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
      >
        Rewrite
      </button>
    </div>
  );
}
