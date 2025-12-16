"use client";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { addMapping } from "@/lib/features/routeSlice";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CatchAllPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const mappings = useAppSelector((state) => state.routes.mappings);
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");

  useEffect(() => {
    if (pathname === "/") return;

    if (!Array.isArray(mappings)) {
      console.log("Mappings not ready:", mappings);
      return;
    }

    const redirectMapping = mappings.find(
      (mapping) => mapping.from === pathname
    );
    if (redirectMapping) {
      router.push(redirectMapping.to);
      return;
    }
  }, [pathname, mappings, router]);

  const handleAddRedirect = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (fromPath && toPath) {
      dispatch(addMapping({ from: `/${fromPath}`, to: `/${toPath}` }));
      setFromPath("");
      setToPath("");
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Route Manager</h1>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg text-black">
        <h2 className="font-semibold mb-2">Current Mappings</h2>
        <pre className="text-sm bg-white p-3 rounded border overflow-auto">
          {JSON.stringify(mappings, null, 2)}
        </pre>
      </div>

      <form onSubmit={handleAddRedirect} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">From Path</label>
          <input
            type="text"
            value={fromPath}
            onChange={(e) => setFromPath(e.target.value)}
            placeholder="/old-page"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">To Path</label>
          <input
            type="text"
            value={toPath}
            onChange={(e) => setToPath(e.target.value)}
            placeholder="/new-page"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
        >
          Add Route Mapping
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-500">
        Current path: <code>{pathname}</code>
      </div>
    </div>
  );
}
