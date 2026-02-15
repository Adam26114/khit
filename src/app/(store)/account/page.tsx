"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, useSession } from "@/lib/auth";
import { api, useMutation, useQuery } from "@/lib/convex";
import { Package, User, SignOut, CaretRight } from "@/components/solar-icons";

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const userProfile = useQuery(api.users.getCurrent);
  const upsertCurrentProfile = useMutation(api.users.upsertCurrentProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session?.user || isEditing) {
      return;
    }

    const sessionPhone =
      (session.user as { phoneNumber?: string | null }).phoneNumber || "";
    setName(userProfile?.name || session.user.name || "");
    setPhone(userProfile?.phone || sessionPhone);
  }, [session?.user, userProfile?.name, userProfile?.phone, isEditing]);

  // Redirect if not logged in
  if (!isPending && !session) {
    router.push("/login?callbackUrl=/account");
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage("");

    try {
      const normalizedPhone = phone.trim();

      await authClient.updateUser({
        name,
        phoneNumber: normalizedPhone || undefined,
      });

      // Keep local Convex users table in sync for admin and reporting features.
      if (session?.user?.email) {
        await upsertCurrentProfile({
          email: session.user.email,
          name,
          phone: normalizedPhone || undefined,
        });
      }

      setMessage("Profile updated successfully");
      setIsEditing(false);
      router.refresh();
    } catch {
      setMessage("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 w-1/3" />
            <div className="h-32 bg-gray-200" />
            <div className="h-32 bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-medium mb-8">My Account</h1>

        {/* Profile Section */}
        <div className="bg-gray-50 rounded p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
                <User size={24} />
              </div>
              <div>
                <h2 className="font-medium">{session?.user?.name}</h2>
                <p className="text-sm text-gray-600">{session?.user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          {message && (
            <div className="bg-green-50 text-green-600 px-4 py-2 rounded mb-4">
              {message}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                  placeholder="Add your phone number"
                />
              </div>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          ) : null}
        </div>

        {/* Quick Links */}
        <div className="space-y-3 mb-8">
          <Link
            href="/account/orders"
            className="flex items-center justify-between p-4 bg-white border rounded hover:border-black transition-colors"
          >
            <div className="flex items-center gap-3">
              <Package size={20} />
              <span>My Orders</span>
            </div>
            <CaretRight size={16} />
          </Link>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <div className="mr-2">
            <SignOut size={16} />
          </div>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
