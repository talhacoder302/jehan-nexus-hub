import "server-only";
import { connectDB } from "@/lib/db";
import { Client } from "@/models";
import { visibleClientsFilter, type SessionUser } from "./permissions";

export interface ClientOption {
  id: string;
  name: string;
}

/** Clients the user can see, for pickers and switchers. */
export async function listClientOptions(user: SessionUser): Promise<ClientOption[]> {
  await connectDB();
  const clients = await Client.find(
    { ...visibleClientsFilter(user), status: { $ne: "archived" } },
    { name: 1 },
  )
    .sort({ name: 1 })
    .lean();
  return clients.map((c) => ({ id: c._id.toString(), name: c.name }));
}
