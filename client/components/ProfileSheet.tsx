/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Sheet } from "./ui/sheet";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { User, Camera, Mail, Lock, X, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { user, updateProfile } = useAuth();

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prev
      }
    }
    return
  }, [open])

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<"profile" | "security">("profile");

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const passwordStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];
  const pwStrength = passwordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const nameChanged = name !== user?.name && name.trim() !== "";
    const passwordChanged = newPassword !== "";

    if (!nameChanged && !passwordChanged) {
      setError("Please make at least one change");
      return;
    }

    if (passwordChanged) {
      if (!currentPassword) return setError("Current password is required");
      if (newPassword.length < 6) return setError("Password must be at least 6 characters");
      if (newPassword !== confirmPassword) return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {};
      if (nameChanged) payload.name = name;
      if (passwordChanged) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await updateProfile(payload);

      setSuccess("Profile updated successfully!");
      setShowSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        onOpenChange(false);
        setShowSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={open ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed inset-0 z-120 ${open ? '' : 'pointer-events-none'}`}
          style={{ background: open ? 'rgba(0,0,0,0.18)' : 'transparent', backdropFilter: open ? 'blur(1px)' : 'blur(0px)', willChange: 'opacity, backdrop-filter' }}
          onClick={() => onOpenChange(false)}
        />

        {/* Panel */}
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={open ? { x: 0, opacity: 1 } : { x: '100%', opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-0 top-0 bottom-0 z-130 w-full max-w-105"
          style={{ background: "#FAFAF9", willChange: 'transform, opacity' }}
        >
          <div className="flex flex-col h-full">

            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{
                background: "#fff",
                borderBottom: "1px solid #EBEBEB",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "#18181B" }}
                >
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-[#18181B] tracking-tight">
                  My Profile
                </span>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F4F4F5]"
              >
                <X className="w-4 h-4 text-[#71717A]" />
              </button>
            </div>

            {/* Avatar Section */}
            <div
              className="px-6 py-8 flex flex-col items-center"
              style={{
                background: "#fff",
                borderBottom: "1px solid #EBEBEB",
              }}
            >
              <div className="relative group">
                <div
                  className="w-30 h-30 rounded-full flex items-center justify-center text-white text-2xl font-semibold"
                  style={{ background: "#18181B", letterSpacing: "-0.5px" }}
                >
                  {initials || <User className="w-8 h-8" />}
                </div>
                <button
                  className="absolute inset-0 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="mt-3 text-sm font-semibold text-[#18181B]">
                {user?.name || "Your Name"}
              </p>
              <p className="text-xs text-[#71717A] mt-0.5">{user?.email}</p>
            </div>

            {/* Tab Navigation */}
            <div
              className="flex px-6 pt-4 gap-1"
              style={{ background: "#FAFAF9" }}
            >
              {(["profile", "security"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSection(tab)}
                  className="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
                  style={{
                    background: activeSection === tab ? "#18181B" : "transparent",
                    color: activeSection === tab ? "#fff" : "#71717A",
                  }}
                >
                  {tab === "profile" ? "Profile Info" : "Security"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form onSubmit={handleSubmit} className="space-y-4">

                {activeSection === "profile" && (
                  <>
                    {/* Email Field */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
                        Email address
                      </label>
                      <div
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                        style={{
                          background: "#F4F4F5",
                          border: "1px solid #E4E4E7",
                        }}
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "#A1A1AA" }} />
                        <input
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="w-full bg-transparent text-sm outline-none"
                          style={{ color: "#A1A1AA" }}
                        />
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0"
                          style={{
                            background: "#E4E4E7",
                            color: "#71717A",
                          }}
                        >
                          Verified
                        </span>
                      </div>
                    </div>

                    {/* Name Field */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
                        Full name
                      </label>
                      <div
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                        style={{
                          background: "#fff",
                          border: "1px solid #E4E4E7",
                        }}
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#18181B";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(24,24,27,0.08)";
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#E4E4E7";
                          (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        }}
                      >
                        <User className="w-3.5 h-3.5 shrink-0" style={{ color: "#A1A1AA" }} />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full bg-transparent text-sm outline-none"
                          style={{ color: "#18181B" }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "security" && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
                      Change password
                    </p>

                    {/* Current Password */}
                    <PasswordField
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      show={showCurrentPw}
                      onToggle={() => setShowCurrentPw(!showCurrentPw)}
                    />

                    {/* New Password */}
                    <PasswordField
                      placeholder="New password"
                      value={newPassword}
                      onChange={setNewPassword}
                      show={showNewPw}
                      onToggle={() => setShowNewPw(!showNewPw)}
                    />

                    {/* Password Strength */}
                    {newPassword && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{
                                background: i <= pwStrength ? strengthColor[pwStrength] : "#E4E4E7",
                              }}
                            />
                          ))}
                        </div>
                        <p
                          className="text-[11px] font-medium"
                          style={{ color: strengthColor[pwStrength] }}
                        >
                          {strengthLabel[pwStrength]} password
                        </p>
                      </div>
                    )}

                    {/* Confirm Password */}
                    {newPassword && (
                      <PasswordField
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        show={showConfirmPw}
                        onToggle={() => setShowConfirmPw(!showConfirmPw)}
                        isMatch={confirmPassword ? confirmPassword === newPassword : undefined}
                      />
                    )}
                  </div>
                )}

                {/* Error / Success Messages */}
                {error && (
                  <div
                    className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#EF4444" }} />
                    <p className="text-sm" style={{ color: "#B91C1C" }}>{error}</p>
                  </div>
                )}

                {/* {success && (
                  <div
                    className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
                    style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                  >
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#22C55E" }} />
                    <p className="text-sm" style={{ color: "#15803D" }}>{success}</p>
                  </div>
                )} */}

                {/* Divider */}
                <div style={{ borderTop: "1px solid #EBEBEB", paddingTop: "16px" }}>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all"
                      style={{
                        background: "#F4F4F5",
                        color: "#3F3F46",
                        border: "1px solid #E4E4E7",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "#EBEBEB";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "#F4F4F5";
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all relative overflow-hidden"
                      style={{
                        background: loading ? "#52525B" : "#18181B",
                        color: "#fff",
                        border: "1px solid transparent",
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        "Save changes"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </Sheet>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent className="rounded-2xl border border-zinc-200 p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "#F0FDF4" }}
            >
              <CheckCircle2 className="w-6 h-6" style={{ color: "#22C55E" }} />
            </div>
            <AlertDialogTitle className="text-base font-semibold text-[#18181B]">
              All saved!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#71717A]">
              Your profile has been updated successfully.
            </AlertDialogDescription>
            <AlertDialogAction
              onClick={() => setShowSuccess(false)}
              className="mt-1 w-full py-2.5 text-sm font-medium rounded-xl"
              style={{ background: "#18181B", color: "#fff" }}
            >
              Done
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ---------- PasswordField sub-component ---------- */
function PasswordField({
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  isMatch,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  isMatch?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
      style={{
        background: "#fff",
        border: `1px solid ${isMatch === false ? "#FECACA" : isMatch === true ? "#BBF7D0" : "#E4E4E7"}`,
      }}
    >
      <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: "#A1A1AA" }} />
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm outline-none"
        style={{ color: "#18181B" }}
      />
      <button type="button" onClick={onToggle} className="shrink-0">
        {show ? (
          <EyeOff className="w-3.5 h-3.5" style={{ color: "#A1A1AA" }} />
        ) : (
          <Eye className="w-3.5 h-3.5" style={{ color: "#A1A1AA" }} />
        )}
      </button>
    </div>
  );
}