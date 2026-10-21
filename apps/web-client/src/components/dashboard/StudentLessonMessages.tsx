import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type DirectoryUser,
  fetchLessonMessages,
  markLessonMessagesViewed,
  openLessonMessagePdf,
} from "@/services/api";

function formatMessageDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StudentLessonMessages({ teachers }: { teachers: DirectoryUser[] }) {
  const queryClient = useQueryClient();
  const messagesQuery = useQuery({ queryKey: ["lesson-messages"], queryFn: fetchLessonMessages });
  const [newMessageIds, setNewMessageIds] = useState<ReadonlySet<string> | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ title: string; url: string } | null>(null);
  const teacherNames = new Map(
    teachers.map((teacher) => [teacher._id, `${teacher.firstName} ${teacher.lastName}`]),
  );

  useEffect(() => {
    if (newMessageIds || !messagesQuery.data) return;
    const unseenIds = messagesQuery.data
      .filter((message) => !message.studentViewedAt)
      .map((message) => message._id);
    setNewMessageIds(new Set(unseenIds));
    if (unseenIds.length === 0) return;
    void markLessonMessagesViewed().then(() =>
      queryClient.invalidateQueries({ queryKey: ["lesson-messages"] }),
    );
  }, [newMessageIds, messagesQuery.data, queryClient]);

  useEffect(() => {
    return () => {
      if (pdfPreview) URL.revokeObjectURL(pdfPreview.url);
    };
  }, [pdfPreview]);

  const showPdf = async (messageId: string, title: string) => {
    const url = await openLessonMessagePdf(messageId);
    setPdfPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return { title, url };
    });
  };

  const closePdf = () => {
    setPdfPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const messages = messagesQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>הודעות מהמורים</CardTitle>
        <CardDescription>הודעות שנשלחו אליך על שיעורים, כולל קובץ ה־PDF שצורף.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pdfPreview ? (
          <div className="space-y-3 rounded-lg border border-slate-700 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-white">{pdfPreview.title}</h3>
              <Button type="button" size="sm" variant="secondary" onClick={closePdf}>
                סגירה
              </Button>
            </div>
            <iframe
              title={pdfPreview.title}
              src={pdfPreview.url}
              className="h-[60vh] w-full rounded-md border border-slate-700 bg-white"
            />
          </div>
        ) : null}
        {messages.map((message) => (
          <article key={message._id} className="space-y-2 rounded-lg border border-slate-700 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 font-semibold text-white">
                  {message.subject}
                  {newMessageIds?.has(message._id) ? (
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-slate-950">
                      חדש
                    </span>
                  ) : null}
                </h3>
                <p className="text-xs text-slate-400">
                  {teacherNames.get(message.teacherId) ?? "מורה"} ·{" "}
                  {formatMessageDate(message.scheduledAt)}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void showPdf(message._id, message.subject)}
              >
                צפייה ב־PDF
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-slate-300">{message.message}</p>
          </article>
        ))}
        {messagesQuery.isSuccess && messages.length === 0 ? (
          <p className="text-sm text-slate-300">עדיין לא התקבלו הודעות.</p>
        ) : null}
        {messagesQuery.isError ? (
          <p role="alert" className="text-sm text-red-400">
            לא ניתן לטעון את ההודעות.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
