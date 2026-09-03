import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import { useContacts } from "@/hooks/useContacts";
import ContactsList from "../../components/Contacts/ContactsList";
import NewContactButton from "../../components/Contacts/NewContactButton/NewContactButton";

export default function ContactsPage() {
  const { t } = useTranslation();
  const { contacts, loading, error, fetchContacts } = useContacts();

  return (
    <div className="mx-auto mt-4 max-w-3xl">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-white">{t("contacts.title")}</h1>
        {loading ? <Spinner compact /> : null}
        {error ? (
          <div className="space-y-3" role="alert">
            <p className="text-sm text-red-400">{t("contacts.loadError")}</p>
            <Button type="button" variant="secondary" onClick={() => void fetchContacts()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : null}
        {!loading && !error ? <ContactsList contacts={contacts} /> : null}
      </div>
      <NewContactButton />
    </div>
  );
}
