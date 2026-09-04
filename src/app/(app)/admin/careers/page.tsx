import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Quản lý Nghề nghiệp | 1learn.asia",
};

export default async function AdminCareersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const { page: pageStr = "1" } = await searchParams;
  const page = parseInt(pageStr, 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data: careers, count } = await supabase
    .from("careers")
    .select("id, code, name, status, last_verified_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Career Knowledge Base
          </h1>
          <p className="text-zinc-400">Quản lý và xuất bản cơ sở dữ liệu nghề nghiệp.</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/admin/careers/import"
            className="px-4 py-2 bg-zinc-800 text-white rounded-md hover:bg-zinc-700 transition"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/careers/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
          >
            + Tạo nghề mới
          </Link>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Mã Nghề</th>
              <th className="px-6 py-4">Tên Nghề</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Cập nhật cuối</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {careers?.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-800/50">
                <td className="px-6 py-4 font-mono text-xs">{c.code}</td>
                <td className="px-6 py-4 font-medium">{c.name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    c.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' :
                    c.status === 'needs_verification' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {c.last_verified_at ? new Date(c.last_verified_at).toLocaleDateString('vi-VN') : 'Chưa verify'}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/careers/${c.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                    Chi tiết &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {(!careers || careers.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
