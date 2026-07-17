import { createClient } from "@/lib/supabase/server";
import { Users, Mail, Calendar, Shield, ShieldOff, MapPin, Heart, Route } from "lucide-react";

export const metadata = { title: "Потребители" };
export const dynamic = "force-dynamic";

async function getUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) return [];

  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, is_admin, created_at")
    .order("created_at", { ascending: false });

  if (!profiles?.length) return [];

  // Get route + favorite counts per user
  const [routesRes, favsRes] = await Promise.all([
    supabase.from("user_routes").select("user_id"),
    supabase.from("user_favorites").select("user_id"),
  ]);

  const routeCounts: Record<string, number> = {};
  const favCounts: Record<string, number> = {};

  for (const r of routesRes.data ?? []) {
    routeCounts[r.user_id] = (routeCounts[r.user_id] ?? 0) + 1;
  }
  for (const f of favsRes.data ?? []) {
    favCounts[f.user_id] = (favCounts[f.user_id] ?? 0) + 1;
  }

  return profiles.map((p) => ({
    ...p,
    routes: routeCounts[p.id] ?? 0,
    favorites: favCounts[p.id] ?? 0,
  }));
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Потребители</h1>
          <p className="text-gray-400 text-sm">{users.length} регистрирани</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Все още няма регистрирани потребители</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Потребител
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Регистриран
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Маршрути
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Любими
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Роля
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Avatar + name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatar_url}
                          alt={user.full_name ?? ""}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 text-sm font-bold">
                            {(user.full_name ?? user.email ?? "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        {user.full_name && (
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.full_name}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {user.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString("bg-BG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>

                  {/* Routes */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
                      <Route className="w-3.5 h-3.5 text-green-500" />
                      {user.routes}
                    </span>
                  </td>

                  {/* Favorites */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                      {user.favorites}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-4 text-center">
                    {user.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 text-xs font-medium border border-gray-100">
                        <ShieldOff className="w-3 h-3" />
                        Потребител
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
