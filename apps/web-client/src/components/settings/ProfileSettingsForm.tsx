import { DeliveryChannel, isDeliveryChannelEnabled } from "@scholarly/shared";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context-core";
import { useUpdateUserProfile, useUserProfile } from "@/hooks/useUserProfile";

interface IProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  allowWhatsApp: boolean;
  allowSMS: boolean;
}

const emptyProfile: IProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  allowWhatsApp: true,
  allowSMS: true,
};

const whatsAppEnabled = isDeliveryChannelEnabled(DeliveryChannel.WHATSAPP);
const smsEnabled = isDeliveryChannelEnabled(DeliveryChannel.SMS);

export function ProfileSettingsForm({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { updateProfile } = useAuth();
  const [form, setForm] = useState<IProfileForm>(emptyProfile);
  const profileQuery = useUserProfile(userId);
  const updateProfileMutation = useUpdateUserProfile(userId);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phoneNumber: profile.phone.number ?? "",
      allowWhatsApp: profile.phone.allowWhatsApp ?? true,
      allowSMS: profile.phone.allowSMS ?? true,
    });
  }, [profileQuery.data]);

  const setField = <Key extends keyof IProfileForm>(key: Key, value: IProfileForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    updateProfileMutation.reset();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfileMutation.mutate(
      {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: {
          number: form.phoneNumber,
          allowWhatsApp: form.allowWhatsApp,
          allowSMS: form.allowSMS,
        },
      },
      { onSuccess: (profile) => updateProfile(profile) },
    );
  };

  return (
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
              dir="ltr"
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
              dir="ltr"
              value={form.phoneNumber}
              onChange={(event) => setField("phoneNumber", event.target.value)}
              autoComplete="tel"
              minLength={9}
              required
            />
          </label>

          {whatsAppEnabled || smsEnabled ? (
            <div className="space-y-2 rounded-md border border-slate-800 p-3">
              {whatsAppEnabled ? (
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.allowWhatsApp}
                    onChange={(event) => setField("allowWhatsApp", event.target.checked)}
                  />
                  {t("auth.whatsappConsent")}
                </label>
              ) : null}
              {smsEnabled ? (
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.allowSMS}
                    onChange={(event) => setField("allowSMS", event.target.checked)}
                  />
                  {t("auth.smsConsent")}
                </label>
              ) : null}
            </div>
          ) : null}

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
  );
}
