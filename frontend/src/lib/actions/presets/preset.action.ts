const API_URL = import.meta.env.VITE_API_URL || "http://localhost:42000";

export async function get_presets_list(task: string): Promise<string[]> {
  const res = await fetch(`${API_URL}/presets/${task}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch presets: ${res.status}`);
  }
  const data = await res.json();
  // console.log("presets:", data);
  return data;
}
