import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectGmail, disconnectGmail, fetchGmailConnection } from "@/services/api";

export function GmailConnectionCard() {
  const queryClient = useQueryClient();
  const gmailQuery = useQuery({ queryKey: ["gmail-connection"], queryFn: fetchGmailConnection });
  const disconnectMutation = useMutation({
    mutationFn: disconnectGmail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gmail-connection"] }),
  });
  const connection = gmailQuery.data;

  return (
    <Card id="connections" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>חיבור Google</CardTitle>
        <CardDescription>
          החיבור מאפשר שליחת מיילים מהכתובת שלך ויצירת שיעורים ביומן Google עם קישור Meet. הסיסמה
          שלך לא נשמרת במערכת.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connection?.connected ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="flex items-center gap-2 text-sm text-emerald-200">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              מחובר: <bdi>{connection.senderAddress}</bdi>
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              ניתוק
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 p-4">
            <p className="text-sm text-slate-300">
              {connection?.configured
                ? "החשבון לא מחובר. בלי חיבור לא יישלחו מיילים ולא ייווצרו אירועים ביומן."
                : "יש להגדיר תחילה את פרטי OAuth של Google בשרת."}
            </p>
            <Button
              type="button"
              onClick={() => void connectGmail()}
              disabled={!connection?.configured}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              חיבור חשבון Google
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
