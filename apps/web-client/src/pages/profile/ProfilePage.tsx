import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Spinner } from "@/components/common/Spinner";
import { TeacherAutomationSettings } from "@/components/profile/TeacherAutomationSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context-core";
import { useUpdateUserProfile, useUserProfile } from "@/hooks/useUserProfile";

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  allowWhatsApp: boolean;
  allowSMS: boolean;
}

const emptyProfile: ProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  allowWhatsApp: false,
  allowSMS: false,
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const userId = user?.id;
  const homePath = user?.role === "teacher" ? "/teacher" : "/student";
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const profileQuery = useUserProfile(userId);
  const updateProfileMutation = useUpdateUserProfile(userId ?? "");

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;

    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phoneNumber: profile.phone.number ?? "",
      allowWhatsApp: profile.phone.allowWhatsApp ?? false,
      allowSMS: profile.phone.allowSMS ?? false,
    });
  }, [profileQuery.data]);

  const setField = <Key extends keyof ProfileForm>(key: Key, value: ProfileForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    updateProfileMutation.reset();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    try {
      const profile = await updateProfileMutation.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: {
          number: form.phoneNumber,
          allowWhatsApp: form.allowWhatsApp,
          allowSMS: form.allowSMS,
        },
      });
      updateProfile(profile);
    } catch {
      // The localized mutation error is rendered below.
    }
  };

  if (profileQuery.isPending) return <Spinner />;
  if (profileQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl space-y-3" role="alert">
        <p className="text-sm text-red-400">{t("profile.loadFailed")}</p>
        <Button type="button" variant="secondary" onClick={() => void profileQuery.refetch()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <nav
        className="flex flex-wrap items-center justify-between gap-2"
        aria-label={t("profile.navigation")}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate(homePath);
            }
          }}
        >
          {t("common.back")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate(homePath)}>
          {t("common.home")}
        </Button>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="profile-first-name" className="space-y-1 text-sm">
                <span>{t("auth.firstName")}</span>
                <Input
                  id="profile-first-name"
                  value={form.firstName}
                  onChange={(event) => setField("firstName", event.target.value)}
                  autoComplete="given-name"
                  required
                />
              </label>
              <label htmlFor="profile-last-name" className="space-y-1 text-sm">
                <span>{t("auth.lastName")}</span>
                <Input
                  id="profile-last-name"
                  value={form.lastName}
                  onChange={(event) => setField("lastName", event.target.value)}
                  autoComplete="family-name"
                  required
                />
              </label>
            </div>

            <label htmlFor="profile-email" className="block space-y-1 text-sm">
              <span>{t("auth.email")}</span>
              <Input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label htmlFor="profile-phone" className="block space-y-1 text-sm">
              <span>{t("auth.phone")}</span>
              <Input
                id="profile-phone"
                type="tel"
                value={form.phoneNumber}
                onChange={(event) => setField("phoneNumber", event.target.value)}
                autoComplete="tel"
                minLength={9}
                required
              />
            </label>

            <div className="space-y-2 rounded-md border border-slate-800 p-3">
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={form.allowWhatsApp}
                  onChange={(event) => setField("allowWhatsApp", event.target.checked)}
                />
                {t("auth.whatsappConsent")}
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={form.allowSMS}
                  onChange={(event) => setField("allowSMS", event.target.checked)}
                />
                {t("auth.smsConsent")}
              </label>
            </div>

            {updateProfileMutation.isError ? (
              <p className="text-sm text-red-400" role="alert">
                {t("profile.saveFailed")}
              </p>
            ) : null}
            {updateProfileMutation.isSuccess ? (
              <p className="text-sm text-emerald-400" role="status">
                {t("profile.saved")}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? t("profile.saving") : t("profile.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {user?.role === "teacher" ? <TeacherAutomationSettings userId={user.id} /> : null}
    </div>
  );
}
