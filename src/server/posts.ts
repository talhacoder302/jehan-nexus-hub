import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";

export async function countPendingApprovals(clientId: string): Promise<number> {
  await connectDB();
  return Post.countDocuments({
    clientId: new Types.ObjectId(clientId),
    status: "pending_approval",
  });
}
