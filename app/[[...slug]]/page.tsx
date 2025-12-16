"use client";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { addMapping, updateMapping } from "@/lib/features/routeSlice";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    if (!fromPath || !toPath) return;
    if (!Array.isArray(mappings)) return;

    const normalizedFrom = `/${fromPath.replace(/^\/+/, "")}`;
    const normalizedTo = `/${toPath.replace(/^\/+/, "")}`;

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
        from: `/${editFrom}`,
        to: `/${editTo}`,
      })
    );
    setEditingId(null);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Route Manager</h1>

      <div className="mb-8 space-y-2 text-black">
        <h2 className="font-semibold text-white">Current mappings</h2>
        {Array.isArray(mappings) && mappings.length > 0 ? (
          mappings.map((m, index) => (
            <div
              key={m.from}
              className="flex items-center gap-2 bg-gray-50 p-2 rounded"
            >
              {editingId === m.from ? (
                <>
                  <input
                    className="border rounded px-2 py-1 w-32"
                    value={editFrom}
                    onChange={(e) => setEditFrom(e.target.value)}
                  />
                  <span>→</span>
                  <input
                    className="border rounded px-2 py-1 w-32"
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
                </>
              ) : (
                <>
                  <span className="font-mono">{m.from}</span>
                  <span>→</span>
                  <span className="font-mono">{m.to}</span>
                  <button
                    className="ml-auto px-2 py-1 text-sm bg-blue-600 text-white rounded"
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
        <div>
          <label className="block text-sm font-medium mb-1">From path</label>
          <input
            type="text"
            value={fromPath}
            onChange={(e) => setFromPath(e.target.value)}
            placeholder="old-page"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">To path</label>
          <input
            type="text"
            value={toPath}
            onChange={(e) => setToPath(e.target.value)}
            placeholder="new-page"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
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
