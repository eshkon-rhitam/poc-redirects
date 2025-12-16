"use client";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  addMapping,
  deleteMapping,
  updateMapping,
  upsertMany,
} from "@/lib/features/routeSlice";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { domainToHost } from "@/lib/constants";

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
  const [activeDomain, setActiveDomain] = useState(
    domainToHost[Object.keys(domainToHost)[0]]
  );
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
    if (!fromPath && !toPath) return;
    if (!Array.isArray(mappings)) return;

    const normalizedFrom = `${activeDomain}/${fromPath.replace(/^\/+/, "")}`;
    const normalizedTo = `${activeDomain}/${toPath.replace(/^\/+/, "")}`;

    const existing = mappings.find((m) => m.from === normalizedFrom);
    if (existing) {
      alert("Route exists");
      return;
    }

    dispatch(addMapping({ from: normalizedFrom, to: normalizedTo }));
    setFromPath("");
    setToPath("");
  };

  const startEdit = (m: { from: string; to: string }) => {
    setEditingId(m.from);
    setEditFrom(m.from.replace(/^\//, ""));
    setEditTo(m.to.replace(/^\//, ""));
  };

  const saveEdit = () => {
    if (!editingId) return;
    dispatch(
      updateMapping({
        from: `${editFrom}`,
        to: `${editTo}`,
      })
    );
    setEditingId(null);
  };
  const handleDelete = (m: { from: string; to: string }) => {
    dispatch(deleteMapping({ from: m.from, to: m.to }));
    setEditingId(null);
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    const [, ...rows] = lines;

    const parsed = rows
      .map((line) => line.split(","))
      .filter((cols) => cols.length >= 3)
      .map((cols) => {
        const fromRaw = cols[1].trim();
        const toRaw = cols[2].trim();
        return {
          from: fromRaw,
          to: toRaw,
        };
      });

    if (parsed.length === 0) return;

    dispatch(upsertMany(parsed));
    e.target.value = "";
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
          Expected columns: Domain, Current URL, Target redirect URL
        </p>
      </div>
      <div className="w-full mb-8 space-y-2 text-black">
        <h2 className="font-semibold text-white">Current mappings</h2>
        {Array.isArray(mappings) && mappings.length > 0 ? (
          mappings.map((m, index) => (
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
        >
          {Object.entries(domainToHost).map(([domain, host]) => (
            <option key={domain} value={host} className="bg-black">
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
              placeholder="old-page"
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
              placeholder="new-page"
              className="w-full p-3 border rounded-r-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
        >
          Add route mapping
        </button>
      </form>
    </div>
  );
}
