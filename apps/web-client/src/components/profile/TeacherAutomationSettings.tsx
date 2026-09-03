import {
  DeliveryChannel,
  type ITeacherPreferences,
  type ITeacherSubjectSetting,
} from "@scholarly/shared";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context-core";
import { fetchUserProfile, updateUserProfile } from "@/services/api";

const defaultSettings: ITeacherPreferences = {
  defaultLessonDurationMinutes: 60,
  defaultLessonPrice: 150,
  subjectSettings: [],
  paymentRequestChannels: [DeliveryChannel.EMAIL],
  reminderChannels: [DeliveryChannel.EMAIL],
  timezone: "Asia/Jerusalem",
};

const REMINDER_CHANNELS = [DeliveryChannel.EMAIL, DeliveryChannel.WHATSAPP] as const;

export function TeacherAutomationSettings({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { updateProfile } = useAuth();
  const [settings, setSettings] = useState<ITeacherPreferences>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);

  useEffect(() => {
    let active = true;
    void fetchUserProfile(userId).then((profile) => {
      if (active && profile.teacherPreferences) setSettings(profile.teacherPreferences);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const setSubject = (index: number, next: ITeacherSubjectSetting) => {
    setSettings((current) => ({
      ...current,
      subjectSettings: current.subjectSettings.map((item, itemIndex) =>
        itemIndex === index ? next : item,
      ),
    }));
  };

  const togglePaymentChannel = (channel: DeliveryChannel) => {
    setSettings((current) => {
      const selected = current.paymentRequestChannels.includes(channel);
      if (selected && current.paymentRequestChannels.length === 1) return current;
      return {
        ...current,
        paymentRequestChannels: selected
          ? current.paymentRequestChannels.filter((item) => item !== channel)
          : [...current.paymentRequestChannels, channel],
      };
    });
  };

  const toggleReminderChannel = (channel: DeliveryChannel.EMAIL | DeliveryChannel.WHATSAPP) => {
    setSettings((current) => {
      const selected = current.reminderChannels.includes(channel);
      if (selected && current.reminderChannels.length === 1) return current;
      return {
        ...current,
        reminderChannels: selected
          ? current.reminderChannels.filter((item) => item !== channel)
          : [...current.reminderChannels, channel],
      };
    });
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const profile = await updateUserProfile(userId, { teacherPreferences: settings });
      updateProfile(profile);
      setMessage("saved");
    } catch {
      setMessage("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("automation.title")}</CardTitle>
        <CardDescription>{t("automation.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={save}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="teacher-default-duration" className="space-y-1 text-sm">
              <span>{t("automation.defaultDuration")}</span>
              <Input
                id="teacher-default-duration"
                type="number"
                min={15}
                max={240}
                value={settings.defaultLessonDurationMinutes}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    defaultLessonDurationMinutes: Number(event.target.value),
                  }))
                }
                required
              />
            </label>
            <label htmlFor="teacher-default-price" className="space-y-1 text-sm">
              <span>{t("automation.defaultPrice")}</span>
              <Input
                id="teacher-default-price"
                type="number"
                min={1}
                step="0.01"
                value={settings.defaultLessonPrice}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    defaultLessonPrice: Number(event.target.value),
                  }))
                }
                required
              />
            </label>
          </div>

          <fieldset className="space-y-2 rounded-md border border-slate-700 p-3">
            <legend className="px-2 text-sm font-medium">{t("automation.subjectOverrides")}</legend>
            {settings.subjectSettings.map((subject, index) => (
              <div
                key={subject.subject || "new-subject"}
                className="grid gap-2 sm:grid-cols-[1fr_110px_110px_auto]"
              >
                <Input
                  placeholder={t("lessonForm.subject")}
                  value={subject.subject}
                  onChange={(event) =>
                    setSubject(index, { ...subject, subject: event.target.value })
                  }
                  required
                />
                <Input
                  aria-label={t("automation.duration")}
                  type="number"
                  min={15}
                  max={240}
                  placeholder={t("automation.duration")}
                  value={subject.durationMinutes ?? ""}
                  onChange={(event) =>
                    setSubject(index, {
                      ...subject,
                      durationMinutes: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
                <Input
                  aria-label={t("automation.price")}
                  type="number"
                  min={1}
                  placeholder={t("automation.price")}
                  value={subject.price ?? ""}
                  onChange={(event) =>
                    setSubject(index, {
                      ...subject,
                      price: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      subjectSettings: current.subjectSettings.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    }))
                  }
                >
                  {t("automation.remove")}
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              disabled={settings.subjectSettings.some((subject) => !subject.subject.trim())}
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  subjectSettings: [...current.subjectSettings, { subject: "" }],
                }))
              }
            >
              {t("automation.addSubject")}
            </Button>
          </fieldset>

          <fieldset className="space-y-2 rounded-md border border-slate-700 p-3">
            <legend className="px-2 text-sm font-medium">{t("automation.paymentChannels")}</legend>
            {[DeliveryChannel.EMAIL, DeliveryChannel.WHATSAPP, DeliveryChannel.SMS].map(
              (channel) => (
                <label key={channel} className="me-4 inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.paymentRequestChannels.includes(channel)}
                    onChange={() => togglePaymentChannel(channel)}
                  />
                  {t(`automation.channel.${channel}`)}
                </label>
              ),
            )}
            <p className="text-xs text-slate-400">{t("automation.smsLinkOnly")}</p>
          </fieldset>

          <fieldset className="space-y-2 rounded-md border border-slate-700 p-3">
            <legend className="px-2 text-sm font-medium">{t("automation.reminderChannels")}</legend>
            {REMINDER_CHANNELS.map((channel) => (
              <label key={channel} className="me-4 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.reminderChannels.includes(channel)}
                  onChange={() => toggleReminderChannel(channel)}
                />
                {t(`automation.channel.${channel}`)}
              </label>
            ))}
            <p className="text-xs text-slate-400">{t("automation.reminderTiming")}</p>
          </fieldset>

          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            {t("automation.connectionRequired")}
          </div>
          {message === "saved" ? (
            <p role="status" className="text-sm text-emerald-300">
              {t("automation.saved")}
            </p>
          ) : null}
          {message === "error" ? (
            <p role="alert" className="text-sm text-red-400">
              {t("automation.saveFailed")}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("profile.saving") : t("automation.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
