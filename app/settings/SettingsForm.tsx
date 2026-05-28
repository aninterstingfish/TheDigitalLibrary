"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type User = { name: string; username: string; email: string; yearGroup: number | null; profilePhoto: string | null };

export default function SettingsForm({ user }: { user: User }) {
  const router = useRouter();

  // Profile
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [yearGroup, setYearGroup] = useState<string>(user.yearGroup?.toString() ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.profilePhoto);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteErr, setDeleteErr] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Export
  const [exportLoading, setExportLoading] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr(""); setProfileMsg("");
    if (!name.trim()) { setProfileErr("Name cannot be empty."); return; }
    if (!username.trim()) { setProfileErr("Username cannot be empty."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setProfileErr("Enter a valid email address."); return; }

    setProfileLoading(true);
    let profilePhoto: string | null | undefined = undefined;
    if (photoFile) {
      const fd = new FormData();
      fd.append("file", photoFile);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const text = await up.text();
      const upData = text ? JSON.parse(text) : {};
      if (!up.ok) { setProfileErr(upData.error || "Upload failed."); setProfileLoading(false); return; }
      profilePhoto = upData.url;
    }

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        yearGroup: yearGroup ? parseInt(yearGroup) : null,
        ...(profilePhoto !== undefined && { profilePhoto }),
      }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) { setProfileErr(data.error || "Something went wrong."); }
    else { setProfileMsg("Profile updated!"); router.refresh(); }
    setProfileLoading(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(""); setPwMsg("");
    if (newPw !== confirmPw) { setPwErr("Passwords do not match."); return; }
    if (newPw.length < 8) { setPwErr("New password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(newPw)) { setPwErr("New password must contain at least one capital letter."); return; }
    setPwLoading(true);
    const res = await fetch("/api/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: currentPw, next: newPw }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) { setPwErr(data.error || "Something went wrong."); }
    else { setPwMsg("Password changed!"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    setPwLoading(false);
  }

  async function exportData() {
    setExportLoading(true);
    const res = await fetch("/api/account/export");
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cloud-library-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExportLoading(false);
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteErr("");
    if (!deletePassword) { setDeleteErr("Enter your password to confirm."); return; }
    setDeleteLoading(true);
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) { setDeleteErr(data.error || "Something went wrong."); setDeleteLoading(false); return; }
    window.location.href = "/login";
  }

  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-6">
      {/* Profile */}
      <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-black">Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="group relative w-16 h-16 rounded-full overflow-hidden bg-black flex items-center justify-center shrink-0">
            {photoPreview
              ? <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-xl">{initials}</span>}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            </div>
          </button>
          <div>
            <p className="text-sm font-medium text-black">@{user.username}</p>
            <p className="text-xs text-gray-400 mt-0.5">Click avatar to change photo</p>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-black mb-1.5">Full name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={ic(false)} />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-black mb-1.5">Username</label>
          <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={ic(false)} />
          <p className="text-xs text-gray-400 mt-1">Changing this changes your profile URL.</p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-black mb-1.5">Email address</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={ic(false)} />
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-black mb-1.5">Year group <span className="text-gray-400 font-normal">(optional)</span></label>
          <select id="year" value={yearGroup} onChange={(e) => setYearGroup(e.target.value)}
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all">
            <option value="">Select year group</option>
            <option value="0">Reception</option>
            {[1,2,3,4,5,6,7,8,9,10,11,12,13].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>

        {profileErr && <p className="text-red-500 text-sm">{profileErr}</p>}
        {profileMsg && <p className="text-emerald-600 text-sm">{profileMsg}</p>}

        <button type="submit" disabled={profileLoading}
          className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {profileLoading ? "Saving…" : "Save profile"}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={changePassword} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-black">Change password</h2>
        <div>
          <label htmlFor="current" className="block text-sm font-medium text-black mb-1.5">Current password</label>
          <input id="current" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={ic(false)} />
        </div>
        <div>
          <label htmlFor="newpw" className="block text-sm font-medium text-black mb-1.5">New password</label>
          <input id="newpw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 8 chars, one capital letter" className={ic(false)} />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-black mb-1.5">Confirm new password</label>
          <input id="confirm" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={ic(false)} />
        </div>
        {pwErr && <p className="text-red-500 text-sm">{pwErr}</p>}
        {pwMsg && <p className="text-emerald-600 text-sm">{pwMsg}</p>}
        <button type="submit" disabled={pwLoading}
          className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {pwLoading ? "Changing…" : "Change password"}
        </button>
      </form>

      {/* Privacy & Data */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-black">Privacy &amp; data</h2>
        <p className="text-sm text-gray-500">Under GDPR you have the right to access and export a copy of all your personal data.</p>
        <button onClick={exportData} disabled={exportLoading} type="button"
          className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {exportLoading ? "Preparing download…" : "Download my data (JSON)"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 space-y-4">
        <h2 className="font-semibold text-red-600">Danger zone</h2>
        <p className="text-sm text-gray-500">
          Permanently deletes your account and all associated data — books, swap history, ratings, and notifications. This cannot be undone.
        </p>

        {!showDelete ? (
          <button type="button" onClick={() => setShowDelete(true)}
            className="w-full border border-red-200 text-red-500 py-3.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all">
            Delete my account
          </button>
        ) : (
          <form onSubmit={deleteAccount} className="space-y-3">
            <p className="text-sm font-medium text-black">Enter your password to confirm deletion:</p>
            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your current password" className={ic(false)} />
            {deleteErr && <p className="text-red-500 text-sm">{deleteErr}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={deleteLoading}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {deleteLoading ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button type="button" onClick={() => { setShowDelete(false); setDeletePassword(""); setDeleteErr(""); }}
                className="px-4 py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ic(hasError: boolean) {
  return `w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${hasError ? "border-red-300 bg-red-50" : "border-gray-200"}`;
}
